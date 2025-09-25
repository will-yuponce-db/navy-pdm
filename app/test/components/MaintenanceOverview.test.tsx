import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import MaintenanceOverview from "../../components/MaintenanceOverview";

describe("MaintenanceOverview", () => {
  it("renders the maintenance overview component", () => {
    render(<MaintenanceOverview />);

    expect(screen.getByText("Fleet Maintenance Overview")).toBeInTheDocument();
  });

  it("displays the description text", () => {
    render(<MaintenanceOverview />);

    expect(
      screen.getByText(/Commanders' view for Gas Turbine Engines/),
    ).toBeInTheDocument();
  });

  it("shows the critical alert", () => {
    render(<MaintenanceOverview />);

    expect(screen.getByText(/Attention:/)).toBeInTheDocument();
    expect(
      screen.getByText(/CASREP GTEs require immediate attention/),
    ).toBeInTheDocument();
  });

  it("displays all KPI cards", () => {
    render(<MaintenanceOverview />);

    // Check for KPI titles
    expect(
      screen.getByText("GTEs – Need Maintenance (predicted)"),
    ).toBeInTheDocument();
    expect(screen.getByText("GTEs – Fully Operational")).toBeInTheDocument();
    expect(screen.getByText("CASREP GTEs")).toBeInTheDocument();
  });

  it("displays correct KPI metrics", () => {
    render(<MaintenanceOverview />);

    // Check for KPI metrics
    expect(screen.getByText("51")).toBeInTheDocument();
    expect(screen.getByText("153")).toBeInTheDocument();
    expect(screen.getByText("7")).toBeInTheDocument();
  });

  it("displays KPI details", () => {
    render(<MaintenanceOverview />);

    expect(
      screen.getByText("Across all ships (model inference)"),
    ).toBeInTheDocument();
    expect(screen.getByText("No faults observed")).toBeInTheDocument();
    expect(
      screen.getByText("Requires immediate attention"),
    ).toBeInTheDocument();
  });

  it("shows trend indicators", () => {
    render(<MaintenanceOverview />);

    expect(screen.getByText("Increasing")).toBeInTheDocument();
    expect(screen.getByText("Stable")).toBeInTheDocument();
    expect(screen.getByText("Decreasing")).toBeInTheDocument();
  });

  it("displays progress indicator for critical items", () => {
    render(<MaintenanceOverview />);

    expect(screen.getByText("Urgent Action Required")).toBeInTheDocument();
  });

  it("has proper accessibility attributes", () => {
    render(<MaintenanceOverview />);

    // Check for alert role
    const alert = screen.getByRole("alert");
    expect(alert).toBeInTheDocument();

    // Check for group role
    const group = screen.getByRole("group");
    expect(group).toHaveAttribute("aria-label", "Maintenance KPI cards");

    // Check for region roles
    const regions = screen.getAllByRole("region");
    expect(regions.length).toBeGreaterThan(0);
  });

  it("renders with proper styling classes", () => {
    render(<MaintenanceOverview />);

    const mainCard = screen
      .getByText("Fleet Maintenance Overview")
      .closest('[class*="Card"]');
    expect(mainCard).toBeInTheDocument();
  });

  it("displays icons for different severity levels", () => {
    render(<MaintenanceOverview />);

    // Check for SVG icons by looking for elements with data-testid attributes
    const trendingIcon = screen.getByTestId("TrendingUpIcon");
    const checkIcon = screen.getByTestId("CheckCircleIcon");
    const errorIcon = screen.getByTestId("ErrorIcon");

    expect(trendingIcon).toBeInTheDocument();
    expect(checkIcon).toBeInTheDocument();
    expect(errorIcon).toBeInTheDocument();
  });
});
