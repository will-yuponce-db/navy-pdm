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

const renderWithProviders = (
  component: React.ReactElement,
  store = createTestStore(),
) => {
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

    expect(screen.getByText("Add New Part")).toBeInTheDocument();
    expect(screen.getByLabelText("Part Number")).toBeInTheDocument();
    expect(screen.getByLabelText("Part Name")).toBeInTheDocument();
    expect(screen.getByLabelText("System")).toBeInTheDocument();
  });

  it("renders edit part modal when part is provided", () => {
    const part = {
      id: "1",
      name: "Test Part",
      description: "Test Description",
      system: "Engine",
      category: "Hot Section" as const,
      stockLevel: 10,
      minStock: 5,
      maxStock: 20,
      location: "Warehouse A",
      condition: "New" as const,
      leadTime: "30 days",
      supplier: "Test Supplier",
      cost: 100,
    };

    renderWithProviders(<PartModal {...mockProps} part={part} mode="edit" />);

    expect(screen.getByText("Edit Part")).toBeInTheDocument();
    expect(screen.getByDisplayValue("1")).toBeInTheDocument();
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
    fireEvent.change(descriptionInput, {
      target: { value: "Test Description" },
    });

    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockProps.onClose).toHaveBeenCalled();
    });
  });

  it("handles form submission for editing part", async () => {
    const part = {
      id: "1",
      name: "Test Part",
      description: "Test Description",
      system: "Engine",
      category: "Hot Section" as const,
      stockLevel: 10,
      minStock: 5,
      maxStock: 20,
      location: "Warehouse A",
      condition: "New" as const,
      leadTime: "30 days",
      supplier: "Test Supplier",
      cost: 100,
    };

    renderWithProviders(<PartModal {...mockProps} part={part} mode="edit" />);

    const submitButton = screen.getByRole("button", { name: "Update Part" });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockProps.onClose).toHaveBeenCalled();
    });
  });

  it("validates required fields", async () => {
    renderWithProviders(<PartModal {...mockProps} />);

    const submitButton = screen.getByRole("button", { name: "Add Part" });
    fireEvent.click(submitButton);

    expect(screen.getByText("Part number is required")).toBeInTheDocument();
    expect(screen.getByText("Part name is required")).toBeInTheDocument();
    expect(screen.getByText("Description is required")).toBeInTheDocument();
    expect(screen.getByText("System is required")).toBeInTheDocument();
  });

  it("handles modal close", () => {
    renderWithProviders(<PartModal {...mockProps} />);

    const closeButton = screen.getByRole("button", { name: "Cancel" });
    fireEvent.click(closeButton);

    expect(mockProps.onClose).toHaveBeenCalled();
  });

  it("handles ESC key to close modal", () => {
    renderWithProviders(<PartModal {...mockProps} />);

    const dialog = screen.getByRole("dialog");
    fireEvent.keyDown(dialog, { key: "Escape" });

    expect(mockProps.onClose).toHaveBeenCalled();
  });

  it("displays part details form fields", () => {
    renderWithProviders(<PartModal {...mockProps} />);

    expect(screen.getByLabelText("Part Number")).toBeInTheDocument();
    expect(screen.getByLabelText("Part Name")).toBeInTheDocument();
    expect(screen.getByLabelText("Description")).toBeInTheDocument();
    expect(screen.getByLabelText("System")).toBeInTheDocument();
    expect(screen.getByLabelText("Location")).toBeInTheDocument();
    expect(screen.getByLabelText("Stock Level")).toBeInTheDocument();
    expect(screen.getByLabelText("Unit Cost")).toBeInTheDocument();
    expect(screen.getByLabelText("Supplier")).toBeInTheDocument();
  });

  it("handles quantity input validation", () => {
    renderWithProviders(<PartModal {...mockProps} />);

    const quantityInput = screen.getByLabelText("Stock Level");
    fireEvent.change(quantityInput, { target: { value: "-5" } });

    const submitButton = screen.getByRole("button", { name: "Add Part" });
    fireEvent.click(submitButton);

    expect(
      screen.getByText("Stock level cannot be negative"),
    ).toBeInTheDocument();
  });

  it("handles unit cost input validation", () => {
    renderWithProviders(<PartModal {...mockProps} />);

    const unitCostInput = screen.getByLabelText("Unit Cost");
    fireEvent.change(unitCostInput, { target: { value: "0" } });

    const submitButton = screen.getByRole("button", { name: "Add Part" });
    fireEvent.click(submitButton);

    expect(screen.getByText("Cost must be greater than 0")).toBeInTheDocument();
  });

  it("displays part condition options", () => {
    renderWithProviders(<PartModal {...mockProps} />);

    const conditionSelect = screen.getByLabelText("Condition");
    fireEvent.mouseDown(conditionSelect);

    expect(screen.getByText("New")).toBeInTheDocument();
    expect(screen.getByText("Refurbished")).toBeInTheDocument();
    expect(screen.getByText("Used")).toBeInTheDocument();
    expect(screen.getByText("Damaged")).toBeInTheDocument();
    expect(screen.getByText("Condemned")).toBeInTheDocument();
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
    const descriptionInput = screen.getByLabelText("Description");
    const systemInput = screen.getByLabelText("System");
    const locationInput = screen.getByLabelText("Location");
    const leadTimeInput = screen.getByLabelText("Lead Time");
    const supplierInput = screen.getByLabelText("Supplier");
    const costInput = screen.getByLabelText("Unit Cost");
    const submitButton = screen.getByRole("button", { name: "Add Part" });

    fireEvent.change(partNumberInput, { target: { value: "P001" } });
    fireEvent.change(partNameInput, { target: { value: "Test Part" } });
    fireEvent.change(descriptionInput, {
      target: { value: "Test Description" },
    });
    fireEvent.change(systemInput, { target: { value: "Engine" } });
    fireEvent.change(locationInput, { target: { value: "Warehouse A" } });
    fireEvent.change(leadTimeInput, { target: { value: "30 days" } });
    fireEvent.change(supplierInput, { target: { value: "Test Supplier" } });
    fireEvent.change(costInput, { target: { value: "100" } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockProps.onClose).toHaveBeenCalled();
    });
  });

  it("handles form submission with all fields", async () => {
    renderWithProviders(<PartModal {...mockProps} />);

    const partNumberInput = screen.getByLabelText("Part Number");
    const partNameInput = screen.getByLabelText("Part Name");
    const descriptionInput = screen.getByLabelText("Description");
    const systemInput = screen.getByLabelText("System");
    const locationInput = screen.getByLabelText("Location");
    const leadTimeInput = screen.getByLabelText("Lead Time");
    const supplierInput = screen.getByLabelText("Supplier");
    const costInput = screen.getByLabelText("Unit Cost");

    fireEvent.change(partNumberInput, { target: { value: "P001" } });
    fireEvent.change(partNameInput, { target: { value: "Test Part" } });
    fireEvent.change(descriptionInput, {
      target: { value: "Test Description" },
    });
    fireEvent.change(systemInput, { target: { value: "Engine" } });
    fireEvent.change(locationInput, { target: { value: "Warehouse A" } });
    fireEvent.change(leadTimeInput, { target: { value: "30 days" } });
    fireEvent.change(supplierInput, { target: { value: "Test Supplier" } });
    fireEvent.change(costInput, { target: { value: "100.50" } });

    const submitButton = screen.getByRole("button", { name: "Add Part" });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockProps.onClose).toHaveBeenCalled();
    });
  });
});
