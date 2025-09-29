import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {
  useErrorHandler,
  useLoadingHandler,
  ErrorSnackbar,
  LoadingBackdrop,
  ErrorBoundary,
} from "../../components/ErrorHandling";

// Mock react-router
const mockNavigate = vi.fn();
vi.mock("react-router", async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

// Test component that uses the error handler
const TestErrorComponent = () => {
  const { error, showError, clearError } = useErrorHandler();

  return (
    <div>
      <button onClick={() => showError("Test error", "error")}>
        Show Error
      </button>
      <button onClick={() => showError("Test warning", "warning")}>
        Show Warning
      </button>
      <button onClick={() => showError("Test success", "success")}>
        Show Success
      </button>
      <button onClick={() => showError("Test info", "info")}>Show Info</button>
      <button onClick={clearError}>Clear Error</button>
      <ErrorSnackbar error={error} onClose={clearError} />
    </div>
  );
};

// Test component that uses the loading handler
const TestLoadingComponent = () => {
  const { loading, setLoadingState } = useLoadingHandler();

  return (
    <div>
      <button onClick={() => setLoadingState(true, "Loading...")}>
        Start Loading
      </button>
      <button onClick={() => setLoadingState(false)}>Stop Loading</button>
      <LoadingBackdrop loading={loading} />
    </div>
  );
};

// Test component that throws an error
const ThrowErrorComponent = ({ shouldThrow }: { shouldThrow: boolean }) => {
  if (shouldThrow) {
    throw new Error("Test error");
  }
  return <div>No error</div>;
};

describe("ErrorHandling", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("useErrorHandler", () => {
    it("initializes with no error", () => {
      render(<TestErrorComponent />);

      expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    });

    it("shows error message when showError is called", async () => {
      const user = userEvent.setup();
      render(<TestErrorComponent />);

      const showErrorButton = screen.getByText("Show Error");
      await user.click(showErrorButton);

      expect(screen.getByRole("alert")).toBeInTheDocument();
      expect(screen.getByText("Test error")).toBeInTheDocument();
    });

    it("shows different severity levels", async () => {
      const user = userEvent.setup();
      render(<TestErrorComponent />);

      // Test warning
      const showWarningButton = screen.getByText("Show Warning");
      await user.click(showWarningButton);

      expect(screen.getByText("Test warning")).toBeInTheDocument();

      // Test success
      const showSuccessButton = screen.getByText("Show Success");
      await user.click(showSuccessButton);

      // Wait for the success message to appear
      await waitFor(
        () => {
          const successMessage = screen.queryByText("Test success");
          expect(successMessage).toBeInTheDocument();
        },
        { timeout: 1000 },
      );

      // Test info
      const showInfoButton = screen.getByText("Show Info");
      await user.click(showInfoButton);

      expect(screen.getByText("Test info")).toBeInTheDocument();
    });

    it("clears error when clearError is called", async () => {
      const user = userEvent.setup();
      render(<TestErrorComponent />);

      // Show error first
      const showErrorButton = screen.getByText("Show Error");
      await user.click(showErrorButton);

      expect(screen.getByRole("alert")).toBeInTheDocument();

      // Clear error
      const clearErrorButton = screen.getByText("Clear Error");
      await user.click(clearErrorButton);

      await waitFor(() => {
        expect(screen.queryByRole("alert")).not.toBeInTheDocument();
      });
    });

    it("auto-hides error after 6 seconds", async () => {
      vi.useFakeTimers();
      try {
        const user = userEvent.setup();
        render(<TestErrorComponent />);

        const showErrorButton = screen.getByText("Show Error");
        await user.click(showErrorButton);

        expect(screen.getByRole("alert")).toBeInTheDocument();

        // Fast-forward time
        vi.advanceTimersByTime(6000);

        // Wait for the error to disappear
        await waitFor(
          () => {
            expect(screen.queryByRole("alert")).not.toBeInTheDocument();
          },
          { timeout: 1000 },
        );
      } finally {
        vi.useRealTimers();
      }
    });
  });

  describe("useLoadingHandler", () => {
    it("initializes with no loading state", () => {
      render(<TestLoadingComponent />);

      expect(
        screen.queryByRole("progressbar", { hidden: true }),
      ).not.toBeInTheDocument();
    });

    it("shows loading backdrop when loading is true", async () => {
      const user = userEvent.setup();
      render(<TestLoadingComponent />);

      const startLoadingButton = screen.getByText("Start Loading");
      await user.click(startLoadingButton);

      await waitFor(
        () => {
          expect(screen.getByRole("progressbar")).toBeInTheDocument();
        },
        { timeout: 1000 },
      );

      expect(screen.getByText("Loading...")).toBeInTheDocument();
    });

    it("hides loading backdrop when loading is false", async () => {
      const user = userEvent.setup();
      render(<TestLoadingComponent />);

      // Start loading
      const startLoadingButton = screen.getByText("Start Loading");
      await user.click(startLoadingButton);

      await waitFor(
        () => {
          expect(screen.getByRole("progressbar")).toBeInTheDocument();
        },
        { timeout: 1000 },
      );

      // Stop loading
      const stopLoadingButton = screen.getByText("Stop Loading");
      await user.click(stopLoadingButton);

      await waitFor(
        () => {
          expect(
            screen.queryByRole("progressbar", { hidden: true }),
          ).not.toBeInTheDocument();
        },
        { timeout: 1000 },
      );
    });

    it("shows custom loading message", async () => {
      const user = userEvent.setup();
      render(<TestLoadingComponent />);

      const startLoadingButton = screen.getByText("Start Loading");
      await user.click(startLoadingButton);

      await waitFor(
        () => {
          expect(screen.getByText("Loading...")).toBeInTheDocument();
        },
        { timeout: 1000 },
      );
    });
  });

  describe("ErrorBoundary", () => {
    it("renders children when there is no error", () => {
      render(
        <ErrorBoundary>
          <ThrowErrorComponent shouldThrow={false} />
        </ErrorBoundary>,
      );

      expect(screen.getByText("No error")).toBeInTheDocument();
    });

    it("renders error UI when child component throws", () => {
      // Suppress console.error for this test
      const consoleSpy = vi
        .spyOn(console, "error")
        .mockImplementation(() => {});

      render(
        <ErrorBoundary>
          <ThrowErrorComponent shouldThrow={true} />
        </ErrorBoundary>,
      );

      expect(screen.getByText("Something went wrong")).toBeInTheDocument();
      expect(
        screen.getByText("We're sorry, but something unexpected happened."),
      ).toBeInTheDocument();
      expect(screen.getByText("Try again")).toBeInTheDocument();

      consoleSpy.mockRestore();
    });

    it("allows recovery from error", async () => {
      const user = userEvent.setup();
      const consoleSpy = vi
        .spyOn(console, "error")
        .mockImplementation(() => {});

      const { rerender } = render(
        <ErrorBoundary>
          <ThrowErrorComponent shouldThrow={true} />
        </ErrorBoundary>,
      );

      expect(screen.getByText("Something went wrong")).toBeInTheDocument();

      // Click try again button
      const tryAgainButton = screen.getByText("Try again");
      await user.click(tryAgainButton);

      // Re-render with no error
      rerender(
        <ErrorBoundary>
          <ThrowErrorComponent shouldThrow={false} />
        </ErrorBoundary>,
      );

      await waitFor(
        () => {
          expect(screen.getByText("No error")).toBeInTheDocument();
        },
        { timeout: 1000 },
      );

      consoleSpy.mockRestore();
    });
  });

  describe("ErrorSnackbar", () => {
    it("renders when error is provided", () => {
      const error = { message: "Test error", severity: "error" as const };
      render(<ErrorSnackbar error={error} onClose={vi.fn()} />);

      expect(screen.getByRole("alert")).toBeInTheDocument();
      expect(screen.getByText("Test error")).toBeInTheDocument();
    });

    it("does not render when error is null", () => {
      render(<ErrorSnackbar error={null} onClose={vi.fn()} />);

      expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    });

    it("calls onClose when close button is clicked", async () => {
      const user = userEvent.setup();
      const mockOnClose = vi.fn();
      const error = { message: "Test error", severity: "error" as const };

      render(<ErrorSnackbar error={error} onClose={mockOnClose} />);

      const closeButton = screen.getByRole("button");
      await user.click(closeButton);

      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });
  });

  describe("LoadingBackdrop", () => {
    it("renders when loading is true", () => {
      const loading = { isLoading: true, message: "Loading..." };
      render(<LoadingBackdrop loading={loading} />);

      expect(
        screen.getByRole("progressbar", { hidden: true }),
      ).toBeInTheDocument();
      expect(screen.getByText("Loading...")).toBeInTheDocument();
    });

    it("does not render when loading is false", () => {
      const loading = { isLoading: false };
      render(<LoadingBackdrop loading={loading} />);

      expect(
        screen.queryByRole("progressbar", { hidden: true }),
      ).not.toBeInTheDocument();
    });

    it("renders without message when message is not provided", () => {
      const loading = { isLoading: true };
      render(<LoadingBackdrop loading={loading} />);

      expect(
        screen.getByRole("progressbar", { hidden: true }),
      ).toBeInTheDocument();
      expect(screen.queryByText("Loading...")).not.toBeInTheDocument();
    });
  });
});
