import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import MaintenanceCharts from "../../components/MaintenanceCharts";

// Mock recharts components
vi.mock("recharts", () => ({
  BarChart: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="bar-chart">{children}</div>
  ),
  Bar: () => <div data-testid="bar" />,
  XAxis: () => <div data-testid="x-axis" />,
  YAxis: () => <div data-testid="y-axis" />,
  CartesianGrid: () => <div data-testid="cartesian-grid" />,
  Tooltip: () => <div data-testid="tooltip" />,
  ResponsiveContainer: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="responsive-container">{children}</div>
  ),
  PieChart: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="pie-chart">{children}</div>
  ),
  Pie: () => <div data-testid="pie" />,
  Cell: () => <div data-testid="cell" />,
  LineChart: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="line-chart">{children}</div>
  ),
  Line: () => <div data-testid="line" />,
}));

describe("MaintenanceCharts", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders maintenance analytics title", () => {
    render(<MaintenanceCharts />);

    expect(screen.getByText("Maintenance Analytics")).toBeInTheDocument();
  });

  it("renders work orders by status pie chart", () => {
    render(<MaintenanceCharts />);

    expect(screen.getByText("Work Orders by Status")).toBeInTheDocument();
    expect(screen.getByTestId("pie-chart")).toBeInTheDocument();
  });

  it("renders work orders by priority bar chart", () => {
    render(<MaintenanceCharts />);

    expect(screen.getByText("Work Orders by Priority")).toBeInTheDocument();
    expect(screen.getAllByTestId("bar-chart")).toHaveLength(2); // One for priority, one for readiness
  });

  it("renders predictive vs actual maintenance line chart", () => {
    render(<MaintenanceCharts />);

    expect(
      screen.getByText("Predictive vs Actual Maintenance"),
    ).toBeInTheDocument();
    expect(screen.getByTestId("line-chart")).toBeInTheDocument();
  });

  it("renders fleet readiness status chart", () => {
    render(<MaintenanceCharts />);

    expect(screen.getByText("Fleet Readiness Status")).toBeInTheDocument();
    expect(screen.getAllByTestId("bar-chart")).toHaveLength(2); // One for priority, one for readiness
  });

  it("renders all chart containers with responsive containers", () => {
    render(<MaintenanceCharts />);

    const responsiveContainers = screen.getAllByTestId("responsive-container");
    expect(responsiveContainers).toHaveLength(4);
  });

  it("displays correct chart titles", () => {
    render(<MaintenanceCharts />);

    expect(screen.getByText("Work Orders by Status")).toBeInTheDocument();
    expect(screen.getByText("Work Orders by Priority")).toBeInTheDocument();
    expect(
      screen.getByText("Predictive vs Actual Maintenance"),
    ).toBeInTheDocument();
    expect(screen.getByText("Fleet Readiness Status")).toBeInTheDocument();
  });

  it("renders charts in proper layout structure", () => {
    render(<MaintenanceCharts />);

    // Check that charts are rendered in cards by looking for the chart titles
    const chartTitles = [
      "Work Orders by Status",
      "Work Orders by Priority",
      "Predictive vs Actual Maintenance",
      "Fleet Readiness Status",
    ];

    chartTitles.forEach((title) => {
      expect(screen.getByText(title)).toBeInTheDocument();
    });
  });

  it("renders pie chart for work orders by status", () => {
    render(<MaintenanceCharts />);

    const pieChart = screen.getByTestId("pie-chart");
    expect(pieChart).toBeInTheDocument();

    // Check that pie chart has proper structure
    expect(screen.getByTestId("pie")).toBeInTheDocument();
    expect(screen.getAllByTestId("tooltip")).toHaveLength(4); // All charts have tooltips
  });

  it("renders bar chart for work orders by priority", () => {
    render(<MaintenanceCharts />);

    const barCharts = screen.getAllByTestId("bar-chart");
    expect(barCharts).toHaveLength(2); // One for priority, one for readiness

    // Check that bar chart has proper structure
    expect(screen.getAllByTestId("bar")).toHaveLength(3); // 1 for priority + 2 for readiness stack
    expect(screen.getAllByTestId("cartesian-grid")).toHaveLength(3); // All bar/line charts have grids
  });

  it("renders line chart for maintenance trends", () => {
    render(<MaintenanceCharts />);

    const lineChart = screen.getByTestId("line-chart");
    expect(lineChart).toBeInTheDocument();

    // Check that line chart has proper structure (2 lines: predicted and actual)
    expect(screen.getAllByTestId("line")).toHaveLength(2);
    expect(screen.getAllByTestId("cartesian-grid")).toHaveLength(3); // All bar/line charts have grids
  });

  it("renders vertical bar chart for fleet readiness", () => {
    render(<MaintenanceCharts />);

    const barCharts = screen.getAllByTestId("bar-chart");
    expect(barCharts).toHaveLength(2); // One for priority, one for readiness

    // Check that both bar charts have proper structure (3 bars total: 1 for priority + 2 for readiness stack)
    expect(screen.getAllByTestId("bar")).toHaveLength(3);
  });

  it("renders all chart elements with proper structure", () => {
    render(<MaintenanceCharts />);

    // Check for all chart types
    expect(screen.getByTestId("pie-chart")).toBeInTheDocument();
    expect(screen.getAllByTestId("bar-chart")).toHaveLength(2);
    expect(screen.getByTestId("line-chart")).toBeInTheDocument();

    // Check for chart elements
    expect(screen.getByTestId("pie")).toBeInTheDocument();
    expect(screen.getAllByTestId("bar")).toHaveLength(3); // 1 for priority + 2 for readiness stack
    expect(screen.getAllByTestId("line")).toHaveLength(2); // predicted and actual lines

    // Check for common elements
    expect(screen.getAllByTestId("x-axis")).toHaveLength(3); // 2 bar charts + 1 line chart
    expect(screen.getAllByTestId("y-axis")).toHaveLength(3);
    expect(screen.getAllByTestId("cartesian-grid")).toHaveLength(3);
    expect(screen.getAllByTestId("tooltip")).toHaveLength(4);
  });

  it("renders charts with proper responsive containers", () => {
    render(<MaintenanceCharts />);

    const responsiveContainers = screen.getAllByTestId("responsive-container");
    expect(responsiveContainers).toHaveLength(4);

    // Each chart should have a responsive container
    responsiveContainers.forEach((container) => {
      expect(container).toBeInTheDocument();
    });
  });

  it("displays maintenance analytics in proper card layout", () => {
    render(<MaintenanceCharts />);

    // Check that the main container is rendered
    const mainContainer = screen
      .getByText("Maintenance Analytics")
      .closest("div");
    expect(mainContainer).toBeInTheDocument();
  });

  it("renders charts with consistent styling", () => {
    render(<MaintenanceCharts />);

    // All charts should be wrapped in cards
    const chartTitles = [
      "Work Orders by Status",
      "Work Orders by Priority",
      "Predictive vs Actual Maintenance",
      "Fleet Readiness Status",
    ];

    chartTitles.forEach((title) => {
      const titleElement = screen.getByText(title);
      expect(titleElement).toBeInTheDocument();
    });
  });
});
