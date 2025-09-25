import {
  isRouteErrorResponse,
  Links,
  Meta,
  Scripts,
  ScrollRestoration,
} from "react-router";

import type { Route } from "./+types/root";
import "./app.css";
import NavComponent from "./components/NavComponent";
import { createTheme, ThemeProvider } from "@mui/material/styles";
import { store } from "../app/redux/store/store";
import { Provider } from "react-redux";
import { useState, createContext, useContext, useEffect } from "react";
import { ErrorSnackbar, useErrorHandler } from "./components/ErrorHandling";
import { NotificationCenter } from "./components/NotificationSystem";
import { useSelector } from "react-redux";
import { useAppDispatch } from "./redux/hooks";
import type { RootState } from "./types";
import {
  dismissNotification,
  markAsRead,
  addNotification,
} from "./redux/services/notificationSlice";

// Theme Context
const ThemeContext = createContext({
  toggleTheme: () => {},
  isDarkMode: false,
});

export const useTheme = () => useContext(ThemeContext);

const lightTheme = createTheme({
  palette: {
    mode: "light",
    primary: {
      main: "#FF3621", // Databricks Orange
    },
    secondary: {
      main: "#1B3139", // Databricks Teal
    },
    background: {
      default: "#fafafa", // Soft background
      paper: "#ffffff",
    },
    error: {
      main: "#b71c1c", // Darker red for better contrast
      light: "#ffebee", // Light red background
      dark: "#8b0000", // Darker red for hover states
    },
    warning: {
      main: "#f57c00", // High contrast orange
    },
    success: {
      main: "#388e3c", // High contrast green
    },
    text: {
      primary: "#212121", // High contrast text
      secondary: "#424242",
    },
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
    h1: {
      fontSize: "2rem",
      fontWeight: 600,
      lineHeight: 1.2,
    },
    h2: {
      fontSize: "1.75rem",
      fontWeight: 600,
      lineHeight: 1.3,
    },
    h3: {
      fontSize: "1.5rem",
      fontWeight: 600,
      lineHeight: 1.4,
    },
    h4: {
      fontSize: "1.25rem",
      fontWeight: 600,
      lineHeight: 1.4,
    },
    h5: {
      fontSize: "1.125rem",
      fontWeight: 600,
      lineHeight: 1.5,
    },
    h6: {
      fontSize: "1rem",
      fontWeight: 600,
      lineHeight: 1.5,
    },
    body1: {
      fontSize: "1rem",
      lineHeight: 1.6,
    },
    body2: {
      fontSize: "0.875rem",
      lineHeight: 1.6,
    },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 4,
          textTransform: "none",
          fontWeight: 600,
          minHeight: 44, // ADA minimum touch target
        },
      },
    },
    MuiIconButton: {
      styleOverrides: {
        root: {
          minWidth: 44,
          minHeight: 44,
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          "& .MuiOutlinedInput-root": {
            borderRadius: 4,
          },
        },
      },
    },
  },
});

const darkTheme = createTheme({
  palette: {
    mode: "dark",
    primary: {
      main: "#FF6B4A", // Lighter Databricks Orange for dark mode
    },
    secondary: {
      main: "#2C646E", // Databricks Myrtle Green for dark mode
    },
    background: {
      default: "#121212",
      paper: "#1e1e1e",
    },
    error: {
      main: "#ff6b6b", // Brighter red for dark theme
      light: "#2d1b1b", // Dark red background
      dark: "#ff5252", // Lighter red for hover states
    },
    warning: {
      main: "#ff9800",
    },
    success: {
      main: "#4caf50",
    },
    text: {
      primary: "#ffffff",
      secondary: "#bdbdbd",
    },
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
    h1: {
      fontSize: "2rem",
      fontWeight: 600,
      lineHeight: 1.2,
    },
    h2: {
      fontSize: "1.75rem",
      fontWeight: 600,
      lineHeight: 1.3,
    },
    h3: {
      fontSize: "1.5rem",
      fontWeight: 600,
      lineHeight: 1.4,
    },
    h4: {
      fontSize: "1.25rem",
      fontWeight: 600,
      lineHeight: 1.4,
    },
    h5: {
      fontSize: "1.125rem",
      fontWeight: 600,
      lineHeight: 1.5,
    },
    h6: {
      fontSize: "1rem",
      fontWeight: 600,
      lineHeight: 1.5,
    },
    body1: {
      fontSize: "1rem",
      lineHeight: 1.6,
    },
    body2: {
      fontSize: "0.875rem",
      lineHeight: 1.6,
    },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 4,
          textTransform: "none",
          fontWeight: 600,
          minHeight: 44,
        },
      },
    },
    MuiIconButton: {
      styleOverrides: {
        root: {
          minWidth: 44,
          minHeight: 44,
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          "& .MuiOutlinedInput-root": {
            borderRadius: 4,
          },
        },
      },
    },
  },
});
export const links: Route.LinksFunction = () => [
  { rel: "preconnect", href: "https://fonts.googleapis.com" },
  {
    rel: "preconnect",
    href: "https://fonts.gstatic.com",
    crossOrigin: "anonymous",
  },
  {
    rel: "stylesheet",
    href: "https://fonts.googleapis.com/css2?family=Inter:ital,opsz,wght@0,14..32,100..900;1,14..32,100..900&display=swap",
  },
  {
    rel: "stylesheet",
    href: "https://fonts.googleapis.com/icon?family=Material+Icons",
  },
];

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      style={{ height: "100%", width: "100%", margin: 0, padding: 0 }}
    >
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta
          name="description"
          content="Navy PdM - Fleet Maintenance Management System"
        />
        <Meta />
        <Links />
      </head>
      <body
        style={{
          height: "100vh",
          width: "100vw",
          margin: 0,
          padding: 0,
          overflow: "auto",
        }}
      >
        {children}
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}

