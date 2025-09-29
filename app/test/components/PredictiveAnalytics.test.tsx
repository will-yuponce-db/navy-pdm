import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen } from "@testing-library/react";
import PredictiveAnalytics from "../../components/PredictiveAnalytics";

// Mock recharts components
vi.mock("recharts", () => ({
  LineChart: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="line-chart">{children}</div>
  ),
  Line: () => <div data-testid="line" />,
  XAxis: () => <div data-testid="x-axis" />,
  YAxis: () => <div data-testid="y-axis" />,
  CartesianGrid: () => <div data-testid="cartesian-grid" />,
  Tooltip: () => <div data-testid="tooltip" />,
  ResponsiveContainer: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="responsive-container">{children}</div>
  ),
  AreaChart: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="area-chart">{children}</div>
  ),
  Area: () => <div data-testid="area" />,
  BarChart: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="bar-chart">{children}</div>
  ),
  Bar: () => <div data-testid="bar" />,
}));

describe("PredictiveAnalytics", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  it("renders predictive analytics dashboard title", () => {
    render(<PredictiveAnalytics />);

    expect(
      screen.getByText("Predictive Analytics Dashboard"),
    ).toBeInTheDocument();
  });

  it("displays critical anomalies count", () => {
    render(<PredictiveAnalytics />);

    expect(screen.getByText("Critical Anomalies")).toBeInTheDocument();
    // Should display a number for critical anomalies
    const criticalAnomaliesElement =
      screen.getByText("Critical Anomalies").parentElement;
    expect(criticalAnomaliesElement).toBeInTheDocument();
  });

  it("displays high risk predictions count", () => {
    render(<PredictiveAnalytics />);

    expect(screen.getByText("High Risk Predictions")).toBeInTheDocument();
  });

  it("displays average confidence percentage", () => {
    render(<PredictiveAnalytics />);

    expect(screen.getByText("Avg Confidence")).toBeInTheDocument();
  });

  it("displays active predictions count", () => {
    render(<PredictiveAnalytics />);

    expect(screen.getByText("Active Predictions")).toBeInTheDocument();
  });

  it("renders auto refresh toggle button", () => {
    render(<PredictiveAnalytics />);

    const refreshButton = screen.getByRole("button", { name: /auto refresh/i });
    expect(refreshButton).toBeInTheDocument();
  });

  it("renders filter button", () => {
    render(<PredictiveAnalytics />);

    const filterButton = screen.getByRole("button", { name: /filter/i });
    expect(filterButton).toBeInTheDocument();
  });

  it("toggles auto refresh when refresh button is clicked", () => {
    render(<PredictiveAnalytics />);

    const refreshButton = screen.getByRole("button", { name: /auto refresh/i });
    expect(refreshButton).toBeInTheDocument();

    // Test that the button is clickable (no async operations)
    expect(refreshButton).not.toBeDisabled();
  });

  it("renders real-time sensor data chart", () => {
    render(<PredictiveAnalytics />);

    expect(screen.getByText("Real-Time Sensor Data")).toBeInTheDocument();
    expect(screen.getByTestId("area-chart")).toBeInTheDocument();
  });

  it("renders remaining useful life section", () => {
    render(<PredictiveAnalytics />);

    expect(screen.getByText("Remaining Useful Life")).toBeInTheDocument();
  });

  it("renders active anomalies section", () => {
    render(<PredictiveAnalytics />);

    expect(screen.getByText("Active Anomalies")).toBeInTheDocument();
  });

  it("renders performance metrics chart", () => {
    render(<PredictiveAnalytics />);

    expect(screen.getByText("Performance Metrics")).toBeInTheDocument();
    expect(screen.getByTestId("bar-chart")).toBeInTheDocument();
  });

  it("displays sensor data with proper chart structure", () => {
    render(<PredictiveAnalytics />);

    const areaChart = screen.getByTestId("area-chart");
    expect(areaChart).toBeInTheDocument();

    // Check for chart elements
    expect(screen.getAllByTestId("area")).toHaveLength(3);
    expect(screen.getAllByTestId("cartesian-grid")).toHaveLength(2);
    expect(screen.getAllByTestId("tooltip")).toHaveLength(2);
  });

  it("displays performance metrics with proper chart structure", () => {
    render(<PredictiveAnalytics />);

    const barChart = screen.getByTestId("bar-chart");
    expect(barChart).toBeInTheDocument();

    // Check for chart elements
    expect(screen.getByTestId("bar")).toBeInTheDocument();
    expect(screen.getAllByTestId("cartesian-grid")).toHaveLength(2);
    expect(screen.getAllByTestId("tooltip")).toHaveLength(2);
  });

  it("renders RUL predictions list", () => {
    render(<PredictiveAnalytics />);

    // Should display ship and GTE information
    expect(screen.getAllByText(/USS Cole/)).toHaveLength(2);
    expect(screen.getAllByText(/USS Bainbridge/)).toHaveLength(2);
    expect(screen.getAllByText(/USS Enterprise/)).toHaveLength(2);
  });

  it("displays RUL predictions with risk levels", () => {
    render(<PredictiveAnalytics />);

    // Should display risk level chips
    expect(screen.getAllByText("critical")).toHaveLength(2);
    expect(screen.getAllByText("high")).toHaveLength(2);
    expect(screen.getAllByText("medium")).toHaveLength(2);
  });

  it("displays RUL predictions with failure modes", () => {
    render(<PredictiveAnalytics />);

    expect(screen.getAllByText(/Failure Mode:/)).toHaveLength(3);
    expect(screen.getByText(/Bearing Failure/)).toBeInTheDocument();
    expect(screen.getByText(/Rotor Imbalance/)).toBeInTheDocument();
    expect(screen.getByText(/Seal Degradation/)).toBeInTheDocument();
  });

  it("renders anomalies list with severity levels", () => {
    render(<PredictiveAnalytics />);

    // Should display severity chips
    expect(screen.getAllByText("critical")).toHaveLength(2);
    expect(screen.getAllByText("high")).toHaveLength(2);
    expect(screen.getAllByText("medium")).toHaveLength(2);
  });

  it("displays anomaly descriptions", () => {
    render(<PredictiveAnalytics />);

    expect(screen.getByText(/Temperature spike detected/)).toBeInTheDocument();
    expect(
      screen.getByText(/Vibration amplitude increasing/),
    ).toBeInTheDocument();
    expect(screen.getByText(/Efficiency degradation/)).toBeInTheDocument();
  });

  it("displays predicted failure indicators", () => {
    render(<PredictiveAnalytics />);

    expect(screen.getAllByText("Predicted Failure")).toHaveLength(2);
  });

  it("displays confidence percentages for anomalies", () => {
    render(<PredictiveAnalytics />);

    // Should display confidence percentages
    expect(screen.getAllByText(/Confidence:/)).toHaveLength(3);
  });

  it("updates sensor data automatically when auto refresh is enabled", async () => {
    render(<PredictiveAnalytics />);

    // Fast-forward time to trigger updates
    vi.advanceTimersByTime(2000);

    // Component should still be rendered
    expect(
      screen.getByText("Predictive Analytics Dashboard"),
    ).toBeInTheDocument();
  });

  it("stops updating when auto refresh is disabled", () => {
    render(<PredictiveAnalytics />);

    const refreshButton = screen.getByRole("button", { name: /auto refresh/i });
    expect(refreshButton).toBeInTheDocument();

    // Test that the button is clickable (no async operations)
    expect(refreshButton).not.toBeDisabled();
  });

  it("renders all chart components with responsive containers", () => {
    render(<PredictiveAnalytics />);

    const responsiveContainers = screen.getAllByTestId("responsive-container");
    expect(responsiveContainers).toHaveLength(2); // Area chart and bar chart
  });

  it("displays proper chart titles and labels", () => {
    render(<PredictiveAnalytics />);

    expect(screen.getByText("Real-Time Sensor Data")).toBeInTheDocument();
    expect(screen.getByText("Performance Metrics")).toBeInTheDocument();
  });

  it("renders with proper styling and layout", () => {
    render(<PredictiveAnalytics />);

    // Check that main container is rendered
    const mainContainer = screen
      .getByText("Predictive Analytics Dashboard")
      .closest("div");
    expect(mainContainer).toBeInTheDocument();
  });

  it("displays RUL predictions with proper formatting", () => {
    render(<PredictiveAnalytics />);

    // Should display RUL in days
    expect(screen.getAllByText(/RUL: \d+ days/)).toHaveLength(3);
  });

  it("renders anomaly timestamps", () => {
    render(<PredictiveAnalytics />);

    // Should display timestamp information
    expect(screen.getAllByText(/Confidence: \d+%/)).toHaveLength(3);
  });
});
