import type { WorkOrder, Notification } from "../types";

// Type-safe notification creation functions
export const createWorkOrderNotifications = {
  workOrderCreated: (
    workOrder: WorkOrder,
  ): Omit<Notification, "id" | "timestamp" | "read"> => ({
    type: "info",
    title: "New Work Order Created",
    message: `Work Order ${workOrder.wo} created for ${workOrder.ship} - ${workOrder.fm}`,
    priority:
      workOrder.priority === "CASREP"
        ? "critical"
        : workOrder.priority === "Urgent"
          ? "high"
          : "medium",
    category: "maintenance",
    workOrderId: workOrder.wo,
  }),

  workOrderUpdated: (
    workOrder: WorkOrder,
    changes: Partial<WorkOrder>,
  ): Omit<Notification, "id" | "timestamp" | "read"> => {
    const statusChange = changes.status;
    let type: Notification["type"] = "info";
    let priority: Notification["priority"] = "medium";
    let title = "Work Order Updated";
    let message = `Work Order ${workOrder.wo} for ${workOrder.ship} has been updated`;

    if (statusChange) {
      switch (statusChange) {
        case "In Progress":
          type = "info";
          priority = "medium";
          title = "Work Order Started";
          message = `Work Order ${workOrder.wo} for ${workOrder.ship} is now in progress`;
          break;
        case "Completed":
          type = "success";
          priority = "low";
          title = "Work Order Completed";
          message = `Work Order ${workOrder.wo} for ${workOrder.ship} has been completed successfully`;
          break;
        case "Cancelled":
          type = "warning";
          priority = "medium";
          title = "Work Order Cancelled";
          message = `Work Order ${workOrder.wo} for ${workOrder.ship} has been cancelled`;
          break;
        case "On Hold":
          type = "warning";
          priority = "high";
          title = "Work Order On Hold";
          message = `Work Order ${workOrder.wo} for ${workOrder.ship} has been put on hold`;
          break;
      }
    }

    return {
      type,
      title,
      message,
      priority,
      category: "maintenance",
      workOrderId: workOrder.wo,
    };
  },

  workOrderDeleted: (
    workOrderIds: string[],
  ): Omit<Notification, "id" | "timestamp" | "read"> => ({
    type: "warning",
    title: "Work Order(s) Deleted",
    message: `${workOrderIds.length} work order(s) have been deleted: ${workOrderIds.join(", ")}`,
    priority: "medium",
    category: "maintenance",
  }),

  casrepAlert: (
    workOrder: WorkOrder,
  ): Omit<Notification, "id" | "timestamp" | "read"> => ({
    type: "error",
    title: "CASREP Alert",
    message: `Critical alert for ${workOrder.ship} - ${workOrder.fm}. Immediate attention required!`,
    priority: "critical",
    category: "alert",
    workOrderId: workOrder.wo,
  }),

  urgentWorkOrder: (
    workOrder: WorkOrder,
  ): Omit<Notification, "id" | "timestamp" | "read"> => ({
    type: "warning",
    title: "Urgent Work Order",
    message: `Urgent work order ${workOrder.wo} for ${workOrder.ship} requires immediate attention`,
    priority: "high",
    category: "alert",
    workOrderId: workOrder.wo,
  }),
};

// System notification creators
export const createSystemNotifications = {
  maintenanceReminder: (
    gteCount: number,
  ): Omit<Notification, "id" | "timestamp" | "read"> => ({
    type: "warning",
    title: "Maintenance Reminder",
    message: `${gteCount} GTEs require predicted maintenance`,
    priority: "medium",
    category: "maintenance",
  }),

  systemUpdate: (
    version: string,
  ): Omit<Notification, "id" | "timestamp" | "read"> => ({
    type: "info",
    title: "System Update",
    message: `System updated to version ${version}`,
    priority: "low",
    category: "update",
  }),

  connectionError: (): Omit<Notification, "id" | "timestamp" | "read"> => ({
    type: "error",
    title: "Connection Error",
    message: "Unable to connect to the server. Please check your connection.",
    priority: "high",
    category: "system",
  }),
};
