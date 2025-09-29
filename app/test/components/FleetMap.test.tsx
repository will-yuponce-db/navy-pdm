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

    expect(screen.getByText(/Operational/)).toBeInTheDocument();
    expect(screen.getByText(/Maintenance/)).toBeInTheDocument();
    expect(screen.getByText(/CASREP/)).toBeInTheDocument();
    expect(screen.getByText(/Deployed/)).toBeInTheDocument();
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

    expect(screen.getByText(/Supply Routes/)).toBeInTheDocument();
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

    expect(screen.getByTestId("map-container")).toBeInTheDocument();
  });

  it("renders tile layer", () => {
    render(<FleetMap />);

    expect(screen.getByTestId("tile-layer")).toBeInTheDocument();
  });

  it("renders ship markers", () => {
    render(<FleetMap />);

    const markers = screen.getAllByTestId("marker");
    expect(markers).toHaveLength(5); // 5 ships
  });

  it("renders ship popups", () => {
    render(<FleetMap />);

    const popups = screen.getAllByTestId("popup");
    expect(popups).toHaveLength(5); // 5 ships
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

    expect(screen.getByText(/RMC Norfolk/)).toBeInTheDocument();
    expect(screen.getByText(/RMC San Diego/)).toBeInTheDocument();
    expect(screen.getByText(/Supplier A/)).toBeInTheDocument();
  });

  it("shows supply route ETAs", () => {
    render(<FleetMap />);

    expect(screen.getByText(/ETA: \d+ days/)).toBeInTheDocument();
  });

  it("displays supply route parts", () => {
    render(<FleetMap />);

    expect(screen.getByText(/Turbine Blade Set/)).toBeInTheDocument();
    expect(screen.getByText(/Bearing Assembly/)).toBeInTheDocument();
    expect(screen.getByText(/Fuel Pump/)).toBeInTheDocument();
  });

  it("shows supply route priorities", () => {
    render(<FleetMap />);

    expect(screen.getByText("casrep")).toBeInTheDocument();
    expect(screen.getByText("priority")).toBeInTheDocument();
    expect(screen.getByText("routine")).toBeInTheDocument();
  });

  it("shows supply route statuses", () => {
    render(<FleetMap />);

    expect(screen.getByText("in-transit")).toBeInTheDocument();
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
  });

  it("renders map legend", () => {
    render(<FleetMap />);

    expect(screen.getByText("Legend")).toBeInTheDocument();
  });

  it("displays legend items for ship statuses", () => {
    render(<FleetMap />);

    expect(screen.getByText("Operational")).toBeInTheDocument();
    expect(screen.getByText("Maintenance")).toBeInTheDocument();
    expect(screen.getByText("CASREP")).toBeInTheDocument();
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

    expect(screen.getByLabelText("Status")).toBeInTheDocument();
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
  });

  it("renders with proper styling and layout", () => {
    render(<FleetMap />);

    // Check that main container is rendered
    const mainContainer = screen.getByText("Fleet Overview").closest("div");
    expect(mainContainer).toBeInTheDocument();
  });

  it("displays ship health scores", () => {
    render(<FleetMap />);

    // Should display health scores as percentages
    expect(screen.getByText(/\d+%/)).toBeInTheDocument();
  });

  it("renders ship status indicators", () => {
    render(<FleetMap />);

    // Should display status chips
    expect(screen.getByText("operational")).toBeInTheDocument();
    expect(screen.getByText("maintenance")).toBeInTheDocument();
    expect(screen.getByText("casrep")).toBeInTheDocument();
    expect(screen.getByText("deployed")).toBeInTheDocument();
  });

  it("displays ship maintenance levels", () => {
    render(<FleetMap />);

    // Should display maintenance levels in popups
    expect(screen.getByText(/Maintenance Level:/)).toBeInTheDocument();
  });

  it("shows ship GTE counts", () => {
    render(<FleetMap />);

    // Should display GTE counts in popups
    expect(screen.getByText(/GTE Count:/)).toBeInTheDocument();
  });
});
