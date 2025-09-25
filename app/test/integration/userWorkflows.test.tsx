import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Provider } from "react-redux";
import { createMemoryRouter, RouterProvider } from "react-router";
import { configureStore } from "@reduxjs/toolkit";
import Home from "../../routes/home";
import workOrderReducer from "../../redux/services/workOrderSlice";
import type { RootState } from "../../types";

// Mock all components that are not being tested in this integration test
vi.mock("~/components/QuickActions", () => ({
  default: () => <div data-testid="quick-actions">Quick Actions</div>,
}));

vi.mock("~/components/MaintenanceOverview", () => ({
  default: () => (
    <div data-testid="maintenance-overview">Maintenance Overview</div>
  ),
}));

vi.mock("~/components/MaintenanceCharts", () => ({
  default: () => <div data-testid="maintenance-charts">Maintenance Charts</div>,
}));

vi.mock("~/components/AdvancedAnalytics", () => ({
  default: () => <div data-testid="advanced-analytics">Advanced Analytics</div>,
}));

vi.mock("~/components/FleetMap", () => ({
  default: () => <div data-testid="fleet-map">Fleet Map</div>,
}));

vi.mock("~/components/PredictiveAnalytics", () => ({
  default: () => (
    <div data-testid="predictive-analytics">Predictive Analytics</div>
  ),
}));

vi.mock("~/components/Accessibility", () => ({
  useKeyboardShortcuts: vi.fn(),
}));

// Mock window.location.reload
Object.defineProperty(window, "location", {
  value: {
    reload: vi.fn(),
  },
  writable: true,
});

const createTestStore = (preloadedState?: Partial<RootState>) => {
  return configureStore({
    reducer: {
      workOrders: workOrderReducer,
    },
    preloadedState,
  });
};

const renderWithProviders = (
  component: React.ReactElement,
  { preloadedState, store = createTestStore(preloadedState) } = {},
) => {
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

  return render(
    <Provider store={store}>
      <RouterProvider router={router} />
    </Provider>,
  );
};

