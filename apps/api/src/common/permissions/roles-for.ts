export type SystemRoleKey = "owner" | "admin" | "manager" | "member" | "viewer";

const ALL_ROLES: SystemRoleKey[] = ["owner", "admin", "manager", "member", "viewer"];
const WRITE_ROLES: SystemRoleKey[] = ["owner", "admin", "manager", "member"];

/**
 * Which system roles get a given permission key — the single source of
 * truth for both the seed script (packages/db/scripts/seed-rbac.js,
 * imported from the compiled output the same way it imports PERMISSIONS)
 * and its own unit test. See ARCHITECTURE.md "RBAC scope" for the matrix
 * this encodes, and DECISIONS.md "Deletion governance" for why delete-type
 * keys are granted broadly — the real restriction on deleting a specific
 * record is DeletionGuardService, not the role. The role-level "x:delete"
 * key only keeps Viewer out of delete entirely.
 */
export function rolesFor(resource: string, action: string): SystemRoleKey[] {
  if (resource === "org_settings" || resource === "members" || resource === "marketing_integrations") {
    // Org-level settings, membership management, and ad-platform
    // integration credentials — restricted to Owner/Admin even for reads,
    // since marketing_integrations stores a real access token per channel.
    return ["owner", "admin"];
  }
  if (resource === "ad_campaign_metrics") {
    // The pulled performance numbers themselves aren't sensitive the way
    // the credential is — readable by everyone, same as reports/inventory.
    // No write action exists here at all; only the internal sync job
    // writes, via its own service call, not a user-facing endpoint.
    return ALL_ROLES;
  }
  if (resource === "companies" || resource === "countries" || resource === "brands" || resource === "websites") {
    // Global master data (legal entities, countries/tax rates, brands,
    // websites) defines the business structure itself. Writes stay
    // Owner/Admin only, but reads are open to all roles — Manager/Member
    // need to read these lists to populate the Company/Country/Brand
    // selectors on Customer/Quote/SalesOrder/PurchaseOrder/Supplier/
    // Product/Campaign create forms (Sub-phase B). See DECISIONS.md
    // "Global multi-country, multi-company, multi-brand architecture".
    return action === "read" ? ALL_ROLES : ["owner", "admin"];
  }
  if (resource === "deletion_grants") {
    return ["owner"]; // Owner is the only one who may delegate delete access — see DECISIONS.md.
  }
  if (resource === "reports") {
    return ALL_ROLES;
  }
  if (resource === "inventory") {
    return action === "read" ? ALL_ROLES : WRITE_ROLES;
  }
  // Generic CRUD-group resources: customers, contacts, products, categories,
  // warehouses, quotes, sales_orders, shipments, suppliers, purchase_orders,
  // goods_receipts, segments, email_templates, campaigns, opportunities,
  // invoices, support_tickets.
  return action === "read" ? ALL_ROLES : WRITE_ROLES;
}
