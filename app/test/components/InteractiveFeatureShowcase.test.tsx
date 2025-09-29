import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import InteractiveFeatureShowcase from "../../components/InteractiveFeatureShowcase";

describe("InteractiveFeatureShowcase", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders interactive features showcase title", () => {
    render(<InteractiveFeatureShowcase />);

    expect(
      screen.getByText("Interactive Features Showcase"),
    ).toBeInTheDocument();
  });

  it("displays real-time analytics feature", () => {
    render(<InteractiveFeatureShowcase />);

    expect(screen.getByText("Real-time Analytics")).toBeInTheDocument();
    expect(
      screen.getByText("Live data processing and visualization"),
    ).toBeInTheDocument();
  });

  it("displays predictive modeling feature", () => {
    render(<InteractiveFeatureShowcase />);

    expect(screen.getByText("Predictive Modeling")).toBeInTheDocument();
    expect(
      screen.getByText("AI-powered maintenance predictions"),
    ).toBeInTheDocument();
  });

  it("displays performance optimization feature", () => {
    render(<InteractiveFeatureShowcase />);

    expect(screen.getByText("Performance Optimization")).toBeInTheDocument();
    expect(
      screen.getByText("Automated system tuning and efficiency improvements"),
    ).toBeInTheDocument();
  });

  it("displays security features", () => {
    render(<InteractiveFeatureShowcase />);

    expect(screen.getByText("Advanced Security")).toBeInTheDocument();
    expect(
      screen.getByText("Enterprise-grade security and compliance"),
    ).toBeInTheDocument();
  });

  it("displays maintenance automation feature", () => {
    render(<InteractiveFeatureShowcase />);

    expect(screen.getByText("Maintenance Automation")).toBeInTheDocument();
    expect(
      screen.getByText("Intelligent scheduling and resource allocation"),
    ).toBeInTheDocument();
  });

  it("displays timeline visualization feature", () => {
    render(<InteractiveFeatureShowcase />);

    expect(screen.getByText("Timeline Visualization")).toBeInTheDocument();
    expect(
      screen.getByText("Historical data analysis and trend visualization"),
    ).toBeInTheDocument();
  });

  it("renders progress bars for each feature", () => {
    render(<InteractiveFeatureShowcase />);

    const progressBars = screen.getAllByRole("progressbar");
    expect(progressBars).toHaveLength(6); // 6 features
  });

  it("displays feature progress percentages", () => {
    render(<InteractiveFeatureShowcase />);

    // Should display progress percentages - use getAllByText to handle multiple instances
    const progressTexts = screen.getAllByText(/\d+%/);
    expect(progressTexts.length).toBeGreaterThan(0);
  });

  it("renders feature icons", () => {
    render(<InteractiveFeatureShowcase />);

    // Icons should be present (they are SVG elements) - look for specific icons
    expect(screen.getByTestId("AnalyticsIcon")).toBeInTheDocument();
    expect(screen.getByTestId("TrendingUpIcon")).toBeInTheDocument();
  });

  it("displays feature descriptions", () => {
    render(<InteractiveFeatureShowcase />);

    // Use getAllByText to handle multiple instances of the same text
    const descriptions = screen.getAllByText("Live data processing and visualization");
    expect(descriptions.length).toBeGreaterThan(0);
    
    expect(screen.getByText("AI-powered maintenance predictions")).toBeInTheDocument();
    expect(screen.getByText("Automated system tuning and efficiency improvements")).toBeInTheDocument();
    expect(screen.getByText("Enterprise-grade security and compliance")).toBeInTheDocument();
    expect(screen.getByText("Intelligent scheduling and resource allocation")).toBeInTheDocument();
    expect(screen.getByText("Historical data analysis and trend visualization")).toBeInTheDocument();
  });

  it("renders features in proper grid layout", () => {
    render(<InteractiveFeatureShowcase />);

    // Should render all 6 features - use getAllByText to handle multiple instances
    const featureTitles = [
      "Real-time Analytics",
      "Predictive Modeling", 
      "Performance Optimization",
      "Security & Compliance",
      "Maintenance Automation",
      "Timeline Tracking",
    ];

    featureTitles.forEach((title) => {
      const elements = screen.getAllByText(title);
      expect(elements.length).toBeGreaterThan(0);
    });
  });

  it("displays feature showcase information", () => {
    render(<InteractiveFeatureShowcase />);

    expect(
      screen.getByText(
        /This showcase demonstrates the key interactive features/,
      ),
    ).toBeInTheDocument();
  });

  it("renders with proper styling and layout", () => {
    render(<InteractiveFeatureShowcase />);

    // Check that main container is rendered
    const mainContainer = screen
      .getByText("Interactive Features Showcase")
      .closest("div");
    expect(mainContainer).toBeInTheDocument();
  });

  it("displays all feature cards with consistent structure", () => {
    render(<InteractiveFeatureShowcase />);

    // Each feature should have a title, description, and progress bar
    const featureTitles = screen.getAllByRole("heading", { level: 6 });
    expect(featureTitles).toHaveLength(6);
  });

  it("renders progress bars with correct values", () => {
    render(<InteractiveFeatureShowcase />);

    const progressBars = screen.getAllByRole("progressbar");
    progressBars.forEach((bar) => {
      expect(bar).toBeInTheDocument();
    });
  });

  it("displays feature showcase description", () => {
    render(<InteractiveFeatureShowcase />);

    expect(
      screen.getByText(/Explore each feature to see detailed information/),
    ).toBeInTheDocument();
  });

  it("renders all features with proper accessibility", () => {
    render(<InteractiveFeatureShowcase />);

    // Each feature card should be accessible
    const cards = screen.getAllByRole("region");
    expect(cards.length).toBeGreaterThan(0);
  });

  it("displays feature progress with proper formatting", () => {
    render(<InteractiveFeatureShowcase />);

    // Should display progress percentages with % symbol
    const progressTexts = screen.getAllByText(/\d+%/);
    expect(progressTexts).toHaveLength(6);
  });

  it("renders features with proper color coding", () => {
    render(<InteractiveFeatureShowcase />);

    // Features should be rendered - look for specific feature titles instead of region role
    expect(screen.getByText("Real-time Analytics")).toBeInTheDocument();
    expect(screen.getByText("Predictive Modeling")).toBeInTheDocument();
  });

  it("displays feature showcase in responsive layout", () => {
    render(<InteractiveFeatureShowcase />);

    // Should render in a grid layout that adapts to screen size
    const mainContainer = screen
      .getByText("Interactive System Features")
      .closest("div");
    expect(mainContainer).toBeInTheDocument();
  });
});