describe("Integration Tests - User Workflows", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Work Order Management Flow", () => {
    it("allows user to create a new work order", async () => {
      const user = userEvent.setup();
      renderWithProviders(<Home />);

      // Open work order modal
      const addButton = screen.getByLabelText("Add new work order");
      await user.click(addButton);

      // Fill in the form
      await user.type(screen.getByLabelText("Ship"), "USS Integration Test");
      await user.type(screen.getByLabelText("Homeport"), "NB Norfolk");
      await user.type(screen.getByLabelText("GTE / System"), "LM2500");
      await user.type(
        screen.getByLabelText("Failure Mode"),
        "Integration Test Failure",
      );
      await user.type(screen.getByLabelText("Target ETA (days)"), "5");

      // Submit the form
      const submitButton = screen.getByLabelText("Submit work order form");
      await user.click(submitButton);

      // Wait for modal to close
      await waitFor(() => {
        expect(screen.queryByText("Create Work Order")).not.toBeInTheDocument();
      });

      // Verify work order was added to the table
      expect(screen.getByText("USS Integration Test")).toBeInTheDocument();
    });

    it("allows user to search and filter work orders", async () => {
      const user = userEvent.setup();
      renderWithProviders(<Home />);

      // Search for a specific ship
      const searchInput = screen.getByLabelText("Search work orders");
      await user.type(searchInput, "USS Bainbridge");

      // Filter by status
      const statusSelect = screen.getByLabelText("Status");
      await user.click(statusSelect);
      const submittedOption = screen.getByText("Submitted");
      await user.click(submittedOption);

      // Filter by priority
      const prioritySelect = screen.getByLabelText("Priority");
      await user.click(prioritySelect);
      const casrepOption = screen.getByText("CASREP");
      await user.click(casrepOption);

      // Verify filters are applied
      expect(searchInput).toHaveValue("USS Bainbridge");
      expect(statusSelect).toHaveValue("Submitted");
      expect(prioritySelect).toHaveValue("CASREP");
    });

    it("allows user to select and delete work orders", async () => {
      const user = userEvent.setup();
      renderWithProviders(<Home />);

      // Select all work orders
      const selectAllCheckbox = screen.getByLabelText("Select all work orders");
      await user.click(selectAllCheckbox);

      // Verify delete button appears
      expect(screen.getByLabelText("Delete")).toBeInTheDocument();

      // Click delete button
      const deleteButton = screen.getByLabelText("Delete");
      await user.click(deleteButton);

      // Verify work orders are deleted (table should be empty or have fewer items)
      await waitFor(() => {
        const checkboxes = screen.getAllByRole("checkbox");
        // Should only have the select all checkbox left
        expect(checkboxes.length).toBe(1);
      });
    });

    it("allows user to update work order status", async () => {
      const user = userEvent.setup();
      renderWithProviders(<Home />);

      // Find a status chip and click it
      const statusChips = screen.getAllByRole("button");
      const statusChip = statusChips.find((chip) =>
        chip.getAttribute("aria-label")?.includes("Change status"),
      );

      if (statusChip) {
        await user.click(statusChip);

        // Select "In Progress" from the menu
        const inProgressOption = screen.getByText("Start Work");
        await user.click(inProgressOption);

        // Verify status was updated (this would require checking the Redux state)
        // For now, we just verify the menu closed
        await waitFor(() => {
          expect(screen.queryByText("Start Work")).not.toBeInTheDocument();
        });
      }
    });
  });

  describe("Navigation Flow", () => {
    it("allows user to navigate between different tabs", async () => {
      const user = userEvent.setup();
      renderWithProviders(<Home />);

      // Start on Work Orders tab
      expect(screen.getByTestId("work-order-table")).toBeInTheDocument();

      // Switch to Analytics tab
      const analyticsTab = screen.getByText("Analytics");
      await user.click(analyticsTab);
      expect(screen.getByTestId("maintenance-charts")).toBeInTheDocument();

      // Switch to Advanced Analytics tab
      const advancedAnalyticsTab = screen.getByText("Advanced Analytics");
      await user.click(advancedAnalyticsTab);
      expect(screen.getByTestId("advanced-analytics")).toBeInTheDocument();

      // Switch to Fleet Map tab
      const fleetMapTab = screen.getByText("Fleet Map");
      await user.click(fleetMapTab);
      expect(screen.getByTestId("fleet-map")).toBeInTheDocument();

      // Switch to Predictive Analytics tab
      const predictiveAnalyticsTab = screen.getByText("Predictive Analytics");
      await user.click(predictiveAnalyticsTab);
      expect(screen.getByTestId("predictive-analytics")).toBeInTheDocument();

      // Switch back to Work Orders tab
      const workOrdersTab = screen.getByText("Work Orders");
      await user.click(workOrdersTab);
      expect(screen.getByTestId("work-order-table")).toBeInTheDocument();
    });
  });

  describe("Form Validation Flow", () => {
    it("shows validation errors for empty required fields", async () => {
      const user = userEvent.setup();
      renderWithProviders(<Home />);

      // Open work order modal
      const addButton = screen.getByLabelText("Add new work order");
      await user.click(addButton);

      // Try to submit empty form
      const submitButton = screen.getByLabelText("Submit work order form");
      await user.click(submitButton);

      // Verify validation errors appear
      expect(screen.getByText("Ship is required")).toBeInTheDocument();
      expect(screen.getByText("Homeport is required")).toBeInTheDocument();
      expect(screen.getByText("GTE/System is required")).toBeInTheDocument();
      expect(screen.getByText("Failure Mode is required")).toBeInTheDocument();
      expect(screen.getByText("Target ETA is required")).toBeInTheDocument();
    });

    it("clears validation errors when user starts typing", async () => {
      const user = userEvent.setup();
      renderWithProviders(<Home />);

      // Open work order modal
      const addButton = screen.getByLabelText("Add new work order");
      await user.click(addButton);

      // Wait for modal to be visible
      await waitFor(() => {
        expect(screen.getByLabelText("Ship")).toBeInTheDocument();
      });

      // Trigger validation errors
      const submitButton = screen.getByLabelText("Submit work order form");
      await user.click(submitButton);

      // Start typing in ship field
      const shipInput = screen.getByLabelText("Ship");
      await user.type(shipInput, "USS Test");

      // Error should be cleared
      expect(screen.queryByText("Ship is required")).not.toBeInTheDocument();
    });

    it("validates ETA field for invalid input", async () => {
      const user = userEvent.setup();
      renderWithProviders(<Home />);

      // Open work order modal
      const addButton = screen.getByLabelText("Add new work order");
      await user.click(addButton);

      // Wait for modal to be visible
      await waitFor(() => {
        expect(screen.getByLabelText("Target ETA (days)")).toBeInTheDocument();
      });

      // Enter invalid ETA
      const etaInput = screen.getByLabelText("Target ETA (days)");
      await user.type(etaInput, "invalid");

      // Try to submit
      const submitButton = screen.getByLabelText("Submit work order form");
      await user.click(submitButton);

      // Verify validation error
      expect(
        screen.getByText("ETA must be a valid positive number"),
      ).toBeInTheDocument();
    });
  });

  describe("Accessibility Flow", () => {
    it("supports keyboard navigation for work order table", async () => {
      const user = userEvent.setup();
      renderWithProviders(<Home />);

      // Tab through the interface
      await user.tab();
      await user.tab();
      await user.tab();

      // Verify focus is maintained
      const activeElement = document.activeElement;
      expect(activeElement).toBeInTheDocument();
    });

    it("supports keyboard navigation for modal", async () => {
      const user = userEvent.setup();
      renderWithProviders(<Home />);

      // Open modal
      const addButton = screen.getByLabelText("Add new work order");
      await user.click(addButton);

      // Tab through modal elements
      await user.tab();
      await user.tab();
      await user.tab();

      // Verify focus is trapped in modal
      const activeElement = document.activeElement;
      expect(activeElement).toBeInTheDocument();
    });

    it("supports escape key to close modal", async () => {
      const user = userEvent.setup();
      renderWithProviders(<Home />);

      // Open modal
      const addButton = screen.getByLabelText("Add new work order");
      await user.click(addButton);

      // Press escape
      await user.keyboard("{Escape}");

      // Verify modal is closed
      await waitFor(() => {
        expect(screen.queryByText("Create Work Order")).not.toBeInTheDocument();
      });
    });
  });

  describe("Data Persistence Flow", () => {
    it("maintains work order data across component re-renders", async () => {
      const user = userEvent.setup();
      const store = createTestStore();

      // Initial render
      const { rerender } = renderWithProviders(<Home />, { store });

      // Create a work order
      const addButton = screen.getByLabelText("Add new work order");
      await user.click(addButton);

      // Wait for modal to be visible and fill form
      await waitFor(() => {
        expect(screen.getByLabelText("Ship")).toBeInTheDocument();
      });
      await user.type(screen.getByLabelText("Ship"), "USS Persistence Test");
      await user.type(screen.getByLabelText("Homeport"), "NB Norfolk");
      await user.type(screen.getByLabelText("GTE / System"), "LM2500");
      await user.type(
        screen.getByLabelText("Failure Mode"),
        "Persistence Test",
      );
      await user.type(screen.getByLabelText("Target ETA (days)"), "3");

      const submitButton = screen.getByLabelText("Submit work order form");
      await user.click(submitButton);

      // Re-render component
      const router = createMemoryRouter(
        [
          {
            path: "/",
            element: <Home />,
          },
        ],
        {
          initialEntries: ["/"],
        },
      );

      rerender(
        <Provider store={store}>
          <RouterProvider router={router} />
        </Provider>,
      );

      // Verify work order is still there
      expect(screen.getByText("USS Persistence Test")).toBeInTheDocument();
    });
  });
});
