import {
  Boxes,
  ClipboardList,
  LayoutDashboard,
  LifeBuoy,
  LineChart,
  Mail,
  Package,
  PackageCheck,
  Receipt,
  Settings,
  ShoppingCart,
  Target,
  Truck,
  Users,
  Warehouse,
} from "lucide-react";

export interface NavItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
}

export interface NavGroup {
  label: string;
  items: NavItem[];
}

/** Matches the Phase 1 navigation model in ARCHITECTURE.md. */
export const NAV_TOP: NavItem = { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard };

export const NAV_GROUPS: NavGroup[] = [
  {
    label: "CRM",
    items: [
      { label: "Customers", href: "/customers", icon: Users },
      { label: "Contacts", href: "/contacts", icon: Users },
    ],
  },
  {
    label: "Catalog",
    items: [
      { label: "Products", href: "/products", icon: Package },
      { label: "Categories", href: "/categories", icon: Boxes },
    ],
  },
  {
    label: "Inventory",
    items: [
      { label: "Warehouses", href: "/warehouses", icon: Warehouse },
      { label: "Stock", href: "/inventory", icon: ClipboardList },
    ],
  },
  {
    label: "Sales",
    items: [
      { label: "Opportunities", href: "/opportunities", icon: Target },
      { label: "Quotes", href: "/quotes", icon: ShoppingCart },
      { label: "Sales Orders", href: "/sales-orders", icon: ShoppingCart },
      { label: "Shipments", href: "/shipments", icon: Truck },
      { label: "Invoices", href: "/invoices", icon: Receipt },
    ],
  },
  {
    label: "Purchasing",
    items: [
      { label: "Suppliers", href: "/suppliers", icon: Truck },
      { label: "Purchase Orders", href: "/purchase-orders", icon: ShoppingCart },
      { label: "Goods Receipts", href: "/goods-receipts", icon: PackageCheck },
    ],
  },
  {
    label: "Support",
    items: [{ label: "Tickets", href: "/support-tickets", icon: LifeBuoy }],
  },
  {
    label: "More",
    items: [
      { label: "Marketing", href: "/marketing", icon: Mail },
      { label: "Reports", href: "/reports", icon: LineChart },
    ],
  },
];

export const NAV_BOTTOM: NavItem = { label: "Settings", href: "/settings", icon: Settings };

export const ALL_NAV_ITEMS: NavItem[] = [NAV_TOP, ...NAV_GROUPS.flatMap((g) => g.items), NAV_BOTTOM];
