import * as React from "react";
import Box from "@mui/material/Box";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import Tooltip from "@mui/material/Tooltip";
import { useNavigate } from "react-router";
import { useSelector } from "react-redux";
import { Badge, Chip, Divider } from "@mui/material";
import {
  Dashboard,
  Work,
  Inventory2,
  Category,
  Warning,
  Speed,
  TrendingUp,
  Assignment,
  Build,
  Assessment,
} from "@mui/icons-material";
import type { RootState } from "../types";

export default function QuickActions() {
  const navigate = useNavigate();
  const workOrders = useSelector((state: RootState) => state.workOrders);

  // Calculate critical metrics
  const criticalWorkOrders = workOrders?.filter(
    (wo) => wo.priority === "CASREP",
  ).length || 0;
  const urgentWorkOrders = workOrders?.filter(
    (wo) => wo.priority === "Urgent",
  ).length || 0;
  const inProgressWorkOrders = workOrders?.filter(
    (wo) => wo.status === "In Progress",
  ).length || 0;

  const quickActions = [
    {
      title: "Readiness Dashboard",
      icon: <Dashboard />,
      route: "/readiness",
      description: "Fleet readiness overview",
      badge: null,
      color: "primary" as const,
    },
    {
      title: "Work Orders",
      icon: <Work />,
      route: "/work-order",
      description: "Manage maintenance tasks",
      badge: inProgressWorkOrders > 0 ? inProgressWorkOrders : null,
      color: "secondary" as const,
    },
    {
      title: "Asset Management",
      icon: <Inventory2 />,
      route: "/assets",
      description: "Fleet asset tracking",
      badge: null,
      color: "info" as const,
    },
    {
      title: "Parts Inventory",
      icon: <Category />,
      route: "/parts",
      description: "Manage parts & supplies",
      badge: null,
      color: "success" as const,
    },
  ];

  const criticalAlerts = [
    {
      title: "CASREP Work Orders",
      count: criticalWorkOrders,
      color: "error" as const,
      icon: <Warning />,
      action: () => navigate("/work-order?filter=CASREP"),
    },
    {
      title: "Urgent Tasks",
      count: urgentWorkOrders,
      color: "warning" as const,
      icon: <Speed />,
      action: () => navigate("/work-order?filter=Urgent"),
    },
  ];

  return (
    <Card
      sx={{
        height: "100%",
        backgroundColor: "background.paper",
        border: "1px solid",
        borderColor: "divider",
        borderRadius: 2,
        boxShadow: 2,
      }}
    >
      <CardContent sx={{ p: 3, position: "relative", zIndex: 1 }}>
        <Typography
          variant="h4"
          sx={{
            fontWeight: 700,
            mb: 3,
            color: "primary.main",
          }}
        >
          Quick Actions
        </Typography>

        {/* Critical Alerts Section */}
        {(criticalWorkOrders > 0 || urgentWorkOrders > 0) && (
          <Box sx={{ mb: 3 }}>
            <Typography
              variant="h6"
              sx={{
                fontWeight: 600,
                mb: 2,
                color: "text.primary",
                padding: 1,
                display: "flex",
                alignItems: "center",
                gap: 1,
              }}
            >
              <Warning />
              Critical Alerts
            </Typography>
            <Divider sx={{ mb: 2 }} />
            <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
              {criticalAlerts.map(
                (alert, index) =>
                  alert.count > 0 && (
                    <Tooltip
                      key={index}
                      title={`Click to view ${alert.title.toLowerCase()}`}
                    >
                      <Button
                        onClick={alert.action}
                        variant="outlined"
                        size="small"
                        startIcon={alert.icon}
                        sx={{
                          justifyContent: "flex-start",
                          textTransform: "none",
                          borderColor: `${alert.color}.main`,
                          color: `${alert.color}.main`,
                          "&:hover": {
                            backgroundColor: `${alert.color}.light`,
                            borderColor: `${alert.color}.dark`,
                          },
                        }}
                      >
                        <Box
                          sx={{
                            display: "flex",
                            alignItems: "center",
                            gap: 1,
                            width: "100%",
                          }}
                        >
                          <Typography variant="body2" sx={{ flexGrow: 1 }}>
                            {alert.title}
                          </Typography>
                          <Chip
                            label={alert.count}
                            color={alert.color}
                            size="small"
                            sx={{ fontWeight: 600 }}
                          />
                        </Box>
                      </Button>
                    </Tooltip>
                  ),
              )}
            </Box>
            <Divider sx={{ my: 2 }} />
          </Box>
        )}

        {/* Main Quick Actions */}
        <Box
          sx={{ display: "flex", flexDirection: "column", gap: 2 }}
          role="group"
          aria-label="Quick action buttons"
        >
          {quickActions.map((action, index) => (
            <Tooltip key={index} title={action.description}>
              <Button
                onClick={() => navigate(action.route)}
                variant="contained"
                size="large"
                startIcon={action.icon}
                aria-label={`Navigate to ${action.title}`}
                sx={{
                  py: 2,
                  fontWeight: 700,
                  borderRadius: 2,
                  textTransform: "none",
                  fontSize: "1rem",
                  transition: "all 0.3s ease",
                  backgroundColor: `${action.color}.main`,
                  "&:hover": {
                    transform: "translateY(-2px)",
                    backgroundColor: `${action.color}.dark`,
                  },
                }}
              >
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: 1,
                    width: "100%",
                  }}
                >
                  <Typography sx={{ flexGrow: 1 }}>{action.title}</Typography>
                  {action.badge && (
                    <Badge
                      badgeContent={action.badge}
                      color="error"
                      sx={{
                        "& .MuiBadge-badge": {
                          fontWeight: 600,
                          fontSize: "0.75rem",
                        },
                      }}
                    />
                  )}
                </Box>
              </Button>
            </Tooltip>
          ))}
        </Box>

        {/* Keyboard Shortcuts Info */}
        <Box
          sx={{
            mt: 3,
            p: 2,
            backgroundColor: "background.default",
            borderRadius: 1,
          }}
        >
          <Typography
            variant="caption"
            sx={{
              color: "text.secondary",
              fontWeight: 600,
              display: "block",
              mb: 1,
            }}
          >
            Keyboard Shortcuts:
          </Typography>
          <Typography
            variant="caption"
            sx={{ color: "text.secondary", fontSize: "0.75rem" }}
          >
            Ctrl+1: Work Orders • Ctrl+2: Assets • Ctrl+3: Parts • Ctrl+R:
            Refresh
          </Typography>
        </Box>
      </CardContent>
    </Card>
  );
}
