import {
  Card,
  CardContent,
  Typography,
  Box,
  Chip,
  Alert,
  LinearProgress,
} from "@mui/material";
import {
  TrendingUp,
  CheckCircle,
  Error as ErrorIcon,
} from "@mui/icons-material";
import type { MaintenanceKPI } from "../types";
import { v4 as uuidv4 } from "uuid";

export default function MaintenanceOverview() {
  const kpis: MaintenanceKPI[] = [
    {
      title: "GTEs – Need Maintenance (predicted)",
      metric: 51,
      details: "Across all ships (model inference)",
      trend: "up",
      severity: "warning",
    },
    {
      title: "GTEs – Fully Operational",
      metric: 153,
      details: "No faults observed",
      trend: "stable",
      severity: "normal",
    },
    {
      title: "CASREP GTEs",
      metric: 7,
      details: "Requires immediate attention",
      trend: "down",
      severity: "critical",
    },
  ];

  const getMetricColor = (severity: string) => {
    switch (severity) {
      case "critical":
        return "error.main";
      case "warning":
        return "warning.main";
      default:
        return "success.main";
    }
  };

  const getMetricIcon = (severity: string) => {
    switch (severity) {
      case "critical":
        return <ErrorIcon color="error" />;
      case "warning":
        return <TrendingUp color="warning" />;
      default:
        return <CheckCircle color="success" />;
    }
  };

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
          gutterBottom
          sx={{
            fontWeight: 700,
            mb: 2,
            color: "primary.main",
          }}
        >
          Fleet Maintenance Overview
        </Typography>
        <Typography
          variant="body1"
          sx={{
            color: "text.secondary",
            mb: 3,
            lineHeight: 1.6,
            fontSize: "1rem",
            fontWeight: 400,
          }}
        >
          Commanders&apos; view for Gas Turbine Engines (GTEs): readiness,
          predicted maintenance, and CASREP status across homeports. This demo
          mirrors Databricks SQL dashboards and Lakehouse workflows with a
          simplified UI.
        </Typography>

        {/* Critical Alert */}
        <Alert
          severity="warning"
          role="alert"
          aria-live="polite"
          sx={{
            mb: 3,
            borderRadius: 3,
            background:
              "linear-gradient(135deg, rgba(255, 193, 7, 0.1) 0%, rgba(255, 193, 7, 0.05) 100%)",
            border: "1px solid rgba(255, 193, 7, 0.2)",
            backdropFilter: "blur(10px)",
            boxShadow: "0 4px 16px rgba(255, 193, 7, 0.1)",
          }}
        >
          <Typography variant="body1" sx={{ fontWeight: 600 }}>
            <strong>Attention:</strong> 7 CASREP GTEs require immediate
            attention. Review critical maintenance alerts.
          </Typography>
        </Alert>

        <Box
          sx={{
            display: "flex",
            flexDirection: { xs: "column", sm: "row" },
            gap: 2,
          }}
          role="group"
          aria-label="Maintenance KPI cards"
        >
          {kpis.map((item) => (
            <Box key={uuidv4()} sx={{ flex: 1 }}>
              <Card
                variant="outlined"
                role="region"
                aria-labelledby={`kpi-title-${item.title.replace(/\s+/g, "-").toLowerCase()}`}
                aria-describedby={`kpi-description-${item.title.replace(/\s+/g, "-").toLowerCase()}`}
                sx={{
                  height: "100%",
                  backgroundColor: "background.paper",
                  border:
                    item.severity === "critical" ? "2px solid" : "1px solid",
                  borderColor:
                    item.severity === "critical" ? "error.main" : "divider",
                  borderRadius: 2,
                  boxShadow: 1,
                  transition: "all 0.3s ease",
                  "&:hover": {
                    boxShadow: 3,
                    transform: "translateY(-2px)",
                  },
                }}
              >
                <CardContent sx={{ p: 2.5, position: "relative", zIndex: 1 }}>
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "flex-start",
                      justifyContent: "space-between",
                      mb: 1.5,
                    }}
                  >
                    <Typography
                      id={`kpi-title-${item.title.replace(/\s+/g, "-").toLowerCase()}`}
                      variant="caption"
                      sx={{
                        color: "text.secondary",
                        fontWeight: 600,
                        fontSize: "0.8rem",
                        textTransform: "uppercase",
                        letterSpacing: "0.5px",
                      }}
                    >
                      {item.title}
                    </Typography>
                    <Box
                      sx={{
                        p: 1,
                        borderRadius: "50%",
                        background: "rgba(255,255,255,0.1)",
                        backdropFilter: "blur(10px)",
                      }}
                      aria-hidden="true"
                    >
                      {getMetricIcon(item.severity || "normal")}
                    </Box>
                  </Box>

                  <Typography
                    variant="h2"
                    sx={{
                      color: getMetricColor(item.severity || "normal"),
                      fontWeight: 800,
                      mb: 1,
                      fontSize: { xs: "2.5rem", sm: "3rem" },
                      textShadow: "0 2px 8px rgba(0,0,0,0.1)",
                      background:
                        item.severity === "critical"
                          ? "linear-gradient(135deg, #f44336 0%, #d32f2f 100%)"
                          : item.severity === "warning"
                            ? "linear-gradient(135deg, #ff9800 0%, #f57c00 100%)"
                            : "linear-gradient(135deg, #4caf50 0%, #388e3c 100%)",
                      backgroundClip: "text",
                      WebkitBackgroundClip: "text",
                      WebkitTextFillColor: "transparent",
                    }}
                    aria-label={`${item.metric} ${item.title}`}
                  >
                    {item.metric}
                  </Typography>

                  <Typography
                    id={`kpi-description-${item.title.replace(/\s+/g, "-").toLowerCase()}`}
                    variant="body2"
                    sx={{
                      color: "text.secondary",
                      mb: 1.5,
                      fontSize: "0.9rem",
                      fontWeight: 500,
                      lineHeight: 1.4,
                    }}
                  >
                    {item.details}
                  </Typography>

                  {item.trend && (
                    <Box sx={{ mt: 1 }}>
                      <Chip
                        label={
                          item.trend === "up"
                            ? "Increasing"
                            : item.trend === "down"
                              ? "Decreasing"
                              : "Stable"
                        }
                        size="small"
                        color={
                          item.trend === "up"
                            ? "warning"
                            : item.trend === "down"
                              ? "success"
                              : "default"
                        }
                        variant="outlined"
                        sx={{
                          fontWeight: 600,
                        }}
                      />
                    </Box>
                  )}

                  {/* Progress indicator for critical items */}
                  {item.severity === "critical" && (
                    <Box sx={{ mt: 1.5 }}>
                      <LinearProgress
                        variant="determinate"
                        value={75}
                        color="error"
                        sx={{
                          height: 8,
                          borderRadius: 4,
                        }}
                      />
                      <Typography
                        variant="caption"
                        sx={{
                          color: "error.main",
                          mt: 0.5,
                          display: "block",
                          fontWeight: 600,
                          textTransform: "uppercase",
                          letterSpacing: "0.5px",
                        }}
                      >
                        Urgent Action Required
                      </Typography>
                    </Box>
                  )}
                </CardContent>
              </Card>
            </Box>
          ))}
        </Box>
      </CardContent>
    </Card>
  );
}
