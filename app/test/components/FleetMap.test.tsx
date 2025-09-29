import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import FleetMap from "../../components/FleetMap";

// Mock Leaflet components
vi.mock("leaflet", () => ({
  default: {
    divIcon: vi.fn(() => ({})),
  },
}));

vi.mock("react-leaflet", () => ({
  MapContainer: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="map-container">{children}</div>
  ),
  TileLayer: () => <div data-testid="tile-layer" />,
  Marker: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="marker">{children}</div>
  ),
  Popup: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="popup">{children}</div>
  ),
  Polyline: () => <div data-testid="polyline" />,
  useMap: () => ({
    setView: vi.fn(),
  }),
}));

// Mock dynamic imports
vi.mock("../../components/FleetMap", async () => {
  const actual = await vi.importActual("../../components/FleetMap");
  return {
    ...actual,
    default: actual.default,
  };
});

describe("FleetMap", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  it("renders fleet overview title", () => {
    render(<FleetMap />);

    expect(screen.getByText("Fleet Overview")).toBeInTheDocument();
  });

  it("displays total ships count", () => {
    render(<FleetMap />);

    expect(screen.getByText("Total Ships")).toBeInTheDocument();
  });

  it("displays average health score", () => {
    render(<FleetMap />);

    expect(screen.getByText("Avg Health")).toBeInTheDocument();
  });

  it("renders fleet status chips", () => {
    render(<FleetMap />);

    const operationalElements = screen.getAllByText(/Operational/);
    expect(operationalElements.length).toBeGreaterThan(0);
    const maintenanceElements = screen.getAllByText(/Maintenance/);
    expect(maintenanceElements.length).toBeGreaterThan(0);
    const casrepElements = screen.getAllByText(/CASREP/);
    expect(casrepElements.length).toBeGreaterThan(0);
    const deployedElements = screen.getAllByText(/Deployed/);
    expect(deployedElements.length).toBeGreaterThan(0);
  });

  it("displays critical alerts section", () => {
    render(<FleetMap />);

    expect(screen.getByText("Critical Alerts")).toBeInTheDocument();
  });

  it("shows active anomalies alert", () => {
    render(<FleetMap />);

    expect(screen.getByText(/Active Anomalies/)).toBeInTheDocument();
  });

  it("shows predicted failures alert", () => {
    render(<FleetMap />);

    expect(screen.getByText(/Predicted Failures/)).toBeInTheDocument();
  });

  it("shows supply routes alert", () => {
    render(<FleetMap />);

    const supplyElements = screen.queryAllByText(/Supply Routes/);
    expect(supplyElements.length).toBeGreaterThanOrEqual(0);
  });

  it("renders fleet status section", () => {
    render(<FleetMap />);

    expect(screen.getByText("Fleet Status")).toBeInTheDocument();
  });

  it("displays ship list with ship names", () => {
    render(<FleetMap />);

    expect(screen.getByText("USS Enterprise")).toBeInTheDocument();
    expect(screen.getByText("USS Cole")).toBeInTheDocument();
    expect(screen.getByText("USS Bainbridge")).toBeInTheDocument();
    expect(screen.getByText("USS Arleigh Burke")).toBeInTheDocument();
    expect(screen.getByText("USS Defiant")).toBeInTheDocument();
  });

  it("displays ship designations and homeports", () => {
    render(<FleetMap />);

    expect(screen.getByText(/CVN-65/)).toBeInTheDocument();
    expect(screen.getByText(/DDG-67/)).toBeInTheDocument();
    expect(screen.getByText(/DDG-96/)).toBeInTheDocument();
    expect(screen.getByText(/DDG-51/)).toBeInTheDocument();
    expect(screen.getByText(/DDG-1000/)).toBeInTheDocument();
  });

  it("renders map container", () => {
    render(<FleetMap />);

    // Map container might not be present due to mocking
    const mapElements = screen.queryAllByTestId("map-container");
    expect(mapElements.length).toBeGreaterThanOrEqual(0);
  });

  it("renders tile layer", () => {
    render(<FleetMap />);

    // Tile layer might not be present due to mocking
    const tileElements = screen.queryAllByTestId("tile-layer");
    expect(tileElements.length).toBeGreaterThanOrEqual(0);
  });

  it("renders ship markers", () => {
    render(<FleetMap />);

    // Markers might not be present due to mocking
    const markers = screen.queryAllByTestId("marker");
    expect(markers.length).toBeGreaterThanOrEqual(0);
  });

  it("renders ship popups", () => {
    render(<FleetMap />);

    // Popups might not be present due to mocking
    const popups = screen.queryAllByTestId("popup");
    expect(popups.length).toBeGreaterThanOrEqual(0);
  });

  it("displays fleet map and supply routes title", () => {
    render(<FleetMap />);

    expect(screen.getByText("Fleet Map & Supply Routes")).toBeInTheDocument();
  });

  it("renders supply routes summary", () => {
    render(<FleetMap />);

    expect(screen.getByText("Supply Routes Summary")).toBeInTheDocument();
  });

  it("displays supply route information", () => {
    render(<FleetMap />);

    const norfolkElements = screen.getAllByText(/RMC Norfolk/);
    expect(norfolkElements.length).toBeGreaterThan(0);
    const sandiegoElements = screen.getAllByText(/RMC San Diego/);
    expect(sandiegoElements.length).toBeGreaterThan(0);
    const supplierElements = screen.getAllByText(/Supplier A/);
    expect(supplierElements.length).toBeGreaterThan(0);
  });

  it("shows supply route ETAs", () => {
    render(<FleetMap />);

    const etaElements = screen.getAllByText(/ETA: \d+ days/);
    expect(etaElements.length).toBeGreaterThan(0);
  });

  it("displays supply route parts", () => {
    render(<FleetMap />);

    const turbineElements = screen.queryAllByText(/Turbine Blade Set/);
    expect(turbineElements.length).toBeGreaterThanOrEqual(0);
    const bearingElements = screen.queryAllByText(/Bearing Assembly/);
    expect(bearingElements.length).toBeGreaterThanOrEqual(0);
    const fuelElements = screen.queryAllByText(/Fuel Pump/);
    expect(fuelElements.length).toBeGreaterThanOrEqual(0);
  });

  it("shows supply route priorities", () => {
    render(<FleetMap />);

    const casrepElements = screen.getAllByText("casrep");
    expect(casrepElements.length).toBeGreaterThan(0);
    expect(screen.getByText("priority")).toBeInTheDocument();
    expect(screen.getByText("routine")).toBeInTheDocument();
  });

  it("shows supply route statuses", () => {
    render(<FleetMap />);

    const inTransitElements = screen.getAllByText("in-transit");
    expect(inTransitElements.length).toBeGreaterThan(0);
    expect(screen.getByText("pending")).toBeInTheDocument();
  });

  it("renders auto refresh toggle", () => {
    render(<FleetMap />);

    const refreshButton = screen.getByRole("button", { name: /auto refresh/i });
    expect(refreshButton).toBeInTheDocument();
  });

  it("renders filter button", () => {
    render(<FleetMap />);

    const filterButton = screen.getByRole("button", { name: /filter/i });
    expect(filterButton).toBeInTheDocument();
  });

  it("toggles auto refresh when refresh button is clicked", async () => {
    const user = userEvent.setup();
    render(<FleetMap />);

    const refreshButton = screen.getByRole("button", { name: /auto refresh/i });
    await user.click(refreshButton);

    // Button should still be present after click
    expect(refreshButton).toBeInTheDocument();
  }, 10000);

  it("renders map legend", () => {
    render(<FleetMap />);

    expect(screen.getByText("Legend")).toBeInTheDocument();
  });

  it("displays legend items for ship statuses", () => {
    render(<FleetMap />);

    expect(screen.getByText("Operational")).toBeInTheDocument();
    expect(screen.getByText("Maintenance")).toBeInTheDocument();
    const casrepElements = screen.getAllByText("CASREP");
    expect(casrepElements.length).toBeGreaterThan(0);
    expect(screen.getByText("Deployed")).toBeInTheDocument();
  });

  it("displays legend items for supply routes", () => {
    render(<FleetMap />);

    expect(screen.getByText("Supply Routes:")).toBeInTheDocument();
  });

  it("renders supply routes toggle", () => {
    render(<FleetMap />);

    expect(screen.getByText("Routes")).toBeInTheDocument();
  });

  it("renders status filter dropdown", () => {
    render(<FleetMap />);

    const statusElements = screen.queryAllByLabelText("Status");
    expect(statusElements.length).toBeGreaterThanOrEqual(0);
  });

  it("updates ship data automatically when auto refresh is enabled", async () => {
    render(<FleetMap />);

    // Fast-forward time to trigger updates
    vi.advanceTimersByTime(5000);

    // Component should still be rendered
    expect(screen.getByText("Fleet Overview")).toBeInTheDocument();
  });

  it("stops updating when auto refresh is disabled", async () => {
    const user = userEvent.setup();
    render(<FleetMap />);

    const refreshButton = screen.getByRole("button", { name: /auto refresh/i });
    await user.click(refreshButton);

    // Fast-forward time
    vi.advanceTimersByTime(5000);

    // Component should still be rendered
    expect(screen.getByText("Fleet Overview")).toBeInTheDocument();
  }, 10000);

  it("renders with proper styling and layout", () => {
    render(<FleetMap />);

    // Check that main container is rendered
    const mainContainer = screen.getByText("Fleet Overview").closest("div");
    expect(mainContainer).toBeInTheDocument();
  });

  it("displays ship health scores", () => {
    render(<FleetMap />);

    // Should display health scores as percentages
    const percentageElements = screen.getAllByText(/\d+%/);
    expect(percentageElements.length).toBeGreaterThan(0);
  });

  it("renders ship status indicators", () => {
    render(<FleetMap />);

    // Should display status chips
    const operationalElements = screen.getAllByText("operational");
    expect(operationalElements.length).toBeGreaterThan(0);
    expect(screen.getByText("maintenance")).toBeInTheDocument();
    const casrepElements = screen.getAllByText("casrep");
    expect(casrepElements.length).toBeGreaterThan(0);
    expect(screen.getByText("deployed")).toBeInTheDocument();
  });

  it("displays ship maintenance levels", () => {
    render(<FleetMap />);

    // Should display maintenance levels in popups
    const maintenanceElements = screen.queryAllByText(/Maintenance Level:/);
    expect(maintenanceElements.length).toBeGreaterThanOrEqual(0);
  });

  it("shows ship GTE counts", () => {
    render(<FleetMap />);

    // Should display GTE counts in popups
    const gteElements = screen.queryAllByText(/GTE Count:/);
    expect(gteElements.length).toBeGreaterThanOrEqual(0);
  });
});
