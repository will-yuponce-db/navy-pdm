import { useEffect, useRef } from "react";
import { useDispatch } from "react-redux";
import { webSocketService } from "../services/websocket";
import {
  addRealTimeNotification,
  markNotificationAsReadRealTime,
  removeNotificationRealTime,
  markAllNotificationsAsReadRealTime,
  clearAllNotificationsRealTime,
} from "../redux/services/notificationSlice";
import { updateWorkOrder } from "../redux/services/workOrderSlice";
import type { Notification } from "../types";

export const useWebSocket = () => {
  const dispatch = useDispatch();
  const isInitialized = useRef(false);

  useEffect(() => {
    if (isInitialized.current) return;
    isInitialized.current = true;

    // Connect to WebSocket
    webSocketService.connect();

    // Set up event listeners
    webSocketService.onNotificationNew((notification: Notification) => {
      console.log("New notification received:", notification);
      dispatch(addRealTimeNotification(notification));
    });

    webSocketService.onNotificationRead((data: { notificationId: string }) => {
      console.log("Notification marked as read:", data.notificationId);
      dispatch(markNotificationAsReadRealTime(data.notificationId));
    });

    webSocketService.onNotificationDismissed(
      (data: { notificationId: string }) => {
        console.log("Notification dismissed:", data.notificationId);
        dispatch(removeNotificationRealTime(data.notificationId));
      },
    );

    webSocketService.onNotificationsAllRead(() => {
      console.log("All notifications marked as read");
      dispatch(markAllNotificationsAsReadRealTime());
    });

    webSocketService.onNotificationsAllCleared(() => {
      console.log("All notifications cleared");
      dispatch(clearAllNotificationsRealTime());
    });

    // Handle work order updates
    webSocketService.onWorkOrderUpdated((data) => {
      console.log("Work order updated via WebSocket:", data);
      dispatch(
        updateWorkOrder({
          wo: data.workOrder.wo,
          updates: data.workOrder,
        }),
      );
    });

    // Cleanup on unmount
    return () => {
      webSocketService.removeNotificationListeners();
      webSocketService.disconnect();
      isInitialized.current = false;
    };
  }, [dispatch]);

  return {
    isConnected: webSocketService.isConnected(),
    socketId: webSocketService.getSocketId(),
    markAsRead: webSocketService.markNotificationAsRead.bind(webSocketService),
    dismiss: webSocketService.dismissNotification.bind(webSocketService),
    clearAll: webSocketService.clearAllNotifications.bind(webSocketService),
  };
};
