import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import AdvancedAnalytics from "../../components/AdvancedAnalytics";
import { ErrorHandling } from "../../components/ErrorHandling";

// Mock the ErrorHandling hook
vi.mock("../../components/ErrorHandling", () => ({
  useErrorHandler: () => ({
    showError: vi.fn(),
  }),
}));

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
  BarChart: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="bar-chart">{children}</div>
  ),
  Bar: () => <div data-testid="bar" />,
  PieChart: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="pie-chart">{children}</div>
  ),
  Pie: () => <div data-testid="pie" />,
  Cell: () => <div data-testid="cell" />,
  AreaChart: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="area-chart">{children}</div>
  ),
  Area: () => <div data-testid="area" />,
}));

describe("AdvancedAnalytics", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  it("renders loading state initially", () => {
    render(<AdvancedAnalytics />);

    expect(
      screen.getByText("Loading Advanced Analytics..."),
    ).toBeInTheDocument();
    expect(screen.getByRole("progressbar")).toBeInTheDocument();
  });

  it("renders analytics dashboard after loading", async () => {
    render(<AdvancedAnalytics />);

    // Fast-forward timers to complete loading
    vi.advanceTimersByTime(2000);

    await waitFor(() => {
      expect(
        screen.getByText("Advanced Fleet Performance Analytics"),
      ).toBeInTheDocument();
    });

    expect(
      screen.getByText(
        "This dashboard provides real-time insights into fleet performance, predictive accuracy, and maintenance efficiency. Data updates every 5 seconds.",
      ),
    ).toBeInTheDocument();
  });

  it("displays key performance indicators", async () => {
    render(<AdvancedAnalytics />);

    vi.advanceTimersByTime(2000);

    await waitFor(() => {
      expect(screen.getByText("Overall Efficiency")).toBeInTheDocument();
      expect(screen.getByText("Predictive Accuracy")).toBeInTheDocument();
      expect(screen.getByText("Cost Savings (YTD)")).toBeInTheDocument();
      expect(screen.getByText("System Uptime")).toBeInTheDocument();
    });
  });

  it("displays performance metrics with percentage values", async () => {
    render(<AdvancedAnalytics />);

    vi.advanceTimersByTime(2000);

    await waitFor(() => {
      const efficiencyElement = screen.getByText(/Overall Efficiency/);
      expect(efficiencyElement).toBeInTheDocument();

      // Check that percentage values are displayed
      const percentageElements = screen.getAllByText(/%$/);
      expect(percentageElements.length).toBeGreaterThan(0);
    });
  });

  it("displays cost savings with currency formatting", async () => {
    render(<AdvancedAnalytics />);

    vi.advanceTimersByTime(2000);

    await waitFor(() => {
      const costElement = screen.getByText(/Cost Savings \(YTD\)/);
      expect(costElement).toBeInTheDocument();

      // Check for dollar sign in cost savings
      const dollarElements = screen.getAllByText(/\$/);
      expect(dollarElements.length).toBeGreaterThan(0);
    });
  });

  it("renders maintenance performance trends chart", async () => {
    render(<AdvancedAnalytics />);

    vi.advanceTimersByTime(2000);

    await waitFor(() => {
      expect(
        screen.getByText("Maintenance Performance Trends"),
      ).toBeInTheDocument();
      expect(screen.getByTestId("area-chart")).toBeInTheDocument();
    });
  });

  it("renders fleet efficiency overview pie chart", async () => {
    render(<AdvancedAnalytics />);

    vi.advanceTimersByTime(2000);

    await waitFor(() => {
      expect(screen.getByText("Fleet Efficiency Overview")).toBeInTheDocument();
      expect(screen.getByTestId("pie-chart")).toBeInTheDocument();
    });
  });

  it("renders ship readiness vs maintenance load chart", async () => {
    render(<AdvancedAnalytics />);

    vi.advanceTimersByTime(2000);

    await waitFor(() => {
      expect(
        screen.getByText("Ship Readiness vs Maintenance Load"),
      ).toBeInTheDocument();
      expect(screen.getByTestId("bar-chart")).toBeInTheDocument();
    });
  });

  it("displays analytics note with update frequency", async () => {
    render(<AdvancedAnalytics />);

    vi.advanceTimersByTime(2000);

    await waitFor(() => {
      expect(screen.getByText(/Analytics Note:/)).toBeInTheDocument();
      expect(
        screen.getByText(/Data is updated every 5 seconds/),
      ).toBeInTheDocument();
    });
  });

  it("updates data automatically every 5 seconds", async () => {
    const { useErrorHandler } = await import("../../components/ErrorHandling");
    const mockShowError = vi.fn();
    vi.mocked(useErrorHandler).mockReturnValue({
      showError: mockShowError,
    });

    render(<AdvancedAnalytics />);

    // Initial load
    vi.advanceTimersByTime(2000);
    await waitFor(() => {
      expect(mockShowError).toHaveBeenCalledWith(
        "Analytics data updated!",
        "info",
      );
    });

    // Clear previous calls
    mockShowError.mockClear();

    // Advance to trigger auto-refresh
    vi.advanceTimersByTime(5000);
    await waitFor(() => {
      expect(mockShowError).toHaveBeenCalledWith(
        "Analytics data updated!",
        "info",
      );
    });
  });

  it("cleans up intervals on unmount", () => {
    const clearIntervalSpy = vi.spyOn(global, "clearInterval");
    const clearTimeoutSpy = vi.spyOn(global, "clearTimeout");

    const { unmount } = render(<AdvancedAnalytics />);

    unmount();

    expect(clearIntervalSpy).toHaveBeenCalled();
    expect(clearTimeoutSpy).toHaveBeenCalled();
  });

  it("displays success alert with information about real-time updates", async () => {
    render(<AdvancedAnalytics />);

    vi.advanceTimersByTime(2000);

    await waitFor(() => {
      const alertElement = screen.getByRole("alert");
      expect(alertElement).toBeInTheDocument();
      expect(alertElement).toHaveClass("MuiAlert-standardSuccess");
    });
  });

  it("renders all chart components with proper structure", async () => {
    render(<AdvancedAnalytics />);

    vi.advanceTimersByTime(2000);

    await waitFor(() => {
      // Check for all chart types
      expect(screen.getByTestId("area-chart")).toBeInTheDocument();
      expect(screen.getByTestId("pie-chart")).toBeInTheDocument();
      expect(screen.getByTestId("bar-chart")).toBeInTheDocument();

      // Check for chart elements
      expect(screen.getAllByTestId("responsive-container")).toHaveLength(3);
    });
  });
});
