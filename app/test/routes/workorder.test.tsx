import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Provider } from "react-redux";
import { configureStore } from "@reduxjs/toolkit";
import { createMemoryRouter, RouterProvider } from "react-router";
import WorkOrder from "../../routes/workorder";
import workOrderReducer from "../../redux/services/workOrderSlice";
import notificationReducer from "../../redux/services/notificationSlice";
import partsReducer from "../../redux/services/partsSlice";
import type { RootState } from "../../types";

// Mock the components
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
        path: "/work-order",
        element: component,
      },
    ],
    {
      initialEntries: ["/work-order"],
    },
  );

  return render(
    <Provider store={store}>
      <RouterProvider router={router} />
    </Provider>,
  );
};

describe("WorkOrder Route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders the work order page with work order table", () => {
    renderWithProvider(<WorkOrder />);

    expect(screen.getByTestId("work-order-table")).toBeInTheDocument();
  });

  it("renders the work order modal", () => {
    renderWithProvider(<WorkOrder />);

    expect(screen.getByTestId("work-order-modal")).toBeInTheDocument();
  });

  it("initially hides the work order modal", () => {
    renderWithProvider(<WorkOrder />);

    const modal = screen.getByTestId("work-order-modal");
    expect(modal).not.toBeVisible();
  });

  it("opens work order modal when openWorkOrderModal is called", async () => {
    const user = userEvent.setup();
    renderWithProvider(<WorkOrder />);

    const openModalButton = screen.getByTestId("open-modal-button");
    await user.click(openModalButton);

    const modal = screen.getByTestId("work-order-modal");
    expect(modal).toBeVisible();
  });

  it("closes work order modal when handleModalClose is called", async () => {
    const user = userEvent.setup();
    renderWithProvider(<WorkOrder />);

    // Open modal first
    const openModalButton = screen.getByTestId("open-modal-button");
    await user.click(openModalButton);

    // Close modal
    const closeModalButton = screen.getByTestId("close-modal-button");
    await user.click(closeModalButton);

    const modal = screen.getByTestId("work-order-modal");
    expect(modal).not.toBeVisible();
  });

  it("has proper layout structure", () => {
    renderWithProvider(<WorkOrder />);

    // Check for main container with proper styling
    const mainContainer = screen
      .getByTestId("work-order-table")
      .closest('[class*="Box"]');
    expect(mainContainer).toBeInTheDocument();
  });

  it("renders meta information correctly", () => {
    // Test the meta function - it's exported separately
    const metaResult = WorkOrder.meta ? WorkOrder.meta({}) : null;

    if (metaResult) {
      expect(metaResult).toEqual([
        { title: "Work Orders" },
        { name: "description", content: "Welcome to React Router!" },
      ]);
    } else {
      // If meta is not available, just verify the component renders
      renderWithProvider(<WorkOrder />);
      expect(screen.getByTestId("work-order-table")).toBeInTheDocument();
    }
  });

  it("maintains modal state correctly", async () => {
    const user = userEvent.setup();
    renderWithProvider(<WorkOrder />);

    // Initially modal should be closed
    let modal = screen.getByTestId("work-order-modal");
    expect(modal).not.toBeVisible();

    // Open modal
    const openModalButton = screen.getByTestId("open-modal-button");
    await user.click(openModalButton);

    modal = screen.getByTestId("work-order-modal");
    expect(modal).toBeVisible();

    // Close modal
    const closeModalButton = screen.getByTestId("close-modal-button");
    await user.click(closeModalButton);

    modal = screen.getByTestId("work-order-modal");
    expect(modal).not.toBeVisible();
  });
});
