import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { Provider } from "react-redux";
import { configureStore } from "@reduxjs/toolkit";
import PartModal from "../../components/PartModal";
// import { partsSlice } from "../../redux/services/partsSlice";

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

describe("PartModal", () => {
  const mockProps = {
    open: true,
    onClose: vi.fn(),
    mode: "add" as const,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders part modal when open", () => {
    renderWithProviders(<PartModal {...mockProps} />);

    expect(screen.getByText("Add Part")).toBeInTheDocument();
    expect(screen.getByLabelText("Name")).toBeInTheDocument();
    expect(screen.getByLabelText("System")).toBeInTheDocument();
  });

  it("renders edit part modal when part is provided", () => {
    const part = {
      id: "1",
      partNumber: "P001",
      name: "Test Part",
      description: "Test Description",
      quantity: 10,
      unitCost: 100,
      supplier: "Test Supplier",
      status: "Available",
    };

    renderWithProviders(<PartModal {...mockProps} part={part} />);

    expect(screen.getByText("Edit Part")).toBeInTheDocument();
    expect(screen.getByDisplayValue("P001")).toBeInTheDocument();
    expect(screen.getByDisplayValue("Test Part")).toBeInTheDocument();
  });

  it("handles form submission for new part", async () => {
    renderWithProviders(<PartModal {...mockProps} />);

    const partNumberInput = screen.getByLabelText("Part Number");
    const partNameInput = screen.getByLabelText("Part Name");
    const descriptionInput = screen.getByLabelText("Description");
    const submitButton = screen.getByRole("button", { name: "Add Part" });

    fireEvent.change(partNumberInput, { target: { value: "P001" } });
    fireEvent.change(partNameInput, { target: { value: "Test Part" } });
    fireEvent.change(descriptionInput, { target: { value: "Test Description" } });

    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockProps.handleModalClose).toHaveBeenCalled();
    });
  });

  it("handles form submission for editing part", async () => {
    const part = {
      id: "1",
      partNumber: "P001",
      name: "Test Part",
      description: "Test Description",
      quantity: 10,
      unitCost: 100,
      supplier: "Test Supplier",
      status: "Available",
    };

    renderWithProviders(<PartModal {...mockProps} part={part} />);

    const submitButton = screen.getByRole("button", { name: "Update Part" });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockProps.handleModalClose).toHaveBeenCalled();
    });
  });

  it("validates required fields", async () => {
    renderWithProviders(<PartModal {...mockProps} />);

    const submitButton = screen.getByRole("button", { name: "Add Part" });
    fireEvent.click(submitButton);

    expect(screen.getByText("Part number is required")).toBeInTheDocument();
    expect(screen.getByText("Part name is required")).toBeInTheDocument();
  });

  it("handles modal close", () => {
    renderWithProviders(<PartModal {...mockProps} />);

    const closeButton = screen.getByRole("button", { name: "Cancel" });
    fireEvent.click(closeButton);

    expect(mockProps.handleModalClose).toHaveBeenCalled();
  });

  it("handles ESC key to close modal", () => {
    renderWithProviders(<PartModal {...mockProps} />);

    fireEvent.keyDown(document, { key: "Escape" });

    expect(mockProps.handleModalClose).toHaveBeenCalled();
  });

  it("displays part details form fields", () => {
    renderWithProviders(<PartModal {...mockProps} />);

    expect(screen.getByLabelText("Part Number")).toBeInTheDocument();
    expect(screen.getByLabelText("Part Name")).toBeInTheDocument();
    expect(screen.getByLabelText("Description")).toBeInTheDocument();
    expect(screen.getByLabelText("Quantity")).toBeInTheDocument();
    expect(screen.getByLabelText("Unit Cost")).toBeInTheDocument();
    expect(screen.getByLabelText("Supplier")).toBeInTheDocument();
  });

  it("handles quantity input validation", () => {
    renderWithProviders(<PartModal {...mockProps} />);

    const quantityInput = screen.getByLabelText("Quantity");
    fireEvent.change(quantityInput, { target: { value: "-5" } });

    const submitButton = screen.getByRole("button", { name: "Add Part" });
    fireEvent.click(submitButton);

    expect(screen.getByText("Quantity must be a positive number")).toBeInTheDocument();
  });

  it("handles unit cost input validation", () => {
    renderWithProviders(<PartModal {...mockProps} />);

    const unitCostInput = screen.getByLabelText("Unit Cost");
    fireEvent.change(unitCostInput, { target: { value: "invalid" } });

    const submitButton = screen.getByRole("button", { name: "Add Part" });
    fireEvent.click(submitButton);

    expect(screen.getByText("Unit cost must be a valid number")).toBeInTheDocument();
  });

  it("displays part status options", () => {
    renderWithProviders(<PartModal {...mockProps} />);

    const statusSelect = screen.getByLabelText("Status");
    fireEvent.mouseDown(statusSelect);

    expect(screen.getByText("Available")).toBeInTheDocument();
    expect(screen.getByText("Out of Stock")).toBeInTheDocument();
    expect(screen.getByText("Discontinued")).toBeInTheDocument();
  });

  it("handles form reset on modal close", () => {
    renderWithProviders(<PartModal {...mockProps} />);

    const partNumberInput = screen.getByLabelText("Part Number");
    fireEvent.change(partNumberInput, { target: { value: "P001" } });

    const closeButton = screen.getByRole("button", { name: "Cancel" });
    fireEvent.click(closeButton);

    // Reopen modal
    renderWithProviders(<PartModal {...mockProps} />);
    expect(screen.getByLabelText("Part Number")).toHaveValue("");
  });

  it("focuses first input when modal opens", () => {
    renderWithProviders(<PartModal {...mockProps} />);

    const partNumberInput = screen.getByLabelText("Part Number");
    expect(document.activeElement).toBe(partNumberInput);
  });

  it("handles tab navigation in form", () => {
    renderWithProviders(<PartModal {...mockProps} />);

    const partNumberInput = screen.getByLabelText("Part Number");
    const partNameInput = screen.getByLabelText("Part Name");

    partNumberInput.focus();
    fireEvent.keyDown(partNumberInput, { key: "Tab" });

    expect(document.activeElement).toBe(partNameInput);
  });

  it("displays loading state during submission", async () => {
    renderWithProviders(<PartModal {...mockProps} />);

    const partNumberInput = screen.getByLabelText("Part Number");
    const partNameInput = screen.getByLabelText("Part Name");
    const submitButton = screen.getByRole("button", { name: "Add Part" });

    fireEvent.change(partNumberInput, { target: { value: "P001" } });
    fireEvent.change(partNameInput, { target: { value: "Test Part" } });
    fireEvent.click(submitButton);

    expect(screen.getByText("Adding Part...")).toBeInTheDocument();
  });

  it("handles form submission with all fields", async () => {
    renderWithProviders(<PartModal {...mockProps} />);

    const partNumberInput = screen.getByLabelText("Part Number");
    const partNameInput = screen.getByLabelText("Part Name");
    const descriptionInput = screen.getByLabelText("Description");
    const quantityInput = screen.getByLabelText("Quantity");
    const unitCostInput = screen.getByLabelText("Unit Cost");
    const supplierInput = screen.getByLabelText("Supplier");

    fireEvent.change(partNumberInput, { target: { value: "P001" } });
    fireEvent.change(partNameInput, { target: { value: "Test Part" } });
    fireEvent.change(descriptionInput, { target: { value: "Test Description" } });
    fireEvent.change(quantityInput, { target: { value: "10" } });
    fireEvent.change(unitCostInput, { target: { value: "100.50" } });
    fireEvent.change(supplierInput, { target: { value: "Test Supplier" } });

    const submitButton = screen.getByRole("button", { name: "Add Part" });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockProps.handleModalClose).toHaveBeenCalled();
    });
  });
});
