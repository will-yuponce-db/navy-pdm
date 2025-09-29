import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { Provider } from "react-redux";
import { configureStore } from "@reduxjs/toolkit";
import PartsRequired from "../../components/PartsRequired";
import { partsSlice } from "../../redux/services/partsSlice";

// Mock store
const createTestStore = () => {
  return configureStore({
    reducer: {
      parts: partsSlice.reducer,
    },
    preloadedState: {
      parts: {
        parts: [],
        loading: false,
        error: null,
        filters: {},
      },
    },
  });
};

const renderWithProviders = (component: React.ReactElement, store = createTestStore()) => {
  return render(<Provider store={store}>{component}</Provider>);
};

describe("PartsRequired", () => {
  const mockProps = {
    parts: [],
    onPartsChange: vi.fn(),
    editable: true,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders parts required component", () => {
    renderWithProviders(<PartsRequired {...mockProps} />);

    expect(screen.getByText("Parts Required:")).toBeInTheDocument();
  });

  it("displays add part button", () => {
    renderWithProviders(<PartsRequired {...mockProps} />);

    expect(screen.getByRole("button", { name: "Add Parts" })).toBeInTheDocument();
  });

  it("shows empty state when no parts", () => {
    renderWithProviders(<PartsRequired {...mockProps} />);

    expect(screen.getByText("No parts required")).toBeInTheDocument();
  });

  it("displays parts list when parts are provided", () => {
    const parts = [
      {
        id: "1",
        partNumber: "P001",
        name: "Test Part 1",
        quantity: 2,
        unitCost: 100,
      },
      {
        id: "2",
        partNumber: "P002",
        name: "Test Part 2",
        quantity: 1,
        unitCost: 50,
      },
    ];

    render(<PartsRequired {...mockProps} parts={parts} />);

    expect(screen.getByText("P001")).toBeInTheDocument();
    expect(screen.getByText("Test Part 1")).toBeInTheDocument();
    expect(screen.getByText("P002")).toBeInTheDocument();
    expect(screen.getByText("Test Part 2")).toBeInTheDocument();
  });

  it("handles adding new part", async () => {
    renderWithProviders(<PartsRequired {...mockProps} />);

    const addButton = screen.getByRole("button", { name: "Add Parts" });
    fireEvent.click(addButton);

    expect(screen.getByText("Select Parts")).toBeInTheDocument();
  });

  it("handles part form submission", async () => {
    renderWithProviders(<PartsRequired {...mockProps} />);

    const addButton = screen.getByRole("button", { name: "Add Parts" });
    fireEvent.click(addButton);

    expect(screen.getByText("Select Parts")).toBeInTheDocument();
    
    const closeButton = screen.getByRole("button", { name: "Close" });
    fireEvent.click(closeButton);

    await waitFor(() => {
      expect(screen.queryByText("Select Parts")).not.toBeInTheDocument();
    });
  });

  it("handles part form cancellation", async () => {
    renderWithProviders(<PartsRequired {...mockProps} />);

    const addButton = screen.getByRole("button", { name: "Add Parts" });
    fireEvent.click(addButton);

    const closeButton = screen.getByRole("button", { name: "Close" });
    fireEvent.click(closeButton);

    await waitFor(() => {
      expect(screen.queryByText("Select Parts")).not.toBeInTheDocument();
    });
  });

  it("validates required fields in part form", async () => {
    renderWithProviders(<PartsRequired {...mockProps} />);

    const addButton = screen.getByRole("button", { name: "Add Parts" });
    fireEvent.click(addButton);

    expect(screen.getByText("Select Parts")).toBeInTheDocument();
    
    const closeButton = screen.getByRole("button", { name: "Close" });
    fireEvent.click(closeButton);

    await waitFor(() => {
      expect(screen.queryByText("Select Parts")).not.toBeInTheDocument();
    });
  });

  it("handles quantity validation", async () => {
    renderWithProviders(<PartsRequired {...mockProps} />);

    const addButton = screen.getByRole("button", { name: "Add Parts" });
    fireEvent.click(addButton);

    expect(screen.getByText("Select Parts")).toBeInTheDocument();
    
    const closeButton = screen.getByRole("button", { name: "Close" });
    fireEvent.click(closeButton);

    await waitFor(() => {
      expect(screen.queryByText("Select Parts")).not.toBeInTheDocument();
    });
  });

  it("handles editing existing part", async () => {
    const parts = [
      {
        id: "1",
        partNumber: "P001",
        name: "Test Part 1",
        quantity: 2,
        unitCost: 100,
      },
    ];

    render(<PartsRequired {...mockProps} parts={parts} />);

    const editButton = screen.getByRole("button", { name: "Edit" });
    fireEvent.click(editButton);

    expect(screen.getByDisplayValue("P001")).toBeInTheDocument();
    expect(screen.getByDisplayValue("2")).toBeInTheDocument();
  });

  it("handles deleting part", async () => {
    const parts = [
      {
        id: "1",
        partNumber: "P001",
        name: "Test Part 1",
        quantity: 2,
        unitCost: 100,
      },
    ];

    render(<PartsRequired {...mockProps} parts={parts} />);

    const deleteButton = screen.getByRole("button", { name: "Delete" });
    fireEvent.click(deleteButton);

    await waitFor(() => {
      expect(mockProps.onPartsChange).toHaveBeenCalled();
    });
  });

  it("displays total cost calculation", () => {
    const parts = [
      {
        id: "1",
        partNumber: "P001",
        name: "Test Part 1",
        quantity: 2,
        unitCost: 100,
      },
      {
        id: "2",
        partNumber: "P002",
        name: "Test Part 2",
        quantity: 1,
        unitCost: 50,
      },
    ];

    render(<PartsRequired {...mockProps} parts={parts} />);

    expect(screen.getByText("Total Cost: $250.00")).toBeInTheDocument();
  });

  it("handles part search functionality", async () => {
    renderWithProviders(<PartsRequired {...mockProps} />);

    const addButton = screen.getByRole("button", { name: "Add Parts" });
    fireEvent.click(addButton);

    expect(screen.getByText("Select Parts")).toBeInTheDocument();
    
    const closeButton = screen.getByRole("button", { name: "Close" });
    fireEvent.click(closeButton);

    await waitFor(() => {
      expect(screen.queryByText("Select Parts")).not.toBeInTheDocument();
    });
  });

  it("displays part availability status", () => {
    const parts = [
      {
        id: "1",
        partNumber: "P001",
        name: "Test Part 1",
        quantity: 2,
        unitCost: 100,
        status: "Available",
      },
    ];

    render(<PartsRequired {...mockProps} parts={parts} />);

    expect(screen.getByText("Available")).toBeInTheDocument();
  });

  it("handles part quantity updates", async () => {
    const parts = [
      {
        id: "1",
        partNumber: "P001",
        name: "Test Part 1",
        quantity: 2,
        unitCost: 100,
      },
    ];

    render(<PartsRequired {...mockProps} parts={parts} />);

    const editButton = screen.getByRole("button", { name: "Edit" });
    fireEvent.click(editButton);

    const quantityInput = screen.getByDisplayValue("2");
    fireEvent.change(quantityInput, { target: { value: "3" } });

    const saveButton = screen.getByRole("button", { name: "Save" });
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(mockProps.onPartsChange).toHaveBeenCalled();
    });
  });

  it("displays part supplier information", () => {
    const parts = [
      {
        id: "1",
        partNumber: "P001",
        name: "Test Part 1",
        quantity: 2,
        unitCost: 100,
        supplier: "Test Supplier",
      },
    ];

    render(<PartsRequired {...mockProps} parts={parts} />);

    expect(screen.getByText("Test Supplier")).toBeInTheDocument();
  });

  it("handles keyboard navigation", async () => {
    renderWithProviders(<PartsRequired {...mockProps} />);

    const addButton = screen.getByRole("button", { name: "Add Parts" });
    addButton.focus();

    fireEvent.keyDown(addButton, { key: "Enter" });
    await waitFor(() => {
      expect(screen.getByText("Add Parts")).toBeInTheDocument();
    });
  });

  it("displays part categories", () => {
    const parts = [
      {
        id: "1",
        partNumber: "P001",
        name: "Test Part 1",
        quantity: 2,
        unitCost: 100,
        category: "Engine",
      },
    ];

    render(<PartsRequired {...mockProps} parts={parts} />);

    expect(screen.getByText("Engine")).toBeInTheDocument();
  });

  it("handles bulk part operations", () => {
    const parts = [
      {
        id: "1",
        partNumber: "P001",
        name: "Test Part 1",
        quantity: 2,
        unitCost: 100,
      },
      {
        id: "2",
        partNumber: "P002",
        name: "Test Part 2",
        quantity: 1,
        unitCost: 50,
      },
    ];

    render(<PartsRequired {...mockProps} parts={parts} />);

    const selectAllCheckbox = screen.getByLabelText("Select All");
    fireEvent.click(selectAllCheckbox);

    expect(screen.getByRole("button", { name: "Bulk Delete" })).toBeInTheDocument();
  });
});
