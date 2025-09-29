import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { Provider } from "react-redux";
import { configureStore } from "@reduxjs/toolkit";
import Authentication from "../../components/Authentication";
import { authSlice } from "../../redux/services/authSlice";

// Mock store
const createTestStore = () => {
  return configureStore({
    reducer: {
      auth: authSlice.reducer,
    },
    preloadedState: {
      auth: {
        isAuthenticated: false,
        user: null,
        loading: false,
        error: null,
      },
    },
  });
};

const renderWithProviders = (component: React.ReactElement, store = createTestStore()) => {
  return render(<Provider store={store}>{component}</Provider>);
};

describe("Authentication", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders login form when not authenticated", () => {
    renderWithProviders(<Authentication />);

    expect(screen.getByText("Navy PdM Login")).toBeInTheDocument();
    expect(screen.getByLabelText("Username")).toBeInTheDocument();
    expect(screen.getByLabelText("Password")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Sign In" })).toBeInTheDocument();
  });

  it("displays welcome message when authenticated", () => {
    const store = configureStore({
      reducer: {
        auth: authSlice.reducer,
      },
      preloadedState: {
        auth: {
          isAuthenticated: true,
          user: { id: "1", username: "testuser", role: "admin" },
          loading: false,
          error: null,
        },
      },
    });

    renderWithProviders(<Authentication />, store);

    expect(screen.getByText("Welcome, testuser")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Sign Out" })).toBeInTheDocument();
  });

  it("handles form submission", async () => {
    renderWithProviders(<Authentication />);

    const usernameInput = screen.getByLabelText("Username");
    const passwordInput = screen.getByLabelText("Password");
    const submitButton = screen.getByRole("button", { name: "Sign In" });

    fireEvent.change(usernameInput, { target: { value: "testuser" } });
    fireEvent.change(passwordInput, { target: { value: "password123" } });
    fireEvent.click(submitButton);

    // Should show loading state
    expect(screen.getByText("Signing in...")).toBeInTheDocument();
  });

  it("displays error message on authentication failure", () => {
    const store = configureStore({
      reducer: {
        auth: authSlice.reducer,
      },
      preloadedState: {
        auth: {
          isAuthenticated: false,
          user: null,
          loading: false,
          error: "Invalid credentials",
        },
      },
    });

    renderWithProviders(<Authentication />, store);

    expect(screen.getByText("Invalid credentials")).toBeInTheDocument();
  });

  it("handles sign out", async () => {
    const store = configureStore({
      reducer: {
        auth: authSlice.reducer,
      },
      preloadedState: {
        auth: {
          isAuthenticated: true,
          user: { id: "1", username: "testuser", role: "admin" },
          loading: false,
          error: null,
        },
      },
    });

    renderWithProviders(<Authentication />, store);

    const signOutButton = screen.getByRole("button", { name: "Sign Out" });
    fireEvent.click(signOutButton);

    await waitFor(() => {
      expect(screen.getByText("Navy PdM Login")).toBeInTheDocument();
    });
  });

  it("validates required fields", async () => {
    renderWithProviders(<Authentication />);

    const submitButton = screen.getByRole("button", { name: "Sign In" });
    fireEvent.click(submitButton);

    expect(screen.getByText("Username is required")).toBeInTheDocument();
    expect(screen.getByText("Password is required")).toBeInTheDocument();
  });

  it("shows loading state during authentication", () => {
    const store = configureStore({
      reducer: {
        auth: authSlice.reducer,
      },
      preloadedState: {
        auth: {
          isAuthenticated: false,
          user: null,
          loading: true,
          error: null,
        },
      },
    });

    renderWithProviders(<Authentication />, store);

    expect(screen.getByText("Signing in...")).toBeInTheDocument();
  });

  it("displays user role when authenticated", () => {
    const store = configureStore({
      reducer: {
        auth: authSlice.reducer,
      },
      preloadedState: {
        auth: {
          isAuthenticated: true,
          user: { id: "1", username: "admin", role: "admin" },
          loading: false,
          error: null,
        },
      },
    });

    renderWithProviders(<Authentication />, store);

    expect(screen.getByText("Role: admin")).toBeInTheDocument();
  });

  it("handles keyboard navigation", () => {
    renderWithProviders(<Authentication />);

    const usernameInput = screen.getByLabelText("Username");
    const passwordInput = screen.getByLabelText("Password");

    // Tab navigation
    usernameInput.focus();
    expect(document.activeElement).toBe(usernameInput);

    fireEvent.keyDown(usernameInput, { key: "Tab" });
    expect(document.activeElement).toBe(passwordInput);
  });

  it("submits form on Enter key press", async () => {
    renderWithProviders(<Authentication />);

    const usernameInput = screen.getByLabelText("Username");
    const passwordInput = screen.getByLabelText("Password");

    fireEvent.change(usernameInput, { target: { value: "testuser" } });
    fireEvent.change(passwordInput, { target: { value: "password123" } });

    fireEvent.keyDown(passwordInput, { key: "Enter" });

    expect(screen.getByText("Signing in...")).toBeInTheDocument();
  });
});
