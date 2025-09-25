import { createSlice } from "@reduxjs/toolkit";
import type { PayloadAction } from "@reduxjs/toolkit";
import { v4 as uuidv4 } from "uuid";
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
        id: uuidv4(),
        timestamp: new Date(),
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
  },
});

export const {
  addNotification,
  dismissNotification,
  markAsRead,
  markAllAsRead,
  clearAllNotifications,
} = notificationSlice.actions;

// Export notification creators
export { createWorkOrderNotifications };

export default notificationSlice.reducer;
