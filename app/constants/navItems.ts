// Base navigation items
export const baseNavItems: {
  title: string;
  icon: string;
  route: string;
  roles?: string[];
}[] = [
  {
    title: "Home",
    icon: "home",
    route: "/",
  },
  {
    title: "Work Order",
    icon: "work",
    route: "/work-order",
  },
  {
    title: "Readiness Dashboard",
    icon: "check_box",
    route: "/readiness",
  },
  {
    title: "Asset Management",
    icon: "inventory_2",
    route: "/assets",
  },
  {
    title: "Parts",
    icon: "category",
    route: "/parts",
  },
  {
    title: "Maintenance Schedule",
    icon: "schedule",
    route: "/maintenance-schedule",
  },
  {
    title: "About",
    icon: "info",
    route: "/about",
  },
];

// SPO-specific navigation (Strategic focus)
export const spoNavItems = [
  {
    title: "Strategic Dashboard",
    icon: "dashboard",
    route: "/",
  },
  {
    title: "Fleet Readiness",
    icon: "check_box",
    route: "/readiness",
  },
  {
    title: "Asset Overview",
    icon: "inventory_2",
    route: "/assets",
  },
  {
    title: "Budget & Costs",
    icon: "account_balance",
    route: "/budget",
  },
  {
    title: "Risk Assessment",
    icon: "warning",
    route: "/risk",
  },
  {
    title: "Performance Analytics",
    icon: "analytics",
    route: "/analytics",
  },
  {
    title: "Maintenance Schedule",
    icon: "schedule",
    route: "/maintenance-schedule",
  },
  {
    title: "Reports",
    icon: "assessment",
    route: "/reports",
  },
];

// Maintainer-specific navigation (Operational focus)
export const maintainerNavItems = [
  {
    title: "My Dashboard",
    icon: "dashboard",
    route: "/",
  },
  {
    title: "My Work Orders",
    icon: "work",
    route: "/work-order",
  },
  {
    title: "Parts & Inventory",
    icon: "category",
    route: "/parts",
  },
  {
    title: "Asset Details",
    icon: "inventory_2",
    route: "/assets",
  },
  {
    title: "Maintenance Schedule",
    icon: "schedule",
    route: "/maintenance-schedule",
  },
  {
    title: "Technical Docs",
    icon: "description",
    route: "/docs",
  },
  {
    title: "Mobile Tools",
    icon: "phone_android",
    route: "/mobile",
  },
];

// Legacy export for backward compatibility
export const navItems = baseNavItems;
