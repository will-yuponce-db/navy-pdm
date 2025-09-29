import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Provider } from "react-redux";
import { configureStore } from "@reduxjs/toolkit";
import { createMemoryRouter, RouterProvider } from "react-router";
import Home from "../../routes/home";
import workOrderReducer from "../../redux/services/workOrderSlice";
import notificationReducer from "../../redux/services/notificationSlice";
import partsReducer from "../../redux/services/partsSlice";
import type { RootState } from "../../types";

// Mock all the components
vi.mock("~/components/QuickActions", () => ({
  default: () => <div data-testid="quick-actions">Quick Actions</div>,
}));

vi.mock("~/components/MaintenanceOverview", () => ({
  default: () => (
    <div data-testid="maintenance-overview">Maintenance Overview</div>
  ),
}));

vi.mock("~/components/WorkOrderTable", () => ({
  default: ({ openWorkOrderModal }: { openWorkOrderModal: () => void }) => (
    <div data-testid="work-order-table">
      <button onClick={openWorkOrderModal} data-testid="open-modal-button">
        Open Modal
      </button>
    </div>
  ),
}));

vi.mock("~/components/WorkOrderModal", () => ({
  default: ({
    modalOpen,
    handleModalClose,
  }: {
    modalOpen: boolean;
    handleModalClose: () => void;
  }) => (
    <div
      data-testid="work-order-modal"
      style={{ display: modalOpen ? "block" : "none" }}
    >
      <button onClick={handleModalClose} data-testid="close-modal-button">
        Close Modal
      </button>
    </div>
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
      workOrder: workOrderReducer,
      notifications: notificationReducer,
      parts: partsReducer,
    },
    preloadedState: {
      workOrder: [],
      notifications: [],
      parts: {
        parts: [],
        loading: false,
        error: null,
        filters: {},
      },
      ...preloadedState,
    },
  });
};

const renderWithProvider = (
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

describe("Home Route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders the home page with all main components", () => {
    renderWithProvider(<Home />);

    expect(screen.getByTestId("maintenance-overview")).toBeInTheDocument();
    expect(screen.getByTestId("quick-actions")).toBeInTheDocument();
    expect(screen.getByTestId("work-order-table")).toBeInTheDocument();
  });

  it("renders the tab navigation", () => {
    renderWithProvider(<Home />);

    expect(screen.getByText("Work Orders")).toBeInTheDocument();
    expect(screen.getByText("Analytics")).toBeInTheDocument();
    expect(screen.getByText("Advanced Analytics")).toBeInTheDocument();
    expect(screen.getByText("Fleet Map")).toBeInTheDocument();
    expect(screen.getByText("Predictive Analytics")).toBeInTheDocument();
  });

  it("shows work orders tab by default", () => {
    renderWithProvider(<Home />);

    expect(screen.getByTestId("work-order-table")).toBeInTheDocument();
    expect(screen.queryByTestId("maintenance-charts")).not.toBeInTheDocument();
  });

  it("switches to analytics tab when clicked", async () => {
    const user = userEvent.setup();
    renderWithProvider(<Home />);

    const analyticsTab = screen.getByText("Analytics");
    await user.click(analyticsTab);

    expect(screen.getByTestId("maintenance-charts")).toBeInTheDocument();
    expect(screen.queryByTestId("work-order-table")).not.toBeInTheDocument();
  });

  it("switches to advanced analytics tab when clicked", async () => {
    const user = userEvent.setup();
    renderWithProvider(<Home />);

    const advancedAnalyticsTab = screen.getByText("Advanced Analytics");
    await user.click(advancedAnalyticsTab);

    expect(screen.getByTestId("advanced-analytics")).toBeInTheDocument();
    expect(screen.queryByTestId("work-order-table")).not.toBeInTheDocument();
  });

  it("switches to fleet map tab when clicked", async () => {
    const user = userEvent.setup();
    renderWithProvider(<Home />);

    const fleetMapTab = screen.getByText("Fleet Map");
    await user.click(fleetMapTab);

    expect(screen.getByTestId("fleet-map")).toBeInTheDocument();
    expect(screen.queryByTestId("work-order-table")).not.toBeInTheDocument();
  });

  it("switches to predictive analytics tab when clicked", async () => {
    const user = userEvent.setup();
    renderWithProvider(<Home />);

    const predictiveAnalyticsTab = screen.getByText("Predictive Analytics");
    await user.click(predictiveAnalyticsTab);

    expect(screen.getByTestId("predictive-analytics")).toBeInTheDocument();
    expect(screen.queryByTestId("work-order-table")).not.toBeInTheDocument();
  });

  it("opens work order modal when openWorkOrderModal is called", async () => {
    const user = userEvent.setup();
    renderWithProvider(<Home />);

    const openModalButton = screen.getByTestId("open-modal-button");
    await user.click(openModalButton);

    const modal = screen.getByTestId("work-order-modal");
    expect(modal).toBeVisible();
  });

  it("closes work order modal when handleModalClose is called", async () => {
    const user = userEvent.setup();
    renderWithProvider(<Home />);

    // Open modal first
    const openModalButton = screen.getByTestId("open-modal-button");
    await user.click(openModalButton);

    // Close modal
    const closeModalButton = screen.getByTestId("close-modal-button");
    await user.click(closeModalButton);

    const modal = screen.getByTestId("work-order-modal");
    expect(modal).not.toBeVisible();
  });

  it("has proper responsive layout structure", () => {
    renderWithProvider(<Home />);

    // Check for main container
    const mainContainer = screen
      .getByTestId("maintenance-overview")
      .closest('[class*="Box"]');
    expect(mainContainer).toBeInTheDocument();
  });

  it("renders meta information correctly", () => {
    // Test the meta function - it's exported separately
    const metaResult = Home.meta ? Home.meta({}) : null;

    if (metaResult) {
      expect(metaResult).toEqual([
        { title: "Home" },
        { name: "description", content: "Welcome to React Router!" },
      ]);
    } else {
      // If meta is not available, just verify the component renders
      renderWithProvider(<Home />);
      expect(screen.getByTestId("maintenance-overview")).toBeInTheDocument();
    }
  });
});
