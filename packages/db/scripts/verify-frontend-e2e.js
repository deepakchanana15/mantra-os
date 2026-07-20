/**
 * Full-stack verification, not part of the app: creates a real test org +
 * user + membership, then drives the actual running Next.js app (which
 * itself proxies to the actual running NestJS API) over HTTP with real
 * cookies — login, org selection, dashboard, customer create/view/delete.
 * Requires both `node dist/src/main.js` (apps/api) and `next start`
 * (apps/web) to be running. Cleans up all test data afterward regardless
 * of outcome.
 */
require("dotenv").config();
const crypto = require("crypto");
const bcrypt = require("bcryptjs");
const { PrismaClient } = require("@prisma/client");

const WEB_BASE_URL = process.env.WEB_BASE_URL || "http://localhost:3000";

function cookieHeader(setCookieValues, existing = {}) {
  const jar = { ...existing };
  for (const raw of setCookieValues) {
    const [pair] = raw.split(";");
    const eq = pair.indexOf("=");
    jar[pair.slice(0, eq)] = pair.slice(eq + 1);
  }
  return jar;
}

function toHeader(jar) {
  return Object.entries(jar)
    .map(([k, v]) => `${k}=${v}`)
    .join("; ");
}

let checks = 0;
let passed = 0;
function check(label, condition) {
  checks++;
  if (condition) {
    passed++;
    console.log(`✅ ${label}`);
  } else {
    console.log(`❌ ${label}`);
  }
}

