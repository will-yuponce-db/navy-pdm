import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AdvancedFilters } from "../../components/AdvancedFilters";
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
  {
    wo: "WO-003",
    ship: "USS Bainbridge",
    homeport: "Mayport",
    gte: "GTE-9012",
    fm: "Seal Leak",
    priority: "Priority",
    status: "Completed",
    eta: 25,
    createdAt: new Date("2024-01-17"),
  },
];

describe("AdvancedFilters", () => {
  const mockOnFilteredData = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders filter accordion with correct title", () => {
    render(
      <AdvancedFilters
        data={mockWorkOrders}
        onFilteredData={mockOnFilteredData}
      />,
    );

    expect(screen.getByText("Advanced Filters")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /expand more/i }),
    ).toBeInTheDocument();
  });

  it("expands accordion when clicked", async () => {
    const user = userEvent.setup();
    render(
      <AdvancedFilters
        data={mockWorkOrders}
        onFilteredData={mockOnFilteredData}
      />,
    );

    const expandButton = screen.getByRole("button", { name: /expand more/i });
    await user.click(expandButton);

    expect(
      screen.getByPlaceholderText("Search work orders..."),
    ).toBeInTheDocument();
  });

  it("displays search input when expanded", async () => {
    const user = userEvent.setup();
    render(
      <AdvancedFilters
        data={mockWorkOrders}
        onFilteredData={mockOnFilteredData}
      />,
    );

    const expandButton = screen.getByRole("button", { name: /expand more/i });
    await user.click(expandButton);

    expect(
      screen.getByPlaceholderText("Search work orders..."),
    ).toBeInTheDocument();
  });

  it("displays status filter dropdown", async () => {
    const user = userEvent.setup();
    render(
      <AdvancedFilters
        data={mockWorkOrders}
        onFilteredData={mockOnFilteredData}
      />,
    );

    const expandButton = screen.getByRole("button", { name: /expand more/i });
    await user.click(expandButton);

    expect(screen.getByLabelText("Status")).toBeInTheDocument();
  });

  it("displays priority filter dropdown", async () => {
    const user = userEvent.setup();
    render(
      <AdvancedFilters
        data={mockWorkOrders}
        onFilteredData={mockOnFilteredData}
      />,
    );

    const expandButton = screen.getByRole("button", { name: /expand more/i });
    await user.click(expandButton);

    expect(screen.getByLabelText("Priority")).toBeInTheDocument();
  });

  it("displays homeport filter dropdown", async () => {
    const user = userEvent.setup();
    render(
      <AdvancedFilters
        data={mockWorkOrders}
        onFilteredData={mockOnFilteredData}
      />,
    );

    const expandButton = screen.getByRole("button", { name: /expand more/i });
    await user.click(expandButton);

    expect(screen.getByLabelText("Homeport")).toBeInTheDocument();
  });

  it("filters data by search term", async () => {
    const user = userEvent.setup();
    render(
      <AdvancedFilters
        data={mockWorkOrders}
        onFilteredData={mockOnFilteredData}
      />,
    );

    const expandButton = screen.getByRole("button", { name: /expand more/i });
    await user.click(expandButton);

    const searchInput = screen.getByPlaceholderText("Search work orders...");
    await user.type(searchInput, "Enterprise");

    await waitFor(() => {
      expect(mockOnFilteredData).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({ ship: "USS Enterprise" }),
        ]),
      );
    });
  });

  it("filters data by status", async () => {
    const user = userEvent.setup();
    render(
      <AdvancedFilters
        data={mockWorkOrders}
        onFilteredData={mockOnFilteredData}
      />,
    );

    const expandButton = screen.getByRole("button", { name: /expand more/i });
    await user.click(expandButton);

    const statusSelect = screen.getByLabelText("Status");
    await user.click(statusSelect);

    const submittedOption = screen.getByRole("option", { name: "Submitted" });
    await user.click(submittedOption);

    await waitFor(() => {
      expect(mockOnFilteredData).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({ status: "Submitted" }),
        ]),
      );
    });
  });

  it("filters data by priority", async () => {
    const user = userEvent.setup();
    render(
      <AdvancedFilters
        data={mockWorkOrders}
        onFilteredData={mockOnFilteredData}
      />,
    );

    const expandButton = screen.getByRole("button", { name: /expand more/i });
    await user.click(expandButton);

    const prioritySelect = screen.getByLabelText("Priority");
    await user.click(prioritySelect);

    const casrepOption = screen.getByRole("option", { name: "CASREP" });
    await user.click(casrepOption);

    await waitFor(() => {
      expect(mockOnFilteredData).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({ priority: "CASREP" }),
        ]),
      );
    });
  });

  it("filters data by homeport", async () => {
    const user = userEvent.setup();
    render(
      <AdvancedFilters
        data={mockWorkOrders}
        onFilteredData={mockOnFilteredData}
      />,
    );

    const expandButton = screen.getByRole("button", { name: /expand more/i });
    await user.click(expandButton);

    const homeportSelect = screen.getByLabelText("Homeport");
    await user.click(homeportSelect);

    const sanDiegoOption = screen.getByRole("option", { name: "San Diego" });
    await user.click(sanDiegoOption);

    await waitFor(() => {
      expect(mockOnFilteredData).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({ homeport: "San Diego" }),
        ]),
      );
    });
  });

  it("displays ETA range slider", async () => {
    const user = userEvent.setup();
    render(
      <AdvancedFilters
        data={mockWorkOrders}
        onFilteredData={mockOnFilteredData}
      />,
    );

    const expandButton = screen.getByRole("button", { name: /expand more/i });
    await user.click(expandButton);

    expect(screen.getByText("ETA Range (days)")).toBeInTheDocument();
  });

  it("displays date range inputs", async () => {
    const user = userEvent.setup();
    render(
      <AdvancedFilters
        data={mockWorkOrders}
        onFilteredData={mockOnFilteredData}
      />,
    );

    const expandButton = screen.getByRole("button", { name: /expand more/i });
    await user.click(expandButton);

    expect(screen.getByLabelText("From")).toBeInTheDocument();
    expect(screen.getByLabelText("To")).toBeInTheDocument();
  });

  it("displays ships checkboxes", async () => {
    const user = userEvent.setup();
    render(
      <AdvancedFilters
        data={mockWorkOrders}
        onFilteredData={mockOnFilteredData}
      />,
    );

    const expandButton = screen.getByRole("button", { name: /expand more/i });
    await user.click(expandButton);

    expect(screen.getByText("Ships")).toBeInTheDocument();
    expect(screen.getByLabelText("USS Enterprise")).toBeInTheDocument();
  });

  it("displays failure modes checkboxes", async () => {
    const user = userEvent.setup();
    render(
      <AdvancedFilters
        data={mockWorkOrders}
        onFilteredData={mockOnFilteredData}
      />,
    );

    const expandButton = screen.getByRole("button", { name: /expand more/i });
    await user.click(expandButton);

    expect(screen.getByText("Failure Modes")).toBeInTheDocument();
    expect(screen.getByLabelText("Bearing Failure")).toBeInTheDocument();
  });

  it("displays sorting options", async () => {
    const user = userEvent.setup();
    render(
      <AdvancedFilters
        data={mockWorkOrders}
        onFilteredData={mockOnFilteredData}
      />,
    );

    const expandButton = screen.getByRole("button", { name: /expand more/i });
    await user.click(expandButton);

    expect(screen.getByText("Sort by:")).toBeInTheDocument();
    expect(screen.getByLabelText("Field")).toBeInTheDocument();
    expect(screen.getByLabelText("Order")).toBeInTheDocument();
  });

  it("displays clear filters button", async () => {
    const user = userEvent.setup();
    render(
      <AdvancedFilters
        data={mockWorkOrders}
        onFilteredData={mockOnFilteredData}
      />,
    );

    const expandButton = screen.getByRole("button", { name: /expand more/i });
    await user.click(expandButton);

    expect(
      screen.getByRole("button", { name: "Clear Filters" }),
    ).toBeInTheDocument();
  });

  it("clears all filters when clear button is clicked", async () => {
    const user = userEvent.setup();
    render(
      <AdvancedFilters
        data={mockWorkOrders}
        onFilteredData={mockOnFilteredData}
      />,
    );

    const expandButton = screen.getByRole("button", { name: /expand more/i });
    await user.click(expandButton);

    // Set some filters first
    const searchInput = screen.getByPlaceholderText("Search work orders...");
    await user.type(searchInput, "test");

    // Clear filters
    const clearButton = screen.getByRole("button", { name: "Clear Filters" });
    await user.click(clearButton);

    await waitFor(() => {
      expect(searchInput).toHaveValue("");
    });
  });

  it("shows active filters count in chip", async () => {
    const user = userEvent.setup();
    render(
      <AdvancedFilters
        data={mockWorkOrders}
        onFilteredData={mockOnFilteredData}
      />,
    );

    const expandButton = screen.getByRole("button", { name: /expand more/i });
    await user.click(expandButton);

    // Set a filter
    const searchInput = screen.getByPlaceholderText("Search work orders...");
    await user.type(searchInput, "test");

    // Check that chip appears with count
    await waitFor(() => {
      expect(screen.getByText("1")).toBeInTheDocument();
    });
  });

  it("calls onFilteredData with all data when no filters applied", async () => {
    render(
      <AdvancedFilters
        data={mockWorkOrders}
        onFilteredData={mockOnFilteredData}
      />,
    );

    await waitFor(() => {
      expect(mockOnFilteredData).toHaveBeenCalledWith(mockWorkOrders);
    });
  });

  it("handles empty data array", () => {
    render(<AdvancedFilters data={[]} onFilteredData={mockOnFilteredData} />);

    expect(screen.getByText("Advanced Filters")).toBeInTheDocument();
  });

  it("filters by multiple criteria simultaneously", async () => {
    const user = userEvent.setup();
    render(
      <AdvancedFilters
        data={mockWorkOrders}
        onFilteredData={mockOnFilteredData}
      />,
    );

    const expandButton = screen.getByRole("button", { name: /expand more/i });
    await user.click(expandButton);

    // Set multiple filters
    const searchInput = screen.getByPlaceholderText("Search work orders...");
    await user.type(searchInput, "USS");

    const statusSelect = screen.getByLabelText("Status");
    await user.click(statusSelect);
    const submittedOption = screen.getByRole("option", { name: "Submitted" });
    await user.click(submittedOption);

    await waitFor(() => {
      expect(mockOnFilteredData).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            ship: expect.stringContaining("USS"),
            status: "Submitted",
          }),
        ]),
      );
    });
  });
});