// Inner component that uses Redux hooks
function AppContent() {
  const notifications = useSelector(
    (state: RootState) => state.notifications.notifications,
  );
  const dispatch = useAppDispatch();
  const { error, clearError } = useErrorHandler();

  // Initialize sample notifications on client side
  useEffect(() => {
    if (notifications.length === 0) {
      dispatch(
        addNotification({
          type: "warning",
          title: "CASREP Alert",
          message:
            "USS Cole (DDG-67) - High EGT detected, immediate inspection required",
          priority: "critical",
          category: "maintenance",
        }),
      );

      dispatch(
        addNotification({
          type: "info",
          title: "Maintenance Scheduled",
          message:
            "USS Bainbridge (DDG-96) - Routine maintenance scheduled for tomorrow",
          priority: "medium",
          category: "maintenance",
        }),
      );

      dispatch(
        addNotification({
          type: "success",
          title: "Work Order Completed",
          message: "Work Order #ABC123 has been successfully completed",
          priority: "low",
          category: "update",
        }),
      );
    }
  }, [dispatch, notifications.length]);

  const handleDismissNotification = (id: string) => {
    dispatch(dismissNotification(id));
  };

  const handleMarkAsRead = (id: string) => {
    dispatch(markAsRead(id));
  };

  return (
    <>
      <ErrorSnackbar error={error} onClose={clearError} />
      <NotificationCenter
        notifications={notifications}
        onDismiss={handleDismissNotification}
        onMarkAsRead={handleMarkAsRead}
      />
    </>
  );
}

export default function App() {
  const [isDarkMode, setIsDarkMode] = useState(() => {
    // Check localStorage for saved theme preference (only on client side)
    if (typeof window !== "undefined" && window.localStorage) {
      const savedTheme = localStorage.getItem("theme");
      return savedTheme === "dark";
    }
    return false; // Default to light mode on server
  });

  const toggleTheme = () => {
    const newMode = !isDarkMode;
    setIsDarkMode(newMode);
    // Save theme preference to localStorage (only on client side)
    if (typeof window !== "undefined" && window.localStorage) {
      localStorage.setItem("theme", newMode ? "dark" : "light");
    }
  };

  const theme = isDarkMode ? darkTheme : lightTheme;

  // Apply theme to document (only on client side)
  useEffect(() => {
    if (typeof window !== "undefined" && window.document) {
      document.documentElement.setAttribute(
        "data-theme",
        isDarkMode ? "dark" : "light",
      );
      document.body.style.backgroundColor = isDarkMode ? "#121212" : "#fafafa";
    }
  }, [isDarkMode]);

  return (
    <ThemeContext.Provider value={{ toggleTheme, isDarkMode }}>
      <ThemeProvider theme={theme}>
        <Provider store={store}>
          <NavComponent />
          <AppContent />
        </Provider>
      </ThemeProvider>
    </ThemeContext.Provider>
  );
}

export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
  let message = "Oops!";
  let details = "An unexpected error occurred.";
  let stack: string | undefined;

  if (isRouteErrorResponse(error)) {
    message = error.status === 404 ? "404" : "Error";
    details =
      error.status === 404
        ? "The requested page could not be found."
        : error.statusText || details;
  } else if (import.meta.env.DEV && error && error instanceof Error) {
    details = error.message;
    stack = error.stack;
  }

  return (
    <main className="pt-16 p-4 container mx-auto">
      <h1>{message}</h1>
      <p>{details}</p>
      {stack && (
        <pre className="w-full p-4 overflow-x-auto">
          <code>{stack}</code>
        </pre>
      )}
    </main>
  );
}
