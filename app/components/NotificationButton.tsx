import React, { useState, useCallback } from "react";
import {
  IconButton,
  Badge,
  Popover,
  Box,
  Typography,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Chip,
  Divider,
  Button,
  Paper,
} from "@mui/material";
import {
  Notifications,
  NotificationsActive,
  CheckCircle,
  Error as ErrorIcon,
  Warning,
  Info,
  Close,
  ExpandMore,
  ExpandLess,
} from "@mui/icons-material";
import { useSelector } from "react-redux";
import { useAppDispatch } from "../redux/hooks";
import type { RootState } from "../types";
import {
  dismissNotification,
  markAsRead,
  markAllAsRead,
  clearAllNotifications,
} from "../redux/services/notificationSlice";

interface NotificationItem {
  id: string;
  type: "success" | "error" | "warning" | "info";
  title: string;
  message: string;
  timestamp: string;
  priority: "low" | "medium" | "high" | "critical";
  category: "maintenance" | "system" | "alert" | "update";
  read: boolean;
}

export const NotificationButton = () => {
  const [anchorEl, setAnchorEl] = useState<HTMLButtonElement | null>(null);
  const [expanded, setExpanded] = useState(false);

  const notifications: NotificationItem[] = useSelector(
    (state: RootState) => state.notifications.notifications,
  );
  const dispatch = useAppDispatch();

  const open = Boolean(anchorEl);
  const unreadCount = notifications.filter((n) => !n.read).length;
  const criticalNotifications = notifications.filter(
    (n) => n.priority === "critical" && !n.read,
  );
  const hasCriticalAlerts = criticalNotifications.length > 0;

  const handleClick = useCallback(
    (event: React.MouseEvent<HTMLButtonElement>) => {
      setAnchorEl(event.currentTarget);
    },
    [],
  );

  const handleClose = useCallback(() => {
    setAnchorEl(null);
    setExpanded(false);
  }, []);

  const handleDismiss = useCallback(
    (id: string) => {
      dispatch(dismissNotification(id));
    },
    [dispatch],
  );

  const handleMarkAsRead = useCallback(
    (id: string) => {
      dispatch(markAsRead(id));
    },
    [dispatch],
  );

  const handleMarkAllAsRead = useCallback(() => {
    dispatch(markAllAsRead());
  }, [dispatch]);

  const handleClearAll = useCallback(() => {
    // Clear from local state
    dispatch(clearAllNotifications());
    handleClose();
  }, [dispatch, handleClose]);

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "success":
        return <CheckCircle color="success" fontSize="small" />;
      case "error":
        return <ErrorIcon color="error" fontSize="small" />;
      case "warning":
        return <Warning color="warning" fontSize="small" />;
      default:
        return <Info color="info" fontSize="small" />;
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

  const displayedNotifications = expanded
    ? notifications.slice(0, 10)
    : notifications.slice(0, 3);

  return (
    <>
      <IconButton
        color="inherit"
        onClick={handleClick}
        aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ""}`}
        size="small"
        sx={{
          position: "relative",
          ...(hasCriticalAlerts && {
            animation: "pulse 2s infinite",
            "@keyframes pulse": {
              "0%": { boxShadow: "0 0 0 0 rgba(183, 28, 28, 0.7)" },
              "70%": { boxShadow: "0 0 0 10px rgba(183, 28, 28, 0)" },
              "100%": { boxShadow: "0 0 0 0 rgba(183, 28, 28, 0)" },
            },
          }),
        }}
      >
        <Badge
          badgeContent={unreadCount}
          color={hasCriticalAlerts ? "error" : "secondary"}
          max={99}
        >
          {hasCriticalAlerts ? (
            <NotificationsActive color="inherit" />
          ) : (
            <Notifications color="inherit" />
          )}
        </Badge>
      </IconButton>

      <Popover
        open={open}
        anchorEl={anchorEl}
        onClose={handleClose}
        anchorOrigin={{
          vertical: "bottom",
          horizontal: "right",
        }}
        transformOrigin={{
          vertical: "top",
          horizontal: "right",
        }}
        PaperProps={{
          sx: {
            width: { xs: "calc(100vw - 32px)", sm: 400 },
            maxHeight: "calc(100vh - 100px)",
            mt: 1,
          },
        }}
      >
        <Paper
          sx={{
            bgcolor: hasCriticalAlerts ? "error.light" : "background.paper",
            border: hasCriticalAlerts ? 2 : 1,
            borderColor: hasCriticalAlerts ? "error.main" : "divider",
          }}
        >
          {/* Header */}
          <Box
            sx={{
              p: 2,
              borderBottom: 1,
              borderColor: "divider",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <Typography
              variant="h6"
              sx={{
                fontWeight: 600,
                color: hasCriticalAlerts ? "error.main" : "text.primary",
              }}
            >
              {hasCriticalAlerts ? "Critical Alerts" : "Notifications"}
            </Typography>

            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              {unreadCount > 0 && (
                <Chip
                  label={`${unreadCount} unread`}
                  color="error"
                  size="small"
                  sx={{ fontWeight: 600 }}
                />
              )}

              {notifications.length > 3 && (
                <IconButton
                  size="small"
                  onClick={() => setExpanded(!expanded)}
                  aria-label={expanded ? "Show less" : "Show more"}
                >
                  {expanded ? <ExpandLess /> : <ExpandMore />}
                </IconButton>
              )}
            </Box>
          </Box>

          {/* Notification List */}
          <Box
            sx={{
              maxHeight: "calc(100vh - 200px)",
              overflow: "auto",
            }}
          >
            {notifications.length === 0 ? (
              <Box sx={{ p: 3, textAlign: "center" }}>
                <Typography variant="body2" color="text.secondary">
                  No notifications
                </Typography>
              </Box>
            ) : (
              <List sx={{ p: 0 }}>
                {displayedNotifications.map((notification, index) => (
                  <React.Fragment key={notification.id}>
                    <ListItem
                      sx={{
                        bgcolor: notification.read
                          ? "action.hover"
                          : "background.paper",
                        cursor: notification.read ? "default" : "pointer",
                        "&:hover": {
                          bgcolor: "action.hover",
                        },
                      }}
                      onClick={() => {
                        if (!notification.read) {
                          handleMarkAsRead(notification.id);
                        }
                      }}
                    >
                      <ListItemIcon sx={{ minWidth: 40 }}>
                        {getTypeIcon(notification.type)}
                      </ListItemIcon>

                      <ListItemText
                        primary={
                          <Typography
                            variant="subtitle2"
                            sx={{
                              fontWeight: notification.read ? 400 : 600,
                              color: "text.primary",
                            }}
                          >
                            {notification.title}
                          </Typography>
                        }
                        secondary={
                          <Box>
                            <Typography
                              variant="body2"
                              color="text.secondary"
                              sx={{ mb: 1, lineHeight: 1.4 }}
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
                                {new Date(
                                  notification.timestamp,
                                ).toLocaleString()}
                              </Typography>
                            </Box>
                          </Box>
                        }
                      />

                      <IconButton
                        size="small"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDismiss(notification.id);
                        }}
                        aria-label={`Dismiss notification: ${notification.title}`}
                      >
                        <Close fontSize="small" />
                      </IconButton>
                    </ListItem>

                    {index < displayedNotifications.length - 1 && <Divider />}
                  </React.Fragment>
                ))}
              </List>
            )}
          </Box>

          {/* Footer Actions */}
          {notifications.length > 0 && (
            <Box
              sx={{
                p: 2,
                borderTop: 1,
                borderColor: "divider",
                display: "flex",
                gap: 1,
                justifyContent: "flex-end",
              }}
            >
              {unreadCount > 0 && (
                <Button
                  size="small"
                  onClick={handleMarkAllAsRead}
                  startIcon={<CheckCircle />}
                >
                  Mark All Read
                </Button>
              )}

              <Button
                size="small"
                onClick={handleClearAll}
                color="error"
                startIcon={<Close />}
              >
                Clear All
              </Button>
            </Box>
          )}
        </Paper>
      </Popover>
    </>
  );
};
