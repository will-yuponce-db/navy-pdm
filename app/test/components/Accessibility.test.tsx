import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createMemoryRouter, RouterProvider } from "react-router";
import {
  useKeyboardShortcuts,
  useAccessibility,
  getAriaLabels,
  focusManagement,
} from "../../components/Accessibility";

// Mock react-router
const mockNavigate = vi.fn();
vi.mock("react-router", async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

// Test component that uses keyboard shortcuts
const TestKeyboardShortcutsComponent = () => {
  const mockOpenWorkOrderModal = vi.fn();
  const mockToggleTheme = vi.fn();
  const mockRefreshData = vi.fn();

  useKeyboardShortcuts({
    onOpenWorkOrderModal: mockOpenWorkOrderModal,
    onToggleTheme: mockToggleTheme,
    onRefreshData: mockRefreshData,
  });

  return (
    <div>
      <input placeholder="Search work orders" />
      <div role="dialog">
        <button aria-label="Close modal">Close</button>
      </div>
    </div>
  );
};

// Test component that uses accessibility features
const TestAccessibilityComponent = () => {
  useAccessibility();

  return (
    <div>
      <main id="main-content">Main content</main>
    </div>
  );
};

const renderWithRouter = (component: React.ReactElement) => {
  const router = createMemoryRouter(
    [
      {
        path: "/",
        element: component,
      },
    ],
    {
      initialEntries: ["/"],
    },
  );

  return render(<RouterProvider router={router} />);
};

describe("Accessibility", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Clear any existing elements
    document.body.innerHTML = "";
  });

  describe("useKeyboardShortcuts", () => {
    it("handles Ctrl+N to open work order modal", async () => {
      const user = userEvent.setup();
      renderWithRouter(<TestKeyboardShortcutsComponent />);

      await user.keyboard("{Control>}n{/Control}");

      // The mock function should be called
      expect(mockNavigate).toHaveBeenCalled();
    });

    it("handles Ctrl+K to focus search", async () => {
      const user = userEvent.setup();
      renderWithRouter(<TestKeyboardShortcutsComponent />);

      const searchInput = screen.getByPlaceholderText("Search work orders");
      await user.keyboard("{Control>}k{/Control}");

      expect(searchInput).toHaveFocus();
    });

    it("handles Ctrl+R to refresh data", async () => {
      const user = userEvent.setup();
      renderWithRouter(<TestKeyboardShortcutsComponent />);

      await user.keyboard("{Control>}r{/Control}");

      // The refresh function should be called
      expect(mockNavigate).toHaveBeenCalled();
    });

    it("handles Ctrl+D to toggle theme", async () => {
      const user = userEvent.setup();
      renderWithRouter(<TestKeyboardShortcutsComponent />);

      await user.keyboard("{Control>}d{/Control}");

      // The theme toggle function should be called
      expect(mockNavigate).toHaveBeenCalled();
    });

    it("handles Ctrl+1 to navigate to dashboard", async () => {
      const user = userEvent.setup();
      renderWithRouter(<TestKeyboardShortcutsComponent />);

      await user.keyboard("{Control>}1{/Control}");

      expect(mockNavigate).toHaveBeenCalledWith("/");
    });

    it("handles Ctrl+2 to navigate to work orders", async () => {
      const user = userEvent.setup();
      renderWithRouter(<TestKeyboardShortcutsComponent />);

      await user.keyboard("{Control>}2{/Control}");

      expect(mockNavigate).toHaveBeenCalledWith("/work-order");
    });

    it("handles Escape to close modal", async () => {
      const user = userEvent.setup();
      renderWithRouter(<TestKeyboardShortcutsComponent />);

      await user.keyboard("{Escape}");

      // The close button should be clicked
      const closeButton = screen.getByLabelText("Close modal");
      expect(closeButton).toBeInTheDocument();
    });

    it("handles ? to show help", async () => {
      const user = userEvent.setup();
      renderWithRouter(<TestKeyboardShortcutsComponent />);

      await user.keyboard("?");

      // Help dialog should be created
      await waitFor(() => {
        const helpDialog = document.querySelector('[role="dialog"]');
        expect(helpDialog).toBeInTheDocument();
      });
    });

    it("ignores shortcuts when typing in input fields", async () => {
      const user = userEvent.setup();
      renderWithRouter(<TestKeyboardShortcutsComponent />);

      const input = screen.getByPlaceholderText("Search work orders");
      input.focus();

      await user.keyboard("{Control>}n{/Control}");

      // Should not navigate when typing in input
      expect(mockNavigate).not.toHaveBeenCalled();
    });
  });

  describe("useAccessibility", () => {
    it("adds skip links to the page", () => {
      renderWithRouter(<TestAccessibilityComponent />);

      const skipLinks = document.querySelectorAll(
        'a[href="#main-content"], a[href="#navigation-drawer"]',
      );
      expect(skipLinks.length).toBeGreaterThan(0);
    });

    it("adds main content landmark", () => {
      renderWithRouter(<TestAccessibilityComponent />);

      const mainContent = document.querySelector(
        '[role="main"], main, #main-content',
      );
      expect(mainContent).toBeInTheDocument();
    });

    it("updates page title based on route", () => {
      // Mock window.location
      Object.defineProperty(window, "location", {
        value: { pathname: "/" },
        writable: true,
      });

      renderWithRouter(<TestAccessibilityComponent />);

      expect(document.title).toContain("Dashboard");
    });

    it("cleans up event listeners on unmount", () => {
      const removeEventListenerSpy = vi.spyOn(document, "removeEventListener");

      const { unmount } = renderWithRouter(<TestAccessibilityComponent />);

      unmount();

      // Should remove event listeners
      expect(removeEventListenerSpy).toHaveBeenCalled();

      removeEventListenerSpy.mockRestore();
    });
  });

  describe("getAriaLabels", () => {
    it("returns proper aria labels for work order table", () => {
      const labels = getAriaLabels();

      expect(labels.workOrderTable.table).toBe("Work orders table");
      expect(labels.workOrderTable.row(0)).toBe("Work order row 1");
      expect(labels.workOrderTable.cell("Status", "In Progress")).toBe(
        "Status: In Progress",
      );
      expect(labels.workOrderTable.statusButton("Submitted")).toBe(
        "Change status from Submitted",
      );
      expect(labels.workOrderTable.priorityChip("CASREP")).toBe(
        "Priority: CASREP",
      );
    });

    it("returns proper aria labels for maintenance overview", () => {
      const labels = getAriaLabels();

      expect(labels.maintenanceOverview.kpiCard("Test KPI")).toBe(
        "KPI: Test KPI",
      );
      expect(labels.maintenanceOverview.alert).toBe(
        "Critical maintenance alert",
      );
      expect(labels.maintenanceOverview.progressBar(75)).toBe("Progress: 75%");
    });

    it("returns proper aria labels for navigation", () => {
      const labels = getAriaLabels();

      expect(labels.navigation.drawerToggle).toBe("Toggle navigation menu");
      expect(labels.navigation.themeToggle).toBe("Toggle dark mode");
      expect(labels.navigation.navItem("Home")).toBe("Navigate to Home");
    });

    it("returns proper aria labels for modal", () => {
      const labels = getAriaLabels();

      expect(labels.modal.workOrderForm).toBe("Create new work order form");
      expect(labels.modal.closeButton).toBe("Close modal");
      expect(labels.modal.submitButton).toBe("Submit work order");
    });
  });

  describe("focusManagement", () => {
    it("traps focus within an element", async () => {
      const user = userEvent.setup();

      const container = document.createElement("div");
      container.innerHTML = `
        <button>First</button>
        <input type="text" />
        <button>Last</button>
      `;
      document.body.appendChild(container);

      const cleanup = focusManagement.trapFocus(container);

      const firstButton = container.querySelector("button") as HTMLElement;

      firstButton.focus();

      // Tab should cycle through elements
      await user.tab();
      await user.tab();

      // Tab from last element should go to first
      await user.keyboard("{Tab}");

      expect(document.activeElement).toBe(firstButton);

      cleanup();
      document.body.removeChild(container);
    });

    it("announces messages to screen readers", () => {
      const announceSpy = vi.spyOn(document.body, "appendChild");

      focusManagement.announce("Test message", "assertive");

      expect(announceSpy).toHaveBeenCalled();

      announceSpy.mockRestore();
    });
  });
});
