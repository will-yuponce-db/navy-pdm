import React, { useState, useEffect } from "react";
import {
  Box,
  Card,
  CardContent,
  Typography,
  LinearProgress,
  Chip,
  IconButton,
  Tooltip,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider,
} from "@mui/material";
import {
  Warning,
  Timeline,
  Refresh,
  FilterList,
} from "@mui/icons-material";
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
} from "recharts";

interface SensorData {
  timestamp: Date;
  temperature: number;
  vibration: number;
  pressure: number;
  power: number;
  efficiency: number;
}

interface Anomaly {
  id: string;
  timestamp: Date;
  severity: "low" | "medium" | "high" | "critical";
  type: "temperature" | "vibration" | "pressure" | "power" | "efficiency";
  description: string;
  predictedFailure: boolean;
  confidence: number;
  shipId: string;
  gteId: string;
}

interface RULPrediction {
  shipId: string;
  gteId: string;
  currentRUL: number;
  predictedFailureDate: Date;
  confidence: number;
  failureMode: string;
  riskLevel: "low" | "medium" | "high" | "critical";
}

// Mock data generation
const generateSensorData = (): SensorData[] => {
  const data: SensorData[] = [];
  const now = new Date();

  for (let i = 0; i < 24; i++) {
    const timestamp = new Date(now.getTime() - (23 - i) * 60 * 60 * 1000);
    data.push({
      timestamp,
      temperature: 180 + Math.random() * 20 + (i > 18 ? (i - 18) * 5 : 0),
      vibration: 2.5 + Math.random() * 1.5 + (i > 20 ? (i - 20) * 2 : 0),
      pressure: 15 + Math.random() * 5,
      power: 85 + Math.random() * 10,
      efficiency: 92 - Math.random() * 4 - (i > 19 ? (i - 19) * 2 : 0),
    });
  }

  return data;
};

const mockAnomalies: Anomaly[] = [
  {
    id: "1",
    timestamp: new Date(Date.now() - 300000),
    severity: "critical",
    type: "temperature",
    description: "Temperature spike detected - 15°C above normal",
    predictedFailure: true,
    confidence: 0.92,
    shipId: "USS Cole",
    gteId: "GTE-4567",
  },
  {
    id: "2",
    timestamp: new Date(Date.now() - 600000),
    severity: "high",
    type: "vibration",
    description: "Vibration amplitude increasing - 2.3x normal",
    predictedFailure: true,
    confidence: 0.78,
    shipId: "USS Bainbridge",
    gteId: "GTE-1234",
  },
  {
    id: "3",
    timestamp: new Date(Date.now() - 900000),
    severity: "medium",
    type: "efficiency",
    description: "Efficiency degradation - 5% below baseline",
    predictedFailure: false,
    confidence: 0.65,
    shipId: "USS Enterprise",
    gteId: "GTE-7890",
  },
];

const mockRULPredictions: RULPrediction[] = [
  {
    shipId: "USS Cole",
    gteId: "GTE-4567",
    currentRUL: 14,
    predictedFailureDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
    confidence: 0.92,
    failureMode: "Bearing Failure",
    riskLevel: "critical",
  },
  {
    shipId: "USS Bainbridge",
    gteId: "GTE-1234",
    currentRUL: 28,
    predictedFailureDate: new Date(Date.now() + 28 * 24 * 60 * 60 * 1000),
    confidence: 0.78,
    failureMode: "Rotor Imbalance",
    riskLevel: "high",
  },
  {
    shipId: "USS Enterprise",
    gteId: "GTE-7890",
    currentRUL: 45,
    predictedFailureDate: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000),
    confidence: 0.65,
    failureMode: "Seal Degradation",
    riskLevel: "medium",
  },
];

const getSeverityColor = (severity: Anomaly["severity"]) => {
  switch (severity) {
    case "critical":
      return "#b71c1c"; // Darker red for better contrast
    case "high":
      return "#ff9800";
    case "medium":
      return "#ffc107";
    case "low":
      return "#4caf50";
    default:
      return "#9e9e9e";
  }
};

