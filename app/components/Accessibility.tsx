import { useEffect, useCallback } from "react";
import { useNavigate } from "react-router";

interface KeyboardShortcutsProps {
  onOpenWorkOrderModal?: () => void;
  onToggleTheme?: () => void;
  onRefreshData?: () => void;
  onNavigate?: (route: string, title: string) => void;
}

export const useKeyboardShortcuts = ({
  onOpenWorkOrderModal,
  onToggleTheme,
  onRefreshData,
  onNavigate,
}: KeyboardShortcutsProps) => {
  const navigate = useNavigate();

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      // Check if user is typing in an input field
      const target = event.target as HTMLElement;
      if (
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.contentEditable === "true"
      ) {
        return;
      }

      // Check for Ctrl/Cmd + key combinations
      if (event.ctrlKey || event.metaKey) {
        switch (event.key.toLowerCase()) {
          case "n":
            event.preventDefault();
            onOpenWorkOrderModal?.();
            break;
          case "k": {
            event.preventDefault();
            // Focus search (if available)
            const searchInput = document.querySelector(
              'input[placeholder*="search" i]',
            ) as HTMLInputElement;
            searchInput?.focus();
            break;
          }
          case "r":
            event.preventDefault();
            onRefreshData?.();
            break;
          case "d":
            event.preventDefault();
            onToggleTheme?.();
            break;
          case "1":
            event.preventDefault();
            if (onNavigate) {
              onNavigate("/", "Home");
            } else {
              navigate("/");
            }
            break;
          case "2":
            event.preventDefault();
            if (onNavigate) {
              onNavigate("/work-order", "Work Order");
            } else {
              navigate("/work-order");
            }
            break;
          case "3":
            event.preventDefault();
            if (onNavigate) {
              onNavigate("/assets", "Asset Management");
            } else {
              navigate("/assets");
            }
            break;
          case "4":
            event.preventDefault();
            if (onNavigate) {
              onNavigate("/parts", "Parts");
            } else {
              navigate("/parts");
            }
            break;
          case "5":
            event.preventDefault();
            if (onNavigate) {
              onNavigate("/readiness", "Readiness Dashboard");
            } else {
              navigate("/readiness");
            }
            break;
        }
      }

      // Global shortcuts (without modifiers)
      switch (event.key) {
        case "Escape": {
          // Close any open modals or menus
          const modal = document.querySelector('[role="dialog"]');
          if (modal) {
            const closeButton = modal.querySelector(
              '[aria-label*="close" i], [aria-label*="cancel" i]',
            ) as HTMLElement;
            closeButton?.click();
          }
          break;
        }
        case "?":
          // Show help dialog
          if (!event.ctrlKey && !event.metaKey) {
            event.preventDefault();
            showKeyboardShortcutsHelp();
          }
          break;
      }
    },
    [navigate, onOpenWorkOrderModal, onToggleTheme, onRefreshData, onNavigate],
  );

  useEffect(() => {
    if (typeof window !== "undefined" && window.document) {
      document.addEventListener("keydown", handleKeyDown);
      return () => {
        document.removeEventListener("keydown", handleKeyDown);
      };
    }
  }, [handleKeyDown]);
};

const showKeyboardShortcutsHelp = () => {
  const shortcuts = [
    { key: "Ctrl/Cmd + N", description: "Create new work order" },
    { key: "Ctrl/Cmd + K", description: "Focus search" },
    { key: "Ctrl/Cmd + R", description: "Refresh data" },
    { key: "Ctrl/Cmd + D", description: "Toggle dark mode" },
    { key: "Ctrl/Cmd + 1", description: "Go to Dashboard" },
    { key: "Ctrl/Cmd + 2", description: "Go to Work Orders" },
    { key: "Ctrl/Cmd + 3", description: "Go to Assets" },
    { key: "Ctrl/Cmd + 4", description: "Go to Parts" },
    { key: "Ctrl/Cmd + 5", description: "Go to Readiness" },
    { key: "Escape", description: "Close modal/menu" },
    { key: "?", description: "Show this help" },
  ];

  const helpText = shortcuts
    .map((s) => `${s.key}: ${s.description}`)
    .join("\n");

  // Create a temporary help dialog
  const helpDialog = document.createElement("div");
  helpDialog.style.cssText = `
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    background: white;
    border: 2px solid #ccc;
    border-radius: 8px;
    padding: 20px;
    box-shadow: 0 4px 20px rgba(0,0,0,0.3);
    z-index: 9999;
    font-family: monospace;
    white-space: pre-line;
    max-width: 400px;
  `;

  helpDialog.innerHTML = `
    <h3 style="margin-top: 0;">Keyboard Shortcuts</h3>
    <div>${helpText}</div>
    <button onclick="this.parentElement.remove()" style="margin-top: 10px; padding: 5px 10px;">Close</button>
  `;

  // Add accessibility attributes
  helpDialog.setAttribute("role", "dialog");
  helpDialog.setAttribute("aria-labelledby", "help-title");
  helpDialog.setAttribute("aria-modal", "true");

  document.body.appendChild(helpDialog);

  // Auto-remove after 10 seconds
  setTimeout(() => {
    if (helpDialog.parentElement) {
      helpDialog.remove();
    }
  }, 10000);
};

