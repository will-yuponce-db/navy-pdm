import { describe, it, expect } from "vitest";
import { navItems } from "../../constants/navItems";

describe("navItems constants", () => {
  it("exports an array of navigation items", () => {
    expect(Array.isArray(navItems)).toBe(true);
    expect(navItems.length).toBeGreaterThan(0);
  });

  it("has the correct number of navigation items", () => {
    expect(navItems).toHaveLength(6);
  });

  it("each navigation item has required properties", () => {
    navItems.forEach((item, index) => {
      expect(item).toHaveProperty("title");
      expect(item).toHaveProperty("icon");
      expect(item).toHaveProperty("route");

      expect(typeof item.title).toBe("string");
      expect(typeof item.icon).toBe("string");
      expect(typeof item.route).toBe("string");

      expect(item.title.length).toBeGreaterThan(0);
      expect(item.icon.length).toBeGreaterThan(0);
      expect(item.route.length).toBeGreaterThan(0);
    });
  });

  it("has correct navigation items", () => {
    const expectedItems = [
      { title: "Home", icon: "home", route: "/" },
      { title: "Work Order", icon: "work", route: "/work-order" },
      { title: "Readiness Dashboard", icon: "check_box", route: "/readiness" },
      { title: "Assets", icon: "inventory_2", route: "/assets" },
      { title: "Parts", icon: "category", route: "/parts" },
      { title: "About", icon: "info", route: "/about" },
    ];

    expect(navItems).toEqual(expectedItems);
  });

  it("has unique titles", () => {
    const titles = navItems.map((item) => item.title);
    const uniqueTitles = new Set(titles);
    expect(uniqueTitles.size).toBe(titles.length);
  });

  it("has unique icons", () => {
    const icons = navItems.map((item) => item.icon);
    const uniqueIcons = new Set(icons);
    expect(uniqueIcons.size).toBe(icons.length);
  });

  it("has unique routes", () => {
    const routes = navItems.map((item) => item.route);
    const uniqueRoutes = new Set(routes);
    expect(uniqueRoutes.size).toBe(routes.length);
  });

  it("routes start with forward slash", () => {
    navItems.forEach((item) => {
      expect(item.route).toMatch(/^\//);
    });
  });

  it("has valid route paths", () => {
    const validRoutes = [
      "/",
      "/work-order",
      "/readiness",
      "/assets",
      "/parts",
      "/about",
    ];
    navItems.forEach((item) => {
      expect(validRoutes).toContain(item.route);
    });
  });

  it("has appropriate icon names", () => {
    const validIcons = [
      "home",
      "work",
      "check_box",
      "inventory_2",
      "category",
      "info",
    ];
    navItems.forEach((item) => {
      expect(validIcons).toContain(item.icon);
    });
  });
});
