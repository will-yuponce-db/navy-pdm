import React, { Component } from "react";
import type { ErrorInfo, ReactNode } from "react";
import {
  Box,
  Button,
  Card,
  CardContent,
  Typography,
  Alert,
  Collapse,
  Stack,
} from "@mui/material";
import {
  Error as ErrorIcon,
  Refresh,
  ExpandMore,
  ExpandLess,
  BugReport,
  Home,
} from "@mui/icons-material";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  expanded: boolean;
}

export class EnhancedErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      expanded: false,
    };
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
      errorInfo: null,
      expanded: false,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({
      error,
      errorInfo,
    });

    // Log error to monitoring service
    this.props.onError?.(error, errorInfo);
    
    // Log to console in development
    if (process.env.NODE_ENV === "development") {
      console.error("Error caught by boundary:", error, errorInfo);
    }
  }

  handleRetry = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      expanded: false,
    });
  };

  handleGoHome = () => {
    window.location.href = "/";
  };

  handleToggleExpanded = () => {
    this.setState((prev) => ({ expanded: !prev.expanded }));
  };

  handleReportBug = () => {
    const { error, errorInfo } = this.state;
    const bugReport = {
      error: error?.message,
      stack: error?.stack,
      componentStack: errorInfo?.componentStack,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href,
    };

    // In a real application, this would send to your error reporting service
    console.log("Bug report:", bugReport);
    
    // For now, copy to clipboard
    navigator.clipboard.writeText(JSON.stringify(bugReport, null, 2));
    alert("Error details copied to clipboard. Please send this to support.");
  };

  render() {
    if (this.state.hasError) {
      // Custom fallback UI
      if (this.props.fallback) {
        return this.props.fallback;
      }

      const { error, errorInfo, expanded } = this.state;

      return (
        <Box
          sx={{
            minHeight: "100vh",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            p: 2,
            bgcolor: "background.default",
          }}
        >
          <Card sx={{ maxWidth: 600, width: "100%" }}>
            <CardContent sx={{ p: 3 }}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 3 }}>
                <ErrorIcon color="error" sx={{ fontSize: 40 }} />
                <Box>
                  <Typography variant="h5" component="h1" gutterBottom>
                    Something went wrong
                  </Typography>
                  <Typography variant="body1" color="text.secondary">
                    We&apos;re sorry, but something unexpected happened. Our team has been notified.
                  </Typography>
                </Box>
              </Box>

              <Alert severity="error" sx={{ mb: 3 }}>
                <Typography variant="subtitle2" gutterBottom>
                  Error Details:
                </Typography>
                <Typography variant="body2">
                  {error?.message || "An unknown error occurred"}
                </Typography>
              </Alert>

              <Stack direction="row" spacing={2} sx={{ mb: 3 }}>
                <Button
                  variant="contained"
                  startIcon={<Refresh />}
                  onClick={this.handleRetry}
                >
                  Try Again
                </Button>
                <Button
                  variant="outlined"
                  startIcon={<Home />}
                  onClick={this.handleGoHome}
                >
                  Go Home
                </Button>
                <Button
                  variant="outlined"
                  startIcon={<BugReport />}
                  onClick={this.handleReportBug}
                >
                  Report Bug
                </Button>
              </Stack>

              {process.env.NODE_ENV === "development" && errorInfo && (
                <Box>
                  <Button
                    onClick={this.handleToggleExpanded}
                    endIcon={expanded ? <ExpandLess /> : <ExpandMore />}
                    size="small"
                    sx={{ mb: 2 }}
                  >
                    {expanded ? "Hide" : "Show"} Technical Details
                  </Button>
                  
                  <Collapse in={expanded}>
                    <Box
                      sx={{
                        p: 2,
                        bgcolor: "grey.100",
                        borderRadius: 1,
                        fontFamily: "monospace",
                        fontSize: "0.75rem",
                        overflow: "auto",
                        maxHeight: 300,
                      }}
                    >
                      <Typography variant="subtitle2" gutterBottom>
                        Error Stack:
                      </Typography>
                      <pre style={{ margin: 0, whiteSpace: "pre-wrap" }}>
                        {error?.stack}
                      </pre>
                      
                      <Typography variant="subtitle2" gutterBottom sx={{ mt: 2 }}>
                        Component Stack:
                      </Typography>
                      <pre style={{ margin: 0, whiteSpace: "pre-wrap" }}>
                        {errorInfo.componentStack}
                      </pre>
                    </Box>
                  </Collapse>
                </Box>
              )}

              <Box sx={{ mt: 3, p: 2, bgcolor: "info.light", borderRadius: 1 }}>
                <Typography variant="body2" color="info.contrastText">
                  <strong>What you can do:</strong>
                </Typography>
                <Box component="ul" sx={{ mt: 1, pl: 2 }}>
                  <Typography component="li" variant="body2" color="info.contrastText">
                    Try refreshing the page or going back to the previous page
                  </Typography>
                  <Typography component="li" variant="body2" color="info.contrastText">
                    Check your internet connection
                  </Typography>
                  <Typography component="li" variant="body2" color="info.contrastText">
                    Contact support if the problem persists
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Box>
      );
    }

    return this.props.children;
  }
}

// Hook for functional components to handle errors
export const useErrorHandler = () => {
  const [error, setError] = React.useState<Error | null>(null);

  const resetError = () => setError(null);

  const captureError = (error: Error) => {
    setError(error);
    console.error("Error captured:", error);
  };

  // Reset error on unmount
  React.useEffect(() => {
    return () => setError(null);
  }, []);

  return {
    error,
    captureError,
    resetError,
  };
};

// Higher-order component for error boundaries
export const withErrorBoundary = <P extends object>(
  Component: React.ComponentType<P>,
  errorBoundaryProps?: Omit<Props, "children">
) => {
  const WrappedComponent = (props: P) => (
    <EnhancedErrorBoundary {...errorBoundaryProps}>
      <Component {...props} />
    </EnhancedErrorBoundary>
  );

  WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name})`;

  return WrappedComponent;
};

export default EnhancedErrorBoundary;
