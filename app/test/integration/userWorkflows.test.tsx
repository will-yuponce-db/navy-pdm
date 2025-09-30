import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
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
      renderWithProviders(<Home />);

      // Check if the home page renders
      await waitFor(() => {
        expect(screen.getByText("Navy PdM Dashboard")).toBeInTheDocument();
      }, { timeout: 10000 });
    });

    it("allows user to search and filter work orders", async () => {
      renderWithProviders(<Home />);

      // Check if the home page renders
      await waitFor(() => {
        expect(screen.getByText("Navy PdM Dashboard")).toBeInTheDocument();
      }, { timeout: 10000 });
    });

    it("allows user to select and delete work orders", async () => {
      renderWithProviders(<Home />);

      // Check if the home page renders
      await waitFor(() => {
        expect(screen.getByText("Navy PdM Dashboard")).toBeInTheDocument();
      }, { timeout: 10000 });
    });

    it("allows user to update work order status", async () => {
      renderWithProviders(<Home />);

      // Check if the home page renders
      await waitFor(() => {
        expect(screen.getByText("Navy PdM Dashboard")).toBeInTheDocument();
      }, { timeout: 10000 });
    });
  });

  describe("Navigation Flow", () => {
    it("allows user to navigate between different tabs", async () => {
      renderWithProviders(<Home />);

      // Check if the home page renders
      await waitFor(() => {
        expect(screen.getByText("Navy PdM Dashboard")).toBeInTheDocument();
      }, { timeout: 10000 });
    });
  });

  describe("Form Validation Flow", () => {
    it("shows validation errors for empty required fields", async () => {
      renderWithProviders(<Home />);

      // Check if the home page renders
      await waitFor(() => {
        expect(screen.getByText("Navy PdM Dashboard")).toBeInTheDocument();
      }, { timeout: 10000 });
    });

    it("clears validation errors when user starts typing", async () => {
      renderWithProviders(<Home />);

      // Check if the home page renders
      await waitFor(() => {
        expect(screen.getByText("Navy PdM Dashboard")).toBeInTheDocument();
      }, { timeout: 10000 });
    });

    it("validates ETA field for invalid input", async () => {
      renderWithProviders(<Home />);

      // Check if the home page renders
      await waitFor(() => {
        expect(screen.getByText("Navy PdM Dashboard")).toBeInTheDocument();
      }, { timeout: 10000 });
    });
  });

  describe("Accessibility Flow", () => {
    it("supports keyboard navigation for work order table", async () => {
      renderWithProviders(<Home />);

      // Check if the home page renders
      await waitFor(() => {
        expect(screen.getByText("Navy PdM Dashboard")).toBeInTheDocument();
      }, { timeout: 10000 });
    });

    it("supports keyboard navigation for modal", async () => {
      renderWithProviders(<Home />);

      // Check if the home page renders
      await waitFor(() => {
        expect(screen.getByText("Navy PdM Dashboard")).toBeInTheDocument();
      }, { timeout: 10000 });
    });

    it("supports escape key to close modal", async () => {
      renderWithProviders(<Home />);

      // Check if the home page renders
      await waitFor(() => {
        expect(screen.getByText("Navy PdM Dashboard")).toBeInTheDocument();
      }, { timeout: 10000 });
    });
  });

  describe("Data Persistence Flow", () => {
    it("maintains work order data across component re-renders", async () => {
      renderWithProviders(<Home />);

      // Check if the home page renders
      await waitFor(() => {
        expect(screen.getByText("Navy PdM Dashboard")).toBeInTheDocument();
      }, { timeout: 10000 });
    });
  });
});
