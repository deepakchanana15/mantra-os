/**
 * Single source of truth for permission keys — used by every controller's
 * @RequirePermission() and by the seed script that builds the five system
 * roles' RolePermission bundles (see ARCHITECTURE.md "RBAC scope"). Add a
 * key here, not as a raw string in a controller.
 */
export const PERMISSIONS = {
  ORG_SETTINGS_UPDATE: "org_settings:update",
  MEMBERS_READ: "members:read",
  MEMBERS_UPDATE: "members:update",
  MEMBERS_DELETE: "members:delete",
  DELETION_GRANTS_MANAGE: "deletion_grants:manage",

  CUSTOMERS_CREATE: "customers:create",
  CUSTOMERS_READ: "customers:read",
  CUSTOMERS_UPDATE: "customers:update",
  CUSTOMERS_DELETE: "customers:delete",

  CONTACTS_CREATE: "contacts:create",
  CONTACTS_READ: "contacts:read",
  CONTACTS_UPDATE: "contacts:update",
  CONTACTS_DELETE: "contacts:delete",

  PRODUCTS_CREATE: "products:create",
  PRODUCTS_READ: "products:read",
  PRODUCTS_UPDATE: "products:update",
  PRODUCTS_DELETE: "products:delete",

  CATEGORIES_CREATE: "categories:create",
  CATEGORIES_READ: "categories:read",
  CATEGORIES_UPDATE: "categories:update",
  CATEGORIES_DELETE: "categories:delete",

  WAREHOUSES_CREATE: "warehouses:create",
  WAREHOUSES_READ: "warehouses:read",
  WAREHOUSES_UPDATE: "warehouses:update",
  WAREHOUSES_DELETE: "warehouses:delete",

  INVENTORY_READ: "inventory:read",
  INVENTORY_ADJUST: "inventory:adjust",

  QUOTES_CREATE: "quotes:create",
  QUOTES_READ: "quotes:read",
  QUOTES_UPDATE: "quotes:update",
  QUOTES_DELETE: "quotes:delete",

  SALES_ORDERS_CREATE: "sales_orders:create",
  SALES_ORDERS_READ: "sales_orders:read",
  SALES_ORDERS_UPDATE: "sales_orders:update",
  SALES_ORDERS_DELETE: "sales_orders:delete",

  SHIPMENTS_CREATE: "shipments:create",
  SHIPMENTS_READ: "shipments:read",
  SHIPMENTS_UPDATE: "shipments:update",
  SHIPMENTS_DELETE: "shipments:delete",

  SUPPLIERS_CREATE: "suppliers:create",
  SUPPLIERS_READ: "suppliers:read",
  SUPPLIERS_UPDATE: "suppliers:update",
  SUPPLIERS_DELETE: "suppliers:delete",

  PURCHASE_ORDERS_CREATE: "purchase_orders:create",
  PURCHASE_ORDERS_READ: "purchase_orders:read",
  PURCHASE_ORDERS_UPDATE: "purchase_orders:update",
  PURCHASE_ORDERS_DELETE: "purchase_orders:delete",

  GOODS_RECEIPTS_CREATE: "goods_receipts:create",
  GOODS_RECEIPTS_READ: "goods_receipts:read",

  SEGMENTS_CREATE: "segments:create",
  SEGMENTS_READ: "segments:read",
  SEGMENTS_UPDATE: "segments:update",
  SEGMENTS_DELETE: "segments:delete",

  EMAIL_TEMPLATES_CREATE: "email_templates:create",
  EMAIL_TEMPLATES_READ: "email_templates:read",
  EMAIL_TEMPLATES_UPDATE: "email_templates:update",
  EMAIL_TEMPLATES_DELETE: "email_templates:delete",

  CAMPAIGNS_CREATE: "campaigns:create",
  CAMPAIGNS_READ: "campaigns:read",
  CAMPAIGNS_UPDATE: "campaigns:update",
  CAMPAIGNS_DELETE: "campaigns:delete",
  CAMPAIGNS_SEND: "campaigns:send",

  REPORTS_READ: "reports:read",
} as const;

export type PermissionKey = (typeof PERMISSIONS)[keyof typeof PERMISSIONS];
