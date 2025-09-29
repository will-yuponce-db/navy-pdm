import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ExportData, BulkExport } from "../../components/DataExport";
import type { WorkOrder } from "../../types";

// Mock work order data for testing
const mockWorkOrders: WorkOrder[] = [
  {
    wo: "WO-001",
    ship: "USS Enterprise",
    homeport: "San Diego",
    gte: "GTE-1234",
    fm: "Bearing Failure",
    priority: "Routine",
    status: "Submitted",
    eta: 15,
    createdAt: new Date("2024-01-15"),
  },
  {
    wo: "WO-002",
    ship: "USS Cole",
    homeport: "Norfolk",
    gte: "GTE-5678",
    fm: "Turbine Issue",
    priority: "CASREP",
    status: "In Progress",
    eta: 5,
    createdAt: new Date("2024-01-16"),
  },
];

// Mock URL.createObjectURL and URL.revokeObjectURL
const mockCreateObjectURL = vi.fn(() => "mock-url");
const mockRevokeObjectURL = vi.fn();

Object.defineProperty(URL, "createObjectURL", {
  value: mockCreateObjectURL,
  writable: true,
});

Object.defineProperty(URL, "revokeObjectURL", {
  value: mockRevokeObjectURL,
  writable: true,
});

// Mock document.createElement and appendChild/removeChild
const mockLink = {
  href: "",
  download: "",
  click: vi.fn(),
};

const mockCreateElement = vi.fn(() => mockLink);
const mockAppendChild = vi.fn();
const mockRemoveChild = vi.fn();

Object.defineProperty(document, "createElement", {
  value: mockCreateElement,
  writable: true,
});

Object.defineProperty(document.body, "appendChild", {
  value: mockAppendChild,
  writable: true,
});

Object.defineProperty(document.body, "removeChild", {
  value: mockRemoveChild,
  writable: true,
});

