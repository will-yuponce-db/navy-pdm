import React, { useState } from "react";
import { Chip, Box, Typography, IconButton, Collapse } from "@mui/material";
import {
  Close,
  Warning,
  Info,
  CheckCircle,
  Error as ErrorIcon,
  ExpandMore,
  ExpandLess,
} from "@mui/icons-material";
import { useDispatch } from "react-redux";
import { clearAllNotifications } from "../redux/services/notificationSlice";

interface Notification {
  id: string;
  type: "success" | "error" | "warning" | "info";
  title: string;
  message: string;
  timestamp: string;
  priority: "low" | "medium" | "high" | "critical";
  category: "maintenance" | "system" | "alert" | "update";
  read: boolean;
}

interface NotificationCenterProps {
  notifications: Notification[];
  onDismiss: (id: string) => void;
  onMarkAsRead: (id: string) => void;
}

export const NotificationCenter = ({
  notifications,
  onDismiss,
  onMarkAsRead,
}: NotificationCenterProps) => {
  const [expanded, setExpanded] = useState(false);
  const dispatch = useDispatch();

  const handleClearAll = () => {
    dispatch(clearAllNotifications());
    setExpanded(false);
  };

  const handleMarkAllAsRead = () => {
    notifications.forEach((notification) => {
      if (!notification.read) {
        onMarkAsRead(notification.id);
      }
    });
  };

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === "Escape" && expanded) {
      setExpanded(false);
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "critical":
        return "error";
      case "high":
        return "warning";
      case "medium":
        return "info";
      default:
        return "default";
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "success":
        return <CheckCircle color="success" />;
      case "error":
        return <ErrorIcon color="error" />;
      case "warning":
        return <Warning color="warning" />;
      default:
        return <Info color="info" />;
    }
  };

  const unreadCount = notifications.filter((n) => !n.read).length;
  const criticalNotifications = notifications.filter(
    (n) => n.priority === "critical" && !n.read,
  );
  const hasCriticalAlerts = criticalNotifications.length > 0;

  return (
    <Box
      sx={{
        position: "fixed",
        bottom: 16,
        right: 16,
        zIndex: 1000,
        maxWidth: { xs: "calc(100vw - 32px)", sm: 400 },
        backgroundColor: "transparent",
        pointerEvents: "none",
        maxHeight: "calc(100vh - 64px - 32px)",
        overflow: "hidden",
        // Ensure this container doesn't interfere with clicks
        "& > *": {
          pointerEvents: "auto",
        },
      }}
      role="region"
      aria-label="Notification center"
      onKeyDown={handleKeyDown}
    >
      {/* Notification Header */}
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 1,
          mb: 1,
          pointerEvents: "auto",
          bgcolor: hasCriticalAlerts ? "error.light" : "background.paper",
          borderRadius: 1,
          padding: 1.5,
          boxShadow: hasCriticalAlerts ? 3 : 1,
          border: 2,
          borderColor: hasCriticalAlerts ? "error.main" : "divider",
          minHeight: 48,
          animation: hasCriticalAlerts ? "pulse 2s infinite" : "none",
          "@keyframes pulse": {
            "0%": { boxShadow: "0 0 0 0 rgba(183, 28, 28, 0.7)" },
            "70%": { boxShadow: "0 0 0 10px rgba(183, 28, 28, 0)" },
            "100%": { boxShadow: "0 0 0 0 rgba(183, 28, 28, 0)" },
          },
        }}
        role="toolbar"
        aria-label="Notification controls"
      >
        <Typography
          variant="subtitle1"
          sx={{
            fontWeight: 600,
            color: hasCriticalAlerts ? "error.main" : "text.primary",
            flexGrow: 1,
          }}
          id="notification-title"
        >
          {hasCriticalAlerts ? "Critical Alerts" : "Notifications"}
        </Typography>

        {unreadCount > 0 && (
          <Chip
            label={`${unreadCount} unread`}
            color="error"
            size="small"
            sx={{ fontWeight: 600 }}
            onClick={() => setExpanded(!expanded)}
            role="button"
            tabIndex={0}
            aria-label={`${unreadCount} unread notifications. Click to expand.`}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                setExpanded(!expanded);
              }
            }}
          />
        )}

        <IconButton
          size="small"
          onClick={() => setExpanded(!expanded)}
          aria-label={
            expanded ? "Collapse notifications" : "Expand notifications"
          }
          aria-expanded={expanded}
          aria-controls="notification-list"
          sx={{ minWidth: 44, minHeight: 44 }}
        >
          {expanded ? <ExpandLess /> : <ExpandMore />}
        </IconButton>

        {unreadCount > 0 && (
          <IconButton
            size="small"
            onClick={handleMarkAllAsRead}
            aria-label="Mark all notifications as read"
            sx={{ minWidth: 44, minHeight: 44 }}
          >
            <CheckCircle fontSize="small" />
          </IconButton>
        )}

        <IconButton
          size="small"
          onClick={handleClearAll}
          aria-label="Clear all notifications"
          sx={{ minWidth: 44, minHeight: 44 }}
        >
          <Close />
        </IconButton>
      </Box>

      {/* Notification List */}
      <Collapse in={expanded}>
        <Box
          id="notification-list"
          sx={{
            maxHeight: "calc(100vh - 64px - 120px)",
            overflow: "auto",
            bgcolor: "background.paper",
            borderRadius: 1,
            boxShadow: 2,
            border: 1,
            borderColor: "divider",
            color: "text.primary",
            pointerEvents: "auto",
            marginBottom: 1,
          }}
          role="list"
          aria-label="Notification list"
          aria-describedby="notification-title"
        >
          {notifications.length === 0 ? (
            <Box sx={{ padding: 2, textAlign: "center" }}>
              <Typography variant="body2" color="text.secondary">
                No notifications
              </Typography>
            </Box>
          ) : (
            notifications.slice(0, 10).map((notification, index) => (
              <Box
                key={notification.id}
                role="listitem"
                sx={{
                  borderBottom:
                    index < notifications.slice(0, 10).length - 1 ? 1 : 0,
                  borderColor: "divider",
                  padding: 2,
                  backgroundColor: notification.read
                    ? "action.hover"
                    : "background.paper",
                  cursor: notification.read ? "default" : "pointer",
                  "&:hover": {
                    backgroundColor: "action.hover",
                  },
                }}
                onClick={() => {
                  if (!notification.read) {
                    onMarkAsRead(notification.id);
                  }
                }}
                onKeyDown={(e) => {
                  if (
                    (e.key === "Enter" || e.key === " ") &&
                    !notification.read
                  ) {
                    e.preventDefault();
                    onMarkAsRead(notification.id);
                  }
                }}
                tabIndex={notification.read ? -1 : 0}
                aria-label={`${notification.read ? "Read" : "Unread"} notification: ${notification.title}`}
              >
                <Box sx={{ display: "flex", alignItems: "flex-start", gap: 1 }}>
                  <Box sx={{ marginTop: 0.5 }}>
                    {getTypeIcon(notification.type)}
                  </Box>
                  <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                    <Typography
                      variant="subtitle2"
                      sx={{
                        fontWeight: notification.read ? 400 : 600,
                        color: "text.primary",
                        marginBottom: 0.5,
                      }}
                    >
                      {notification.title}
                    </Typography>
                    <Typography
                      variant="body2"
                      sx={{
                        color: "text.secondary",
                        marginBottom: 1,
                        lineHeight: 1.4,
                      }}
                    >
                      {notification.message}
                    </Typography>
                    <Box
                      sx={{
                        display: "flex",
                        gap: 1,
                        alignItems: "center",
                        flexWrap: "wrap",
                      }}
                    >
                      <Chip
                        label={notification.category}
                        size="small"
                        variant="outlined"
                        sx={{ fontSize: "0.75rem" }}
                      />
                      <Chip
                        label={notification.priority}
                        size="small"
                        color={
                          getPriorityColor(notification.priority) as
                            | "default"
                            | "primary"
                            | "secondary"
                            | "error"
                            | "info"
                            | "success"
                            | "warning"
                        }
                        sx={{ fontSize: "0.75rem" }}
                      />
                      <Typography
                        variant="caption"
                        color="text.secondary"
                        sx={{ fontSize: "0.75rem" }}
                      >
                        {new Date(notification.timestamp).toLocaleString()}
                      </Typography>
                    </Box>
                  </Box>
                  <IconButton
                    size="small"
                    onClick={() => onDismiss(notification.id)}
                    aria-label={`Dismiss notification: ${notification.title}`}
                    sx={{ minWidth: 32, minHeight: 32 }}
                  >
                    <Close fontSize="small" />
                  </IconButton>
                </Box>
              </Box>
            ))
          )}
        </Box>
      </Collapse>
    </Box>
  );
};
