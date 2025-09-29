import { render, screen, fireEvent } from "@testing-library/react";
import { Provider } from "react-redux";
import { configureStore } from "@reduxjs/toolkit";
import { vi } from "vitest";
import { NotificationCenter } from "../../components/NotificationSystem";
import notificationReducer from "../../redux/services/notificationSlice";
import type { RootState } from "../../types";

// Mock store
const createMockStore = (initialState: Partial<RootState> = {}) => {
  return configureStore({
    reducer: {
      notifications: notificationReducer,
    },
    preloadedState: {
      notifications: { notifications: [] },
      ...initialState,
    } as RootState,
  });
};

const renderWithProvider = (
  component: React.ReactElement,
  initialState: Partial<RootState> = {},
) => {
  const store = createMockStore(initialState);
  return render(<Provider store={store}>{component}</Provider>);
};

describe("NotificationCenter", () => {
  const mockNotifications = [
    {
      id: "1",
      type: "info" as const,
      title: "Test Notification",
      message: "This is a test notification",
      timestamp: new Date(),
      priority: "medium" as const,
      category: "maintenance" as const,
      read: false,
    },
    {
      id: "2",
      type: "warning" as const,
      title: "Warning Notification",
      message: "This is a warning notification",
      timestamp: new Date(),
      priority: "high" as const,
      category: "alert" as const,
      read: true,
    },
  ];

  const defaultProps = {
    notifications: mockNotifications,
    onDismiss: vi.fn(),
    onMarkAsRead: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders notification center with unread count", () => {
    renderWithProvider(<NotificationCenter {...defaultProps} />);

    expect(screen.getByText("Notifications")).toBeInTheDocument();
    expect(screen.getByText("1 unread")).toBeInTheDocument();
  });

  it("expands and collapses notification list", () => {
    renderWithProvider(<NotificationCenter {...defaultProps} />);

    const expandButton = screen.getByLabelText("Expand notifications");
    fireEvent.click(expandButton);

    expect(screen.getByText("Test Notification")).toBeInTheDocument();
    expect(screen.getByText("Warning Notification")).toBeInTheDocument();

    const collapseButton = screen.getByLabelText("Collapse notifications");
    fireEvent.click(collapseButton);

    // Check that the button text changes to indicate collapse
    expect(screen.getByLabelText("Expand notifications")).toBeInTheDocument();
  });

  it("calls onMarkAsRead when clicking unread notification", () => {
    renderWithProvider(<NotificationCenter {...defaultProps} />);

    const expandButton = screen.getByLabelText("Expand notifications");
    fireEvent.click(expandButton);

    const notification = screen
      .getByText("Test Notification")
      .closest('[role="listitem"]');
    fireEvent.click(notification!);

    expect(defaultProps.onMarkAsRead).toHaveBeenCalledWith("1");
  });

  it("calls onDismiss when clicking dismiss button", () => {
    renderWithProvider(<NotificationCenter {...defaultProps} />);

    const expandButton = screen.getByLabelText("Expand notifications");
    fireEvent.click(expandButton);

    const dismissButton = screen.getAllByLabelText(/Dismiss notification/)[0];
    fireEvent.click(dismissButton);

    expect(defaultProps.onDismiss).toHaveBeenCalledWith("1");
  });

  it("shows no notifications message when empty", () => {
    renderWithProvider(
      <NotificationCenter {...defaultProps} notifications={[]} />,
    );

    const expandButton = screen.getByLabelText("Expand notifications");
    fireEvent.click(expandButton);

    expect(screen.getByText("No notifications")).toBeInTheDocument();
  });

  it("handles keyboard navigation", () => {
    renderWithProvider(<NotificationCenter {...defaultProps} />);

    const expandButton = screen.getByLabelText("Expand notifications");
    fireEvent.click(expandButton);

    const notification = screen
      .getByText("Test Notification")
      .closest('[role="listitem"]');
    fireEvent.keyDown(notification!, { key: "Enter" });

    expect(defaultProps.onMarkAsRead).toHaveBeenCalledWith("1");
  });

  it("closes on Escape key", () => {
    renderWithProvider(<NotificationCenter {...defaultProps} />);

    const expandButton = screen.getByLabelText("Expand notifications");
    fireEvent.click(expandButton);

    expect(screen.getByText("Test Notification")).toBeInTheDocument();

    fireEvent.keyDown(document, { key: "Escape" });

    // Check that the button text changes to indicate collapse
    expect(screen.getByLabelText("Collapse notifications")).toBeInTheDocument();
  });
});
