import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import MobileOptimization from "../../components/MobileOptimization";

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(), // deprecated
    removeListener: vi.fn(), // deprecated
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

describe("MobileOptimization", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders mobile optimization component", () => {
    render(<MobileOptimization />);

    expect(screen.getByText("Mobile Optimization")).toBeInTheDocument();
  });

  it("displays responsive design features", () => {
    render(<MobileOptimization />);

    expect(screen.getByText("Responsive Design")).toBeInTheDocument();
    expect(screen.getByText("Touch-Friendly Interface")).toBeInTheDocument();
    expect(screen.getByText("Offline Capability")).toBeInTheDocument();
  });

  it("shows mobile performance metrics", () => {
    render(<MobileOptimization />);

    expect(screen.getByText(/Performance Score/)).toBeInTheDocument();
    expect(screen.getByText(/Load Time/)).toBeInTheDocument();
    expect(screen.getByText(/Bundle Size/)).toBeInTheDocument();
  });

  it("displays PWA features", () => {
    render(<MobileOptimization />);

    expect(screen.getByText("Progressive Web App")).toBeInTheDocument();
    expect(screen.getByText("Install Prompt")).toBeInTheDocument();
    expect(screen.getByText("Service Worker")).toBeInTheDocument();
  });

  it("shows mobile-specific optimizations", () => {
    render(<MobileOptimization />);

    expect(screen.getByText("Mobile Optimizations")).toBeInTheDocument();
    expect(screen.getByText("Image Optimization")).toBeInTheDocument();
    expect(screen.getByText("Lazy Loading")).toBeInTheDocument();
  });

  it("displays accessibility features", () => {
    render(<MobileOptimization />);

    expect(screen.getByText("Accessibility")).toBeInTheDocument();
    expect(screen.getByText("Screen Reader Support")).toBeInTheDocument();
    expect(screen.getByText("Voice Navigation")).toBeInTheDocument();
  });

  it("shows mobile testing results", () => {
    render(<MobileOptimization />);

    expect(screen.getByText("Mobile Testing")).toBeInTheDocument();
    expect(screen.getByText("Device Compatibility")).toBeInTheDocument();
    expect(screen.getByText("Performance Testing")).toBeInTheDocument();
  });

  it("displays optimization recommendations", () => {
    render(<MobileOptimization />);

    expect(screen.getByText("Optimization Recommendations")).toBeInTheDocument();
  });

  it("shows mobile analytics", () => {
    render(<MobileOptimization />);

    expect(screen.getByText("Mobile Analytics")).toBeInTheDocument();
    expect(screen.getByText("User Engagement")).toBeInTheDocument();
    expect(screen.getByText("Performance Metrics")).toBeInTheDocument();
  });

  it("renders with proper mobile layout", () => {
    render(<MobileOptimization />);

    const container = screen.getByText("Mobile Optimization").closest("div");
    expect(container).toBeInTheDocument();
  });

  it("displays mobile-specific navigation", () => {
    render(<MobileOptimization />);

    expect(screen.getByText("Mobile Navigation")).toBeInTheDocument();
    expect(screen.getByText("Swipe Gestures")).toBeInTheDocument();
    expect(screen.getByText("Bottom Navigation")).toBeInTheDocument();
  });

  it("shows mobile security features", () => {
    render(<MobileOptimization />);

    expect(screen.getByText("Mobile Security")).toBeInTheDocument();
    expect(screen.getByText("Biometric Authentication")).toBeInTheDocument();
    expect(screen.getByText("Secure Storage")).toBeInTheDocument();
  });

  it("displays mobile performance charts", () => {
    render(<MobileOptimization />);

    // Check for chart containers or performance indicators
    const performanceElements = screen.getAllByText(/Performance/);
    expect(performanceElements.length).toBeGreaterThan(0);
  });

  it("shows mobile optimization status", () => {
    render(<MobileOptimization />);

    expect(screen.getByText("Optimization Status")).toBeInTheDocument();
  });

  it("displays mobile compatibility matrix", () => {
    render(<MobileOptimization />);

    expect(screen.getByText("Device Compatibility")).toBeInTheDocument();
    expect(screen.getByText("iOS")).toBeInTheDocument();
    expect(screen.getByText("Android")).toBeInTheDocument();
  });

  it("renders mobile optimization tips", () => {
    render(<MobileOptimization />);

    expect(screen.getByText("Optimization Tips")).toBeInTheDocument();
  });

  it("shows mobile user experience metrics", () => {
    render(<MobileOptimization />);

    expect(screen.getByText("User Experience")).toBeInTheDocument();
    expect(screen.getByText("Touch Response Time")).toBeInTheDocument();
    expect(screen.getByText("Gesture Recognition")).toBeInTheDocument();
  });

  it("displays mobile network optimization", () => {
    render(<MobileOptimization />);

    expect(screen.getByText("Network Optimization")).toBeInTheDocument();
    expect(screen.getByText("Data Compression")).toBeInTheDocument();
    expect(screen.getByText("Caching Strategy")).toBeInTheDocument();
  });

  it("shows mobile battery optimization", () => {
    render(<MobileOptimization />);

    expect(screen.getByText("Battery Optimization")).toBeInTheDocument();
    expect(screen.getByText("Background Processing")).toBeInTheDocument();
    expect(screen.getByText("Power Management")).toBeInTheDocument();
  });
});
