import React, { useEffect } from "react";
import { useNavigate } from "react-router";
import { useSelector } from "react-redux";
import type { RootState } from "../types";

interface WorkflowShortcutsProps {
  onOpenWorkOrderModal?: () => void;
  onRefreshData?: () => void;
}

export const useWorkflowShortcuts = ({
  onOpenWorkOrderModal,
  onRefreshData,
}: WorkflowShortcutsProps = {}) => {
  const navigate = useNavigate();
  const workOrders = useSelector((state: RootState) => state.workOrders);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Only handle shortcuts when not in input fields
      if (
        event.target instanceof HTMLInputElement ||
        event.target instanceof HTMLTextAreaElement ||
        event.target instanceof HTMLSelectElement
      ) {
        return;
      }

      // Global shortcuts (Ctrl/Cmd + key)
      if (event.ctrlKey || event.metaKey) {
        switch (event.key) {
          case "1":
            event.preventDefault();
            navigate("/work-order");
            break;
          case "2":
            event.preventDefault();
            navigate("/assets");
            break;
          case "3":
            event.preventDefault();
            navigate("/parts");
            break;
          case "4":
            event.preventDefault();
            navigate("/readiness");
            break;
          case "n":
            event.preventDefault();
            onOpenWorkOrderModal?.();
            break;
          case "r":
            event.preventDefault();
            onRefreshData?.();
            break;
          case "h":
            event.preventDefault();
            navigate("/");
            break;
        }
      }

      // Quick access to critical work orders
      if (event.key === "c" && event.ctrlKey) {
        event.preventDefault();
        const criticalWorkOrders =
          workOrders?.filter((wo) => wo.priority === "CASREP") || [];
        if (criticalWorkOrders.length > 0) {
          navigate("/work-order?filter=CASREP");
        }
      }

      // Quick access to urgent work orders
      if (event.key === "u" && event.ctrlKey) {
        event.preventDefault();
        const urgentWorkOrders =
          workOrders?.filter((wo) => wo.priority === "Urgent") || [];
        if (urgentWorkOrders.length > 0) {
          navigate("/work-order?filter=Urgent");
        }
      }
    };

    if (typeof window !== "undefined" && window.document) {
      document.addEventListener("keydown", handleKeyDown);
      return () => document.removeEventListener("keydown", handleKeyDown);
    }
  }, [navigate, onOpenWorkOrderModal, onRefreshData, workOrders]);
};

// Component to display keyboard shortcuts help
export const KeyboardShortcutsHelp = () => {
  return (
    <div
      style={{
        position: "fixed",
        bottom: 20,
        left: 20,
        backgroundColor: "rgba(0,0,0,0.8)",
        color: "white",
        padding: "10px",
        borderRadius: "5px",
        fontSize: "12px",
        zIndex: 1000,
        maxWidth: "300px",
      }}
    >
      <div style={{ fontWeight: "bold", marginBottom: "5px" }}>
        Keyboard Shortcuts:
      </div>
      <div>Ctrl+1: Work Orders</div>
      <div>Ctrl+2: Assets</div>
      <div>Ctrl+3: Parts</div>
      <div>Ctrl+4: Readiness</div>
      <div>Ctrl+N: New Work Order</div>
      <div>Ctrl+R: Refresh</div>
      <div>Ctrl+H: Home</div>
      <div>Ctrl+C: Critical Work Orders</div>
      <div>Ctrl+U: Urgent Work Orders</div>
    </div>
  );
};