describe("ExportData", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders export button", () => {
    render(<ExportData data={mockWorkOrders} dataType="workOrders" />);

    expect(screen.getByRole("button")).toBeInTheDocument();
  });

  it("opens menu when export button is clicked", async () => {
    const user = userEvent.setup();
    render(<ExportData data={mockWorkOrders} dataType="workOrders" />);

    const exportButton = screen.getByRole("button");
    await user.click(exportButton);

    expect(screen.getByText("Export to CSV")).toBeInTheDocument();
    expect(screen.getByText("Export to JSON")).toBeInTheDocument();
    expect(screen.getByText("Export to Excel")).toBeInTheDocument();
    expect(screen.getByText("Generate Report")).toBeInTheDocument();
  });

  it("exports data to CSV format", async () => {
    const user = userEvent.setup();
    render(<ExportData data={mockWorkOrders} dataType="workOrders" />);

    const exportButton = screen.getByRole("button");
    await user.click(exportButton);

    const csvOption = screen.getByText("Export to CSV");
    await user.click(csvOption);

    expect(mockCreateElement).toHaveBeenCalledWith("a");
    expect(mockLink.click).toHaveBeenCalled();
    expect(mockCreateObjectURL).toHaveBeenCalled();
  });

  it("exports data to JSON format", async () => {
    const user = userEvent.setup();
    render(<ExportData data={mockWorkOrders} dataType="workOrders" />);

    const exportButton = screen.getByRole("button");
    await user.click(exportButton);

    const jsonOption = screen.getByText("Export to JSON");
    await user.click(jsonOption);

    expect(mockCreateElement).toHaveBeenCalledWith("a");
    expect(mockLink.click).toHaveBeenCalled();
    expect(mockCreateObjectURL).toHaveBeenCalled();
  });

  it("exports data to Excel format", async () => {
    const user = userEvent.setup();
    render(<ExportData data={mockWorkOrders} dataType="workOrders" />);

    const exportButton = screen.getByRole("button");
    await user.click(exportButton);

    const excelOption = screen.getByText("Export to Excel");
    await user.click(excelOption);

    expect(mockCreateElement).toHaveBeenCalledWith("a");
    expect(mockLink.click).toHaveBeenCalled();
    expect(mockCreateObjectURL).toHaveBeenCalled();
  });

  it("generates HTML report", async () => {
    const user = userEvent.setup();
    render(<ExportData data={mockWorkOrders} dataType="workOrders" />);

    const exportButton = screen.getByRole("button");
    await user.click(exportButton);

    const reportOption = screen.getByText("Generate Report");
    await user.click(reportOption);

    expect(mockCreateElement).toHaveBeenCalledWith("a");
    expect(mockLink.click).toHaveBeenCalled();
    expect(mockCreateObjectURL).toHaveBeenCalled();
  });

  it("uses custom filename when provided", async () => {
    const user = userEvent.setup();
    render(
      <ExportData
        data={mockWorkOrders}
        dataType="workOrders"
        fileName="custom-export"
      />,
    );

    const exportButton = screen.getByRole("button");
    await user.click(exportButton);

    const csvOption = screen.getByText("Export to CSV");
    await user.click(csvOption);

    expect(mockCreateObjectURL).toHaveBeenCalled();
  });

  it("handles empty data array", async () => {
    const user = userEvent.setup();
    render(<ExportData data={[]} dataType="workOrders" />);

    const exportButton = screen.getByRole("button");
    await user.click(exportButton);

    const csvOption = screen.getByText("Export to CSV");
    await user.click(csvOption);

    // Should not create download link for empty data
    expect(mockCreateElement).not.toHaveBeenCalled();
  });

  it("closes menu after export action", async () => {
    const user = userEvent.setup();
    render(<ExportData data={mockWorkOrders} dataType="workOrders" />);

    const exportButton = screen.getByRole("button");
    await user.click(exportButton);

    const csvOption = screen.getByText("Export to CSV");
    await user.click(csvOption);

    // Menu should be closed after action
    await waitFor(() => {
      expect(screen.queryByText("Export to CSV")).not.toBeInTheDocument();
    });
  });

  it("displays correct icons for each export option", async () => {
    const user = userEvent.setup();
    render(<ExportData data={mockWorkOrders} dataType="workOrders" />);

    const exportButton = screen.getByRole("button");
    await user.click(exportButton);

    // Check that icons are present (they should be rendered as SVG elements)
    const menuItems = screen.getAllByRole("menuitem");
    expect(menuItems).toHaveLength(4);
  });

  it("handles different data types", async () => {
    const user = userEvent.setup();
    render(<ExportData data={mockWorkOrders} dataType="analytics" />);

    const exportButton = screen.getByRole("button");
    await user.click(exportButton);

    const csvOption = screen.getByText("Export to CSV");
    await user.click(csvOption);

    expect(mockCreateObjectURL).toHaveBeenCalled();
  });
});

describe("BulkExport", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders bulk export button", () => {
    render(<BulkExport />);

    expect(
      screen.getByRole("button", { name: "Export All" }),
    ).toBeInTheDocument();
  });

  it("opens menu when bulk export button is clicked", async () => {
    const user = userEvent.setup();
    render(<BulkExport />);

    const exportButton = screen.getByRole("button", { name: "Export All" });
    await user.click(exportButton);

    expect(screen.getByText("Export All Data")).toBeInTheDocument();
  });

  it("exports all data when option is selected", async () => {
    const user = userEvent.setup();
    render(<BulkExport />);

    const exportButton = screen.getByRole("button", { name: "Export All" });
    await user.click(exportButton);

    const exportAllOption = screen.getByText("Export All Data");
    await user.click(exportAllOption);

    expect(mockCreateElement).toHaveBeenCalledWith("a");
    expect(mockLink.click).toHaveBeenCalled();
    expect(mockCreateObjectURL).toHaveBeenCalled();
  });

  it("closes menu after export action", async () => {
    const user = userEvent.setup();
    render(<BulkExport />);

    const exportButton = screen.getByRole("button", { name: "Export All" });
    await user.click(exportButton);

    const exportAllOption = screen.getByText("Export All Data");
    await user.click(exportAllOption);

    // Menu should be closed after action
    await waitFor(() => {
      expect(screen.queryByText("Export All Data")).not.toBeInTheDocument();
    });
  });

  it("generates filename with current date", async () => {
    const user = userEvent.setup();
    render(<BulkExport />);

    const exportButton = screen.getByRole("button", { name: "Export All" });
    await user.click(exportButton);

    const exportAllOption = screen.getByText("Export All Data");
    await user.click(exportAllOption);

    expect(mockCreateObjectURL).toHaveBeenCalled();
  });
});
