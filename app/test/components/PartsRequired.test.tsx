import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { Provider } from "react-redux";
import { configureStore } from "@reduxjs/toolkit";
import PartsRequired from "../../components/PartsRequired";

// Mock store
const createTestStore = () => {
  return configureStore({
    reducer: {
      parts: (state = { parts: [], loading: false, error: null }) => state,
    },
    preloadedState: {
      parts: {
        parts: [],
        loading: false,
        error: null,
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
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders parts required component", () => {
    renderWithProviders(<PartsRequired {...mockProps} />);

    expect(screen.getByText("Parts Required")).toBeInTheDocument();
  });

  it("displays add part button", () => {
    renderWithProviders(<PartsRequired {...mockProps} />);

    expect(screen.getByRole("button", { name: "Add Part" })).toBeInTheDocument();
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

    const addButton = screen.getByRole("button", { name: "Add Part" });
    fireEvent.click(addButton);

    expect(screen.getByLabelText("Part Number")).toBeInTheDocument();
    expect(screen.getByLabelText("Quantity")).toBeInTheDocument();
  });

  it("handles part form submission", async () => {
    renderWithProviders(<PartsRequired {...mockProps} />);

    const addButton = screen.getByRole("button", { name: "Add Part" });
    fireEvent.click(addButton);

    const partNumberInput = screen.getByLabelText("Part Number");
    const quantityInput = screen.getByLabelText("Quantity");
    const submitButton = screen.getByRole("button", { name: "Add" });

    fireEvent.change(partNumberInput, { target: { value: "P001" } });
    fireEvent.change(quantityInput, { target: { value: "2" } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockProps.onPartsChange).toHaveBeenCalled();
    });
  });

  it("handles part form cancellation", () => {
    renderWithProviders(<PartsRequired {...mockProps} />);

    const addButton = screen.getByRole("button", { name: "Add Part" });
    fireEvent.click(addButton);

    const cancelButton = screen.getByRole("button", { name: "Cancel" });
    fireEvent.click(cancelButton);

    expect(screen.queryByLabelText("Part Number")).not.toBeInTheDocument();
  });

  it("validates required fields in part form", async () => {
    renderWithProviders(<PartsRequired {...mockProps} />);

    const addButton = screen.getByRole("button", { name: "Add Part" });
    fireEvent.click(addButton);

    const submitButton = screen.getByRole("button", { name: "Add" });
    fireEvent.click(submitButton);

    expect(screen.getByText("Part number is required")).toBeInTheDocument();
    expect(screen.getByText("Quantity is required")).toBeInTheDocument();
  });

  it("handles quantity validation", async () => {
    renderWithProviders(<PartsRequired {...mockProps} />);

    const addButton = screen.getByRole("button", { name: "Add Part" });
    fireEvent.click(addButton);

    const quantityInput = screen.getByLabelText("Quantity");
    fireEvent.change(quantityInput, { target: { value: "-1" } });

    const submitButton = screen.getByRole("button", { name: "Add" });
    fireEvent.click(submitButton);

    expect(screen.getByText("Quantity must be greater than 0")).toBeInTheDocument();
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

  it("handles part search functionality", () => {
    renderWithProviders(<PartsRequired {...mockProps} />);

    const addButton = screen.getByRole("button", { name: "Add Part" });
    fireEvent.click(addButton);

    const searchButton = screen.getByRole("button", { name: "Search" });
    fireEvent.click(searchButton);

    expect(screen.getByText("Part Search")).toBeInTheDocument();
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

  it("handles keyboard navigation", () => {
    renderWithProviders(<PartsRequired {...mockProps} />);

    const addButton = screen.getByRole("button", { name: "Add Part" });
    addButton.focus();

    fireEvent.keyDown(addButton, { key: "Enter" });
    expect(screen.getByLabelText("Part Number")).toBeInTheDocument();
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
