import React, {
  useState,
  createContext,
  useContext,
  useEffect,
  useMemo,
  useCallback,
  useRef,
} from "react";
import {
  isRouteErrorResponse,
  Links,
  Meta,
  Scripts,
  ScrollRestoration,
} from "react-router";
import { createTheme, ThemeProvider } from "@mui/material/styles";
import { Provider, useSelector } from "react-redux";

import type { Route } from "./+types/root";
import "./app.css";
import NavComponent from "./components/NavComponent";
import { store } from "../app/redux/store/store";
import { ErrorSnackbar, useErrorHandler } from "./components/ErrorHandling";
import { EnhancedErrorBoundary } from "./components/EnhancedErrorBoundary";
import { useAppDispatch } from "./redux/hooks";
import type { RootState } from "./types";
import {
  // dismissNotification,
  // markAsRead,
  addNotification,
} from "./redux/services/notificationSlice";

// Theme Context
const ThemeContext = createContext({
  toggleTheme: () => {},
  isDarkMode: false,
});

export const useTheme = () => useContext(ThemeContext);

// Shared theme configuration to reduce duplication
const baseThemeConfig = {
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
    h1: { fontSize: "2rem", fontWeight: 600, lineHeight: 1.2 },
    h2: { fontSize: "1.75rem", fontWeight: 600, lineHeight: 1.3 },
    h3: { fontSize: "1.5rem", fontWeight: 600, lineHeight: 1.4 },
    h4: { fontSize: "1.25rem", fontWeight: 600, lineHeight: 1.4 },
    h5: { fontSize: "1.125rem", fontWeight: 600, lineHeight: 1.5 },
    h6: { fontSize: "1rem", fontWeight: 600, lineHeight: 1.5 },
    body1: { fontSize: "1rem", lineHeight: 1.6 },
    body2: { fontSize: "0.875rem", lineHeight: 1.6 },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 4,
          textTransform: "none" as const,
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
};

const lightTheme = createTheme({
  ...baseThemeConfig,
  palette: {
    mode: "light",
    primary: { main: "#FF3621" }, // Databricks Orange
    secondary: { main: "#1B3139" }, // Databricks Teal
    background: {
      default: "#fafafa",
      paper: "#ffffff",
    },
    error: {
      main: "#b71c1c",
      light: "#ffebee",
      dark: "#8b0000",
    },
    warning: { main: "#f57c00" },
    success: { main: "#388e3c" },
    text: {
      primary: "#212121",
      secondary: "#424242",
    },
  },
});

const darkTheme = createTheme({
  ...baseThemeConfig,
  palette: {
    mode: "dark",
    primary: { main: "#FF6B4A" }, // Lighter Databricks Orange for dark mode
    secondary: { main: "#2C646E" }, // Databricks Myrtle Green for dark mode
    background: {
      default: "#121212",
      paper: "#1e1e1e",
    },
    error: {
      main: "#ff6b6b",
      light: "#2d1b1b",
      dark: "#ff5252",
    },
    warning: { main: "#ff9800" },
    success: { main: "#4caf50" },
    text: {
      primary: "#ffffff",
      secondary: "#bdbdbd",
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
  {
    rel: "icon",
    href: "/favicon.ico",
    type: "image/x-icon",
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
          pointerEvents: "auto",
        }}
        suppressHydrationWarning={true}
      >
        {children}
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}

// Sample notifications data to reduce inline object creation
const SAMPLE_NOTIFICATIONS = [
  {
    type: "warning" as const,
    title: "CASREP Alert",
    message:
      "USS Cole (DDG-67) - High EGT detected, immediate inspection required",
    priority: "critical" as const,
    category: "maintenance" as const,
  },
  {
    type: "info" as const,
    title: "Maintenance Scheduled",
    message:
      "USS Bainbridge (DDG-96) - Routine maintenance scheduled for tomorrow",
    priority: "medium" as const,
    category: "maintenance" as const,
  },
  {
    type: "success" as const,
    title: "Work Order Completed",
    message: "Work Order #ABC123 has been successfully completed",
    priority: "low" as const,
    category: "update" as const,
  },
];


// Inner component that uses Redux hooks
function AppContent() {
  const notifications = useSelector(
    (state: RootState) => state.notifications.notifications,
  );
  const dispatch = useAppDispatch();
  const { error, clearError } = useErrorHandler();
  const [isClient, setIsClient] = useState(false);


  // Track client-side hydration
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Initialize sample notifications on client side only after hydration
  // Use a ref to track if we've already initialized to prevent re-adding after clearing
  const hasInitialized = useRef(false);

  useEffect(() => {
    if (isClient && notifications.length === 0 && !hasInitialized.current) {
      SAMPLE_NOTIFICATIONS.forEach((notification) => {
        dispatch(addNotification(notification));
      });
      hasInitialized.current = true;
    }
  }, [dispatch, isClient, notifications.length]);

  return (
    <>
      <ErrorSnackbar error={error} onClose={clearError} />
    </>
  );
}

export default function App() {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isHydrated, setIsHydrated] = useState(false);

  // Handle hydration and theme initialization
  useEffect(() => {
    setIsHydrated(true);
    if (typeof window !== "undefined" && window.localStorage) {
      const savedTheme = localStorage.getItem("theme");
      setIsDarkMode(savedTheme === "dark");
    }
  }, []);

  const toggleTheme = useCallback(() => {
    const newMode = !isDarkMode;
    setIsDarkMode(newMode);
    if (typeof window !== "undefined" && window.localStorage) {
      localStorage.setItem("theme", newMode ? "dark" : "light");
    }
  }, [isDarkMode]);

  const theme = useMemo(
    () => (isDarkMode ? darkTheme : lightTheme),
    [isDarkMode],
  );

  // Apply theme to document (only on client side)
  useEffect(() => {
    if (typeof window !== "undefined" && window.document && isHydrated) {
      document.documentElement.setAttribute(
        "data-theme",
        isDarkMode ? "dark" : "light",
      );
      document.body.style.backgroundColor = isDarkMode ? "#121212" : "#fafafa";
    }
  }, [isDarkMode, isHydrated]);

  const themeContextValue = useMemo(
    () => ({
      toggleTheme,
      isDarkMode,
    }),
    [toggleTheme, isDarkMode],
  );

  return (
    <EnhancedErrorBoundary>
      <ThemeContext.Provider value={themeContextValue}>
        <ThemeProvider theme={theme}>
          <Provider store={store}>
            <NavComponent />
            <AppContent />
          </Provider>
        </ThemeProvider>
      </ThemeContext.Provider>
    </EnhancedErrorBoundary>
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