async function main() {
  const prisma = new PrismaClient();
  const email = `e2e-${crypto.randomBytes(4).toString("hex")}@example.com`;
  const password = "correct-horse-battery-staple";
  const passwordHash = await bcrypt.hash(password, 10);

  const ownerRole = await prisma.role.findFirst({ where: { organizationId: null, key: "owner" } });
  if (!ownerRole) throw new Error("No seeded 'owner' role found — run seed-rbac.js first");

  const org = await prisma.organization.create({ data: { name: "E2E Test Org", slug: `e2e-${Date.now()}` } });
  const user = await prisma.user.create({ data: { email, passwordHash, name: "E2E Test User" } });
  await prisma.membership.create({ data: { organizationId: org.id, userId: user.id, roleId: ownerRole.id } });

  let customerId;

  try {
    // 1. Login
    let res = await fetch(`${WEB_BASE_URL}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    let cookies = cookieHeader(res.headers.getSetCookie());
    check("Login succeeds and sets session cookie", res.ok && cookies.mantraos_session);

    // 2. Org picker page shows the test org
    res = await fetch(`${WEB_BASE_URL}/orgs`, { headers: { Cookie: toHeader(cookies) } });
    const orgsHtml = await res.text();
    check("Org picker page loads and lists the test org", res.ok && orgsHtml.includes("E2E Test Org"));

    // 3. Select the org
    res = await fetch(`${WEB_BASE_URL}/api/org/select`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Cookie: toHeader(cookies) },
      body: JSON.stringify({ organizationId: org.id }),
    });
    cookies = cookieHeader(res.headers.getSetCookie(), cookies);
    check("Org selection succeeds and sets org cookie", res.ok && cookies.mantraos_org);

    // 4. Dashboard renders with real data
    res = await fetch(`${WEB_BASE_URL}/dashboard`, { headers: { Cookie: toHeader(cookies) } });
    const dashboardHtml = await res.text();
    check("Dashboard page loads with KPI data", res.ok && dashboardHtml.includes("Active customers"));

    // 5. Customers list (empty state)
    res = await fetch(`${WEB_BASE_URL}/customers`, { headers: { Cookie: toHeader(cookies) } });
    const emptyListHtml = await res.text();
    check("Customers list loads (empty state)", res.ok && emptyListHtml.includes("No customers yet"));

    // 6. Create a customer via the proxy
    res = await fetch(`${WEB_BASE_URL}/api/v1/customers`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Cookie: toHeader(cookies) },
      body: JSON.stringify({ name: "E2E Test Customer", type: "COMPANY" }),
    });
    const created = await res.json();
    customerId = created.id;
    check("Customer created via proxy", res.ok && !!customerId);

    // 7. Detail page shows the new customer
    res = await fetch(`${WEB_BASE_URL}/customers/${customerId}`, { headers: { Cookie: toHeader(cookies) } });
    const detailHtml = await res.text();
    check("Customer detail page shows the new customer", res.ok && detailHtml.includes("E2E Test Customer"));

    // 8. Delete it (test user is Owner — the escalation floor, so self-delete is allowed)
    res = await fetch(`${WEB_BASE_URL}/api/v1/customers/${customerId}`, {
      method: "DELETE",
      headers: { Cookie: toHeader(cookies) },
    });
    check("Delete succeeds for Owner (escalation floor)", res.ok);
    customerId = null;

    // 9. Products, Warehouses, Suppliers pages load (same proven pattern as
    // Customers — checked here for page-load correctness, not re-testing
    // the CRUD pattern itself).
    res = await fetch(`${WEB_BASE_URL}/products`, { headers: { Cookie: toHeader(cookies) } });
    check("Products list page loads", res.ok);
    res = await fetch(`${WEB_BASE_URL}/warehouses`, { headers: { Cookie: toHeader(cookies) } });
    check("Warehouses list page loads", res.ok);
    res = await fetch(`${WEB_BASE_URL}/suppliers`, { headers: { Cookie: toHeader(cookies) } });
    check("Suppliers list page loads", res.ok);
    res = await fetch(`${WEB_BASE_URL}/settings`, { headers: { Cookie: toHeader(cookies) } });
    check("Settings page loads", res.ok);
    res = await fetch(`${WEB_BASE_URL}/marketing`, { headers: { Cookie: toHeader(cookies) } });
    check("Marketing page loads", res.ok);

    // 10. The real cross-domain logic: Sales Order -> Shipment must write a
    // negative InventoryTransaction and decrement StockLevel. This is the
    // one piece of business logic in the new domains that isn't just CRUD.
    const fetchJson = async (path, init) => {
      const r = await fetch(`${WEB_BASE_URL}${path}`, {
        ...init,
        headers: { "Content-Type": "application/json", Cookie: toHeader(cookies), ...(init?.headers ?? {}) },
      });
      return { ok: r.ok, status: r.status, body: await r.json() };
    };

    const customer = await fetchJson("/api/v1/customers", {
      method: "POST",
      body: JSON.stringify({ name: "E2E Sales Customer", type: "COMPANY" }),
    });
    const product = await fetchJson("/api/v1/products", {
      method: "POST",
      body: JSON.stringify({ sku: `E2E-${Date.now()}`, name: "E2E Widget", unitPrice: 10 }),
    });
    const warehouse = await fetchJson("/api/v1/warehouses", { method: "POST", body: JSON.stringify({ name: "E2E Warehouse" }) });

    // Stock starts at 0 — receive 20 via a Supplier/PurchaseOrder/GoodsReceipt first.
    const supplier = await fetchJson("/api/v1/suppliers", { method: "POST", body: JSON.stringify({ name: "E2E Supplier" }) });
    const po = await fetchJson("/api/v1/purchase-orders", {
      method: "POST",
      body: JSON.stringify({ supplierId: supplier.body.id, lines: [{ productId: product.body.id, quantity: 20, unitCost: 5 }] }),
    });
    const receipt = await fetchJson("/api/v1/goods-receipts", {
      method: "POST",
      body: JSON.stringify({
        purchaseOrderId: po.body.id,
        warehouseId: warehouse.body.id,
        lines: [{ purchaseOrderLineId: po.body.lines[0].id, quantity: 20 }],
      }),
    });
    check("Goods receipt recorded (Purchasing -> Inventory)", receipt.ok);

    let stock = await fetchJson(`/api/v1/inventory/stock?productId=${product.body.id}&warehouseId=${warehouse.body.id}`);
    check("Stock level is 20 after receiving 20", stock.body[0]?.quantityOnHand === 20);

    // Now sell 8 of them via Sales Order -> Shipment.
    const so = await fetchJson("/api/v1/sales-orders", {
      method: "POST",
      body: JSON.stringify({ customerId: customer.body.id, lines: [{ productId: product.body.id, quantity: 8, unitPrice: 10 }] }),
    });
    const shipment = await fetchJson("/api/v1/shipments", {
      method: "POST",
      body: JSON.stringify({
        salesOrderId: so.body.id,
        warehouseId: warehouse.body.id,
        lines: [{ salesOrderLineId: so.body.lines[0].id, quantity: 8 }],
      }),
    });
    check("Shipment created (Sales -> Inventory)", shipment.ok);

    stock = await fetchJson(`/api/v1/inventory/stock?productId=${product.body.id}&warehouseId=${warehouse.body.id}`);
    check("Stock level is 12 after shipping 8 of 20 (20 - 8 = 12)", stock.body[0]?.quantityOnHand === 12);

    const updatedSo = await fetchJson(`/api/v1/sales-orders/${so.body.id}`);
    check("Sales order status auto-updated to SHIPPED (full quantity shipped)", updatedSo.body.status === "SHIPPED");

    // 11. No session at all -> redirected to login
    res = await fetch(`${WEB_BASE_URL}/dashboard`, { redirect: "manual" });
    check("No session redirects away from a protected page", res.status === 307 || res.status === 302);

    console.log(`\n${passed}/${checks} checks passed`);
    if (passed !== checks) process.exitCode = 1;
  } finally {
    // Every table carries organizationId directly (the RLS design decision
    // in DATABASE.md), so cleanup is just "delete by org" in FK-dependency
    // order — no need to track individual IDs through the whole script.
    await prisma.shipmentLine.deleteMany({ where: { organizationId: org.id } });
    await prisma.shipment.deleteMany({ where: { organizationId: org.id } });
    await prisma.salesOrderLine.deleteMany({ where: { organizationId: org.id } });
    await prisma.salesOrder.deleteMany({ where: { organizationId: org.id } });
    await prisma.quoteLine.deleteMany({ where: { organizationId: org.id } });
    await prisma.quote.deleteMany({ where: { organizationId: org.id } });
    await prisma.goodsReceiptLine.deleteMany({ where: { organizationId: org.id } });
    await prisma.goodsReceipt.deleteMany({ where: { organizationId: org.id } });
    await prisma.purchaseOrderLine.deleteMany({ where: { organizationId: org.id } });
    await prisma.purchaseOrder.deleteMany({ where: { organizationId: org.id } });
    await prisma.inventoryTransaction.deleteMany({ where: { organizationId: org.id } });
    await prisma.stockLevel.deleteMany({ where: { organizationId: org.id } });
    await prisma.contact.deleteMany({ where: { organizationId: org.id } });
    await prisma.customer.deleteMany({ where: { organizationId: org.id } });
    await prisma.product.deleteMany({ where: { organizationId: org.id } });
    await prisma.warehouse.deleteMany({ where: { organizationId: org.id } });
    await prisma.supplier.deleteMany({ where: { organizationId: org.id } });
    // AuditLog and Notification rows reference the test user with RESTRICT
    // foreign keys — by design, an audit trail must never silently lose who
    // performed an action (see DECISIONS.md "Deletion governance"), and the
    // Notification row here is proof the record.deleted -> Notifications
    // event flow actually fired (the emitAsync fix). Delete both before the user.
    await prisma.notification.deleteMany({ where: { organizationId: org.id } });
    await prisma.auditLog.deleteMany({ where: { organizationId: org.id } });
    await prisma.membership.deleteMany({ where: { organizationId: org.id } });
    await prisma.user.delete({ where: { id: user.id } });
    await prisma.organization.delete({ where: { id: org.id } });
    await prisma.$disconnect();
  }
}

main().catch((err) => {
  console.error("Verification failed:", err);
  process.exit(1);
});