// Accessibility utilities
export const useAccessibility = () => {
  useEffect(() => {
    // Only run on client side
    if (typeof window === "undefined" || !window.document) {
      return;
    }

    // Add skip links for screen readers
    const skipLink = document.createElement("a");
    skipLink.href = "#main-content";
    skipLink.textContent = "Skip to main content";
    skipLink.style.cssText = `
      position: absolute;
      top: -40px;
      left: 6px;
      background: #000;
      color: #fff;
      padding: 8px;
      text-decoration: none;
      z-index: 1000;
      transition: top 0.3s;
      border-radius: 4px;
      font-weight: 600;
    `;

    skipLink.addEventListener("focus", () => {
      skipLink.style.top = "6px";
    });

    skipLink.addEventListener("blur", () => {
      skipLink.style.top = "-40px";
    });

    // Add additional skip links
    const skipToNav = document.createElement("a");
    skipToNav.href = "#navigation-drawer";
    skipToNav.textContent = "Skip to navigation";
    skipToNav.style.cssText = skipLink.style.cssText;
    skipToNav.style.left = "120px";

    skipToNav.addEventListener("focus", () => {
      skipToNav.style.top = "6px";
    });

    skipToNav.addEventListener("blur", () => {
      skipToNav.style.top = "-40px";
    });

    document.body.insertBefore(skipLink, document.body.firstChild);
    document.body.insertBefore(skipToNav, document.body.firstChild);

    // Add main content landmark
    const mainContent = document.querySelector(
      '[role="main"], main, #main-content',
    );
    if (!mainContent) {
      const main = document.createElement("main");
      main.id = "main-content";
      main.setAttribute("role", "main");
      const content = document.querySelector(".MuiBox-root") || document.body;
      content.appendChild(main);
    }

    // Add page title updates for screen readers
    const updatePageTitle = () => {
      const currentPath = window.location.pathname;
      const pageNames: Record<string, string> = {
        "/": "Dashboard",
        "/work-order": "Work Orders",
        "/assets": "Assets",
        "/parts": "Parts",
        "/readiness": "Readiness",
      };

      const pageName = pageNames[currentPath] || "Navy PdM";
      document.title = `${pageName} - Navy PdM`;
    };

    updatePageTitle();

    // Listen for route changes
    const observer = new MutationObserver(updatePageTitle);
    observer.observe(document.body, { childList: true, subtree: true });

    return () => {
      skipLink.remove();
      skipToNav.remove();
      observer.disconnect();
    };
  }, []);
};

// ARIA labels and roles helper
export const getAriaLabels = () => ({
  workOrderTable: {
    table: "Work orders table",
    row: (index: number) => `Work order row ${index + 1}`,
    cell: (column: string, value: string) => `${column}: ${value}`,
    statusButton: (status: string) => `Change status from ${status}`,
    priorityChip: (priority: string) => `Priority: ${priority}`,
  },
  maintenanceOverview: {
    kpiCard: (title: string) => `KPI: ${title}`,
    alert: "Critical maintenance alert",
    progressBar: (value: number) => `Progress: ${value}%`,
  },
  navigation: {
    drawerToggle: "Toggle navigation menu",
    themeToggle: "Toggle dark mode",
    navItem: (name: string) => `Navigate to ${name}`,
  },
  modal: {
    workOrderForm: "Create new work order form",
    closeButton: "Close modal",
    submitButton: "Submit work order",
  },
});

// Focus management utilities
export const focusManagement = {
  // Trap focus within an element
  trapFocus: (element: HTMLElement) => {
    const focusableElements = element.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
    );

    const firstElement = focusableElements[0] as HTMLElement;
    const lastElement = focusableElements[
      focusableElements.length - 1
    ] as HTMLElement;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Tab") {
        if (e.shiftKey) {
          if (document.activeElement === firstElement) {
            e.preventDefault();
            lastElement.focus();
          }
        } else {
          if (document.activeElement === lastElement) {
            e.preventDefault();
            firstElement.focus();
          }
        }
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  },

  // Announce changes to screen readers
  announce: (message: string, priority: "polite" | "assertive" = "polite") => {
    const announcement = document.createElement("div");
    announcement.setAttribute("aria-live", priority);
    announcement.setAttribute("aria-atomic", "true");
    announcement.style.cssText = `
      position: absolute;
      left: -10000px;
      width: 1px;
      height: 1px;
      overflow: hidden;
    `;

    document.body.appendChild(announcement);
    announcement.textContent = message;

    setTimeout(() => {
      document.body.removeChild(announcement);
    }, 1000);
  },
};
