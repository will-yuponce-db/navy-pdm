import { createSlice } from "@reduxjs/toolkit";
import type { PayloadAction } from "@reduxjs/toolkit";
import type { Notification, NotificationState } from "../../types";
import { createWorkOrderNotifications } from "../../utils/notificationCreators";

const initialState: NotificationState = {
  notifications: [],
};

const notificationSlice = createSlice({
  name: "notifications",
  initialState,
  reducers: {
    addNotification: (
      state,
      action: PayloadAction<Omit<Notification, "id" | "timestamp" | "read">>,
    ) => {
      const newNotification: Notification = {
        id: `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        timestamp: new Date().toISOString(),
        read: false,
        ...action.payload,
      };
      state.notifications.unshift(newNotification);

      // Keep only the last 50 notifications
      if (state.notifications.length > 50) {
        state.notifications = state.notifications.slice(0, 50);
      }
    },
    dismissNotification: (state, action: PayloadAction<string>) => {
      state.notifications = state.notifications.filter(
        (n) => n.id !== action.payload,
      );
    },
    markAsRead: (state, action: PayloadAction<string>) => {
      const notification = state.notifications.find(
        (n) => n.id === action.payload,
      );
      if (notification) {
        notification.read = true;
      }
    },
    markAllAsRead: (state) => {
      state.notifications.forEach((n) => (n.read = true));
    },
    clearAllNotifications: (state) => {
      state.notifications = [];
    },
    // Real-time notification handlers
    addRealTimeNotification: (state, action: PayloadAction<Notification>) => {
      const notification = action.payload;
      // Check if notification already exists to avoid duplicates
      const exists = state.notifications.some(n => n.id === notification.id);
      if (!exists) {
        state.notifications.unshift(notification);
        // Keep only the last 50 notifications
        if (state.notifications.length > 50) {
          state.notifications = state.notifications.slice(0, 50);
        }
      }
    },
    markNotificationAsReadRealTime: (state, action: PayloadAction<string>) => {
      const notification = state.notifications.find(n => n.id === action.payload);
      if (notification) {
        notification.read = true;
      }
    },
    removeNotificationRealTime: (state, action: PayloadAction<string>) => {
      state.notifications = state.notifications.filter(n => n.id !== action.payload);
    },
    markAllNotificationsAsReadRealTime: (state) => {
      state.notifications.forEach(n => n.read = true);
    },
  },
});

export const {
  addNotification,
  dismissNotification,
  markAsRead,
  markAllAsRead,
  clearAllNotifications,
  addRealTimeNotification,
  markNotificationAsReadRealTime,
  removeNotificationRealTime,
  markAllNotificationsAsReadRealTime,
} = notificationSlice.actions;

// Export notification creators
export { createWorkOrderNotifications };

export default notificationSlice.reducer;
