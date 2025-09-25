import React from "react";
import { Alert, Snackbar, CircularProgress, Backdrop } from "@mui/material";
import { useState, useEffect } from "react";

interface ErrorState {
  message: string;
  severity: "error" | "warning" | "info" | "success";
}

interface LoadingState {
  isLoading: boolean;
  message?: string;
}

export const useErrorHandler = () => {
  const [error, setError] = useState<ErrorState | null>(null);

  const showError = (
    message: string,
    severity: ErrorState["severity"] = "error",
  ) => {
    setError({ message, severity });
  };

  const clearError = () => {
    setError(null);
  };

  return { error, showError, clearError };
};

export const useLoadingHandler = () => {
  const [loading, setLoading] = useState<LoadingState>({ isLoading: false });

  const setLoadingState = (isLoading: boolean, message?: string) => {
    setLoading({ isLoading, message });
  };

  return { loading, setLoadingState };
};

export const ErrorSnackbar = ({
  error,
  onClose,
}: {
  error: ErrorState | null;
  onClose: () => void;
}) => {
  return (
    <Snackbar
      open={!!error}
      autoHideDuration={6000}
      onClose={onClose}
      anchorOrigin={{ vertical: "top", horizontal: "right" }}
    >
      <Alert
        onClose={onClose}
        severity={error?.severity}
        sx={{ width: "100%" }}
      >
        {error?.message}
      </Alert>
    </Snackbar>
  );
};

export const LoadingBackdrop = ({ loading }: { loading: LoadingState }) => {
  return (
    <Backdrop
      sx={{ color: "#fff", zIndex: (theme) => theme.zIndex.drawer + 1 }}
      open={loading.isLoading}
    >
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 16,
        }}
      >
        <CircularProgress color="inherit" />
        {loading.message && (
          <div style={{ color: "white", fontSize: "1.1rem" }}>
            {loading.message}
          </div>
        )}
      </div>
    </Backdrop>
  );
};

// Error Boundary Component
export class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error?: Error }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("Error caught by boundary:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: "2rem", textAlign: "center" }}>
          <h2>Something went wrong</h2>
          <p>We&apos;re sorry, but something unexpected happened.</p>
          <button onClick={() => this.setState({ hasError: false })}>
            Try again
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