const getRiskColor = (risk: RULPrediction["riskLevel"]) => {
  switch (risk) {
    case "critical":
      return "#b71c1c"; // Darker red for better contrast
    case "high":
      return "#ff9800";
    case "medium":
      return "#ffc107";
    case "low":
      return "#4caf50";
    default:
      return "#9e9e9e";
  }
};

export default function PredictiveAnalytics() {
  const [sensorData, setSensorData] =
    useState<SensorData[]>(generateSensorData());
  const [anomalies] = useState<Anomaly[]>(mockAnomalies);
  const [rulPredictions] =
    useState<RULPrediction[]>(mockRULPredictions);
  const [autoRefresh, setAutoRefresh] = useState(true);

  // Simulate real-time data updates
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      setSensorData((prevData) => {
        const newData = [...prevData];
        const latest = newData[newData.length - 1];
        const newPoint: SensorData = {
          timestamp: new Date(),
          temperature: Math.max(
            0,
            latest.temperature + (Math.random() - 0.5) * 2,
          ),
          vibration: Math.max(
            0,
            latest.vibration + (Math.random() - 0.5) * 0.1,
          ),
          pressure: Math.max(0, latest.pressure + (Math.random() - 0.5) * 0.5),
          power: Math.max(0, latest.power + (Math.random() - 0.5) * 2),
          efficiency: Math.max(
            0,
            Math.min(100, latest.efficiency + (Math.random() - 0.5) * 1),
          ),
        };
        return [...newData.slice(1), newPoint];
      });
    }, 2000);

    return () => clearInterval(interval);
  }, [autoRefresh]);

  const criticalAnomalies = anomalies.filter(
    (a) => a.severity === "critical",
  ).length;
  const highRiskPredictions = rulPredictions.filter(
    (r) => r.riskLevel === "critical" || r.riskLevel === "high",
  ).length;
  const avgConfidence =
    rulPredictions.reduce((sum, r) => sum + r.confidence, 0) /
    rulPredictions.length;

  return (
    <Box sx={{ width: "100%", p: 2 }}>
      <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
        {/* Header Stats */}
        <Box>
          <Card
            sx={{
              background:
                "linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.05) 100%)",
              backdropFilter: "blur(20px)",
              border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: 3,
              boxShadow: "0 8px 32px rgba(0,0,0,0.1)",
            }}
          >
            <CardContent>
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  mb: 2,
                }}
              >
                <Typography
                  variant="h4"
                  sx={{
                    fontWeight: 700,
                    background:
                      "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                    backgroundClip: "text",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                  }}
                >
                  Predictive Analytics Dashboard
                </Typography>
                <Box sx={{ display: "flex", gap: 1 }}>
                  <Tooltip title="Auto Refresh">
                    <IconButton
                      onClick={() => setAutoRefresh(!autoRefresh)}
                      color={autoRefresh ? "primary" : "default"}
                    >
                      <Refresh />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Filter">
                    <IconButton>
                      <FilterList />
                    </IconButton>
                  </Tooltip>
                </Box>
              </Box>

              <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
                <Box sx={{ flex: 1, minWidth: "200px", textAlign: "center" }}>
                  <Typography
                    variant="h3"
                    sx={{ fontWeight: 800, color: "error.main" }}
                  >
                    {criticalAnomalies}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Critical Anomalies
                  </Typography>
                </Box>
                <Box sx={{ flex: 1, minWidth: "200px", textAlign: "center" }}>
                  <Typography
                    variant="h3"
                    sx={{ fontWeight: 800, color: "warning.main" }}
                  >
                    {highRiskPredictions}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    High Risk Predictions
                  </Typography>
                </Box>
                <Box sx={{ flex: 1, minWidth: "200px", textAlign: "center" }}>
                  <Typography
                    variant="h3"
                    sx={{ fontWeight: 800, color: "info.main" }}
                  >
                    {Math.round(avgConfidence * 100)}%
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Avg Confidence
                  </Typography>
                </Box>
                <Box sx={{ flex: 1, minWidth: "200px", textAlign: "center" }}>
                  <Typography
                    variant="h3"
                    sx={{ fontWeight: 800, color: "success.main" }}
                  >
                    {rulPredictions.length}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Active Predictions
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Box>

        {/* Sensor Data Charts */}
        <Box
          sx={{
            display: "flex",
            flexDirection: { xs: "column", md: "row" },
            gap: 2,
          }}
        >
          <Box sx={{ flex: 2 }}>
            <Card
              sx={{
                background:
                  "linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.05) 100%)",
                backdropFilter: "blur(20px)",
                border: "1px solid rgba(255,255,255,0.1)",
                borderRadius: 3,
                boxShadow: "0 8px 32px rgba(0,0,0,0.1)",
              }}
            >
              <CardContent>
                <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>
                  Real-Time Sensor Data
                </Typography>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={sensorData}>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="rgba(255,255,255,0.1)"
                    />
                    <XAxis
                      dataKey="timestamp"
                      tickFormatter={(value) =>
                        new Date(value).toLocaleTimeString()
                      }
                      stroke="rgba(255,255,255,0.7)"
                    />
                    <YAxis stroke="rgba(255,255,255,0.7)" />
                    <RechartsTooltip
                      contentStyle={{
                        background: "rgba(0,0,0,0.8)",
                        border: "1px solid rgba(255,255,255,0.2)",
                        borderRadius: "8px",
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="temperature"
                      stackId="1"
                      stroke="#ff6b6b"
                      fill="#ff6b6b"
                      fillOpacity={0.3}
                    />
                    <Area
                      type="monotone"
                      dataKey="vibration"
                      stackId="2"
                      stroke="#4ecdc4"
                      fill="#4ecdc4"
                      fillOpacity={0.3}
                    />
                    <Area
                      type="monotone"
                      dataKey="efficiency"
                      stackId="3"
                      stroke="#45b7d1"
                      fill="#45b7d1"
                      fillOpacity={0.3}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </Box>

          {/* RUL Predictions */}
          <Box sx={{ flex: 1 }}>
            <Card
              sx={{
                background:
                  "linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.05) 100%)",
                backdropFilter: "blur(20px)",
                border: "1px solid rgba(255,255,255,0.1)",
                borderRadius: 3,
                boxShadow: "0 8px 32px rgba(0,0,0,0.1)",
              }}
            >
              <CardContent>
                <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>
                  Remaining Useful Life
                </Typography>
                <List>
                  {rulPredictions.map((prediction, index) => (
                    <React.Fragment key={prediction.gteId}>
                      <ListItem sx={{ px: 0 }}>
                        <ListItemIcon>
                          <Timeline
                            sx={{ color: getRiskColor(prediction.riskLevel) }}
                          />
                        </ListItemIcon>
                        <ListItemText
                          primary={
                            <Box
                              sx={{
                                display: "flex",
                                alignItems: "center",
                                gap: 1,
                              }}
                            >
                              <Typography
                                variant="subtitle2"
                                sx={{ fontWeight: 600 }}
                              >
                                {prediction.shipId} - {prediction.gteId}
                              </Typography>
                              <Chip
                                label={prediction.riskLevel}
                                size="small"
                                sx={{
                                  backgroundColor: getRiskColor(
                                    prediction.riskLevel,
                                  ),
                                  color: "white",
                                  fontWeight: 600,
                                }}
                              />
                            </Box>
                          }
                          secondary={
                            <Box>
                              <Typography
                                variant="body2"
                                color="text.secondary"
                              >
                                RUL: {prediction.currentRUL} days
                              </Typography>
                              <Typography
                                variant="caption"
                                color="text.secondary"
                              >
                                Failure Mode: {prediction.failureMode}
                              </Typography>
                              <Box sx={{ mt: 1 }}>
                                <LinearProgress
                                  variant="determinate"
                                  value={(prediction.currentRUL / 60) * 100}
                                  sx={{
                                    height: 4,
                                    borderRadius: 2,
                                    backgroundColor: "rgba(255,255,255,0.1)",
                                    "& .MuiLinearProgress-bar": {
                                      backgroundColor: getRiskColor(
                                        prediction.riskLevel,
                                      ),
                                      borderRadius: 2,
                                    },
                                  }}
                                />
                              </Box>
                            </Box>
                          }
                        />
                      </ListItem>
                      {index < rulPredictions.length - 1 && <Divider />}
                    </React.Fragment>
                  ))}
                </List>
              </CardContent>
            </Card>
          </Box>
        </Box>

        {/* Anomaly Detection */}
        <Box
          sx={{
            display: "flex",
            flexDirection: { xs: "column", md: "row" },
            gap: 2,
          }}
        >
          <Box sx={{ flex: 1 }}>
            <Card
              sx={{
                background:
                  "linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.05) 100%)",
                backdropFilter: "blur(20px)",
                border: "1px solid rgba(255,255,255,0.1)",
                borderRadius: 3,
                boxShadow: "0 8px 32px rgba(0,0,0,0.1)",
              }}
            >
              <CardContent>
                <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>
                  Active Anomalies
                </Typography>
                <List>
                  {anomalies.map((anomaly, index) => (
                    <React.Fragment key={anomaly.id}>
                      <ListItem sx={{ px: 0 }}>
                        <ListItemIcon>
                          <Warning
                            sx={{ color: getSeverityColor(anomaly.severity) }}
                          />
                        </ListItemIcon>
                        <ListItemText
                          primary={
                            <Box
                              sx={{
                                display: "flex",
                                alignItems: "center",
                                gap: 1,
                              }}
                            >
                              <Typography
                                variant="subtitle2"
                                sx={{ fontWeight: 600 }}
                              >
                                {anomaly.shipId} - {anomaly.gteId}
                              </Typography>
                              <Chip
                                label={anomaly.severity}
                                size="small"
                                sx={{
                                  backgroundColor: getSeverityColor(
                                    anomaly.severity,
                                  ),
                                  color: "white",
                                  fontWeight: 600,
                                }}
                              />
                              {anomaly.predictedFailure && (
                                <Chip
                                  label="Predicted Failure"
                                  size="small"
                                  color="error"
                                  variant="outlined"
                                />
                              )}
                            </Box>
                          }
                          secondary={
                            <Box>
                              <Typography
                                variant="body2"
                                color="text.secondary"
                              >
                                {anomaly.description}
                              </Typography>
                              <Typography
                                variant="caption"
                                color="text.secondary"
                              >
                                Confidence:{" "}
                                {Math.round(anomaly.confidence * 100)}%
                              </Typography>
                            </Box>
                          }
                        />
                      </ListItem>
                      {index < anomalies.length - 1 && <Divider />}
                    </React.Fragment>
                  ))}
                </List>
              </CardContent>
            </Card>
          </Box>

          {/* Performance Metrics */}
          <Box sx={{ flex: 1 }}>
            <Card
              sx={{
                background:
                  "linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.05) 100%)",
                backdropFilter: "blur(20px)",
                border: "1px solid rgba(255,255,255,0.1)",
                borderRadius: 3,
                boxShadow: "0 8px 32px rgba(0,0,0,0.1)",
              }}
            >
              <CardContent>
                <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>
                  Performance Metrics
                </Typography>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart
                    data={[
                      { name: "Temperature", value: 85, color: "#ff6b6b" },
                      { name: "Vibration", value: 72, color: "#4ecdc4" },
                      { name: "Pressure", value: 91, color: "#45b7d1" },
                      { name: "Efficiency", value: 88, color: "#96ceb4" },
                    ]}
                  >
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="rgba(255,255,255,0.1)"
                    />
                    <XAxis dataKey="name" stroke="rgba(255,255,255,0.7)" />
                    <YAxis stroke="rgba(255,255,255,0.7)" />
                    <RechartsTooltip
                      contentStyle={{
                        background: "rgba(0,0,0,0.8)",
                        border: "1px solid rgba(255,255,255,0.2)",
                        borderRadius: "8px",
                      }}
                    />
                    <Bar dataKey="value" fill="#667eea" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </Box>
        </Box>
      </Box>
    </Box>
  );
}
