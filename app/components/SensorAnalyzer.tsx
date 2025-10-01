import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  Box,
  Paper,
  Typography,
  Grid,
  Card,
  CardContent,
  Chip,
  IconButton,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Button,
  Alert,
  LinearProgress,
  Tooltip,
  Divider,
} from "@mui/material";
import {
  Close as CloseIcon,
  Refresh as RefreshIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  TrendingFlat as TrendingFlatIcon,
  Warning as WarningIcon,
  Error as ErrorIcon,
  CheckCircle as CheckCircleIcon,
  Build as BuildIcon,
} from "@mui/icons-material";
import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip as ChartTooltip,
  Legend,
  Filler,
} from "chart.js";
import type { SensorAnalyzerProps, SensorData, SensorSystem, SensorAnalytics, SensorStatus } from "../types";
import { sensorDataService } from "../services/sensorData";
import { createAIWorkOrder } from "../utils/aiWorkOrderGenerator";
import { useAppDispatch } from "../redux/hooks";

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  ChartTooltip,
  Legend,
  Filler
);

const SensorAnalyzer: React.FC<SensorAnalyzerProps> = ({
  workOrderId,
  systemId,
  sensorId,
  onClose,
}) => {
  const dispatch = useAppDispatch();
  const [sensorData, setSensorData] = useState<SensorData[]>([]);
  const [systems, setSystems] = useState<SensorSystem[]>([]);
  const [selectedSystem, setSelectedSystem] = useState<string>(systemId || "");
  const [selectedSensor, setSelectedSensor] = useState<string>(sensorId || "");
  const [timeRange, setTimeRange] = useState<string>("7d");
  const [analytics, setAnalytics] = useState<SensorAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [workOrderInfo, setWorkOrderInfo] = useState<Record<string, unknown> | null>(null);

  // Load initial data
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        
        // Load work order information if workOrderId is provided
        if (workOrderId) {
          // In a real app, this would fetch from the API
          // For now, we'll simulate work order data
          const mockWorkOrder = {
            wo: workOrderId,
            ship: "USS Example",
            gte: "LM2500",
            fm: "High Vibration",
            priority: "Urgent",
            status: "In Progress",
            symptoms: "Excessive vibration detected in main engine",
            recommendedAction: "Inspect and replace vibration dampeners"
          };
          setWorkOrderInfo(mockWorkOrder);
        }

        const systemsData = sensorDataService.getSystems();
        setSystems(systemsData);

        if (systemId) {
          const systemSensors = sensorDataService.getSensorData(systemId);
          setSensorData(systemSensors);
          setSelectedSystem(systemId);
        } else if (systemsData.length > 0) {
          setSelectedSystem(systemsData[0].id);
          const initialSensors = sensorDataService.getSensorData(systemsData[0].id);
          setSensorData(initialSensors);
        }
      } catch (err) {
        setError("Failed to load sensor data");
        console.error("Error loading sensor data:", err);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [systemId, workOrderId]);

  // Update sensor data when system changes
  useEffect(() => {
    if (selectedSystem) {
      const systemSensors = sensorDataService.getSensorData(selectedSystem);
      setSensorData(systemSensors);
      if (systemSensors.length > 0 && !selectedSensor) {
        setSelectedSensor(systemSensors[0].sensorId);
      }
    }
  }, [selectedSystem, selectedSensor]);

  // Load analytics when sensor changes
  useEffect(() => {
    if (selectedSensor) {
      try {
        const sensorAnalytics = sensorDataService.getSensorAnalytics(selectedSensor, timeRange);
        setAnalytics(sensorAnalytics);
      } catch (err) {
        console.error("Error loading analytics:", err);
      }
    }
  }, [selectedSensor, timeRange]);

  // Start real-time updates
  useEffect(() => {
    const handleRealTimeUpdate = (updatedData: SensorData[]) => {
      setSensorData(updatedData);
    };

    sensorDataService.startRealTimeUpdates(handleRealTimeUpdate, 5000);

    return () => {
      sensorDataService.stopRealTimeUpdates();
    };
  }, []);

  const handleRefresh = useCallback(() => {
    if (selectedSystem) {
      const systemSensors = sensorDataService.getSensorData(selectedSystem);
      setSensorData(systemSensors);
    }
  }, [selectedSystem]);

  const handleCreateAIWorkOrder = useCallback(async () => {
    try {
      // Use mock ship ID for demonstration
      const shipId = "SHIP_001";
      const gteSystemId = selectedSystem || "GTE_001";
      
      await createAIWorkOrder(dispatch, shipId, gteSystemId);
      
      // Show success message
      console.log("AI work order created successfully!");
    } catch (error) {
      console.error("Failed to create AI work order:", error);
    }
  }, [dispatch, selectedSystem]);

  const getStatusColor = (status: SensorStatus) => {
    switch (status) {
      case "normal":
        return "success";
      case "warning":
        return "warning";
      case "critical":
        return "error";
      case "offline":
        return "default";
      case "maintenance":
        return "info";
      default:
        return "default";
    }
  };

  const getStatusIcon = (status: SensorStatus) => {
    switch (status) {
      case "normal":
        return <CheckCircleIcon />;
      case "warning":
        return <WarningIcon />;
      case "critical":
        return <ErrorIcon />;
      case "maintenance":
        return <BuildIcon />;
      default:
        return null;
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case "increasing":
        return <TrendingUpIcon color="error" />;
      case "decreasing":
        return <TrendingDownIcon color="success" />;
      case "stable":
        return <TrendingFlatIcon color="info" />;
      default:
        return null;
    }
  };

  // Generate chart data for selected sensor
  const chartData = useMemo(() => {
    if (!selectedSensor) return null;

    const historicalData = sensorDataService.getHistoricalData(selectedSensor, 24);
    const sensor = sensorData.find(s => s.sensorId === selectedSensor);
    
    if (!sensor || historicalData.length === 0) return null;

    return {
      labels: historicalData.map((_, index) => {
        const date = new Date(Date.now() - (23 - index) * 60 * 60 * 1000);
        return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
      }),
      datasets: [
        {
          label: `${sensor.sensorName} (${sensor.unit})`,
          data: historicalData.map(d => d.value),
          borderColor: sensor.status === "critical" ? "#f44336" : 
                      sensor.status === "warning" ? "#ff9800" : "#4caf50",
          backgroundColor: sensor.status === "critical" ? "rgba(244, 67, 54, 0.1)" : 
                          sensor.status === "warning" ? "rgba(255, 152, 0, 0.1)" : "rgba(76, 175, 80, 0.1)",
          fill: true,
          tension: 0.4,
        },
      ],
    };
  }, [selectedSensor, sensorData]);

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "top" as const,
      },
      title: {
        display: true,
        text: "Sensor Data Over Time (24 Hours)",
      },
    },
    scales: {
      y: {
        beginAtZero: false,
        grid: {
          color: "rgba(0,0,0,0.1)",
        },
      },
      x: {
        grid: {
          color: "rgba(0,0,0,0.1)",
        },
      },
    },
  };

  if (loading) {
    return (
      <Box sx={{ p: 3 }}>
        <LinearProgress />
        <Typography variant="h6" sx={{ mt: 2 }}>
          Loading sensor data...
        </Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
        <Button onClick={onClose} variant="outlined">
          Close
        </Button>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3, height: "100vh", overflow: "auto" }}>
      {/* Header */}
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3 }}>
        <Box>
          <Typography variant="h4" component="h1" sx={{ fontWeight: 700 }}>
            Work Order Evidence Package
          </Typography>
          {workOrderInfo && (
            <Typography variant="h6" color="primary" sx={{ mt: 1 }}>
              Work Order #{workOrderInfo.wo} - {workOrderInfo.ship}
            </Typography>
          )}
        </Box>
        <Box sx={{ display: "flex", gap: 1 }}>
          <Tooltip title="Refresh Data">
            <IconButton onClick={handleRefresh} color="primary">
              <RefreshIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title="Create AI Work Order">
            <IconButton onClick={handleCreateAIWorkOrder} color="warning">
              <BuildIcon />
            </IconButton>
          </Tooltip>
          {onClose && (
            <Tooltip title="Close">
              <IconButton onClick={onClose} color="secondary">
                <CloseIcon />
              </IconButton>
            </Tooltip>
          )}
        </Box>
      </Box>

      {/* Work Order Summary */}
      {workOrderInfo && (
        <Paper sx={{ p: 2, mb: 3, backgroundColor: "primary.50", border: "1px solid", borderColor: "primary.200" }}>
          <Typography variant="h6" gutterBottom sx={{ color: "primary.main", fontWeight: 600 }}>
            Work Order Summary
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6} md={3}>
              <Typography variant="body2" color="text.secondary">System</Typography>
              <Typography variant="body1" sx={{ fontWeight: 600 }}>{workOrderInfo.gte}</Typography>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Typography variant="body2" color="text.secondary">Failure Mode</Typography>
              <Typography variant="body1" sx={{ fontWeight: 600 }}>{workOrderInfo.fm}</Typography>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Typography variant="body2" color="text.secondary">Priority</Typography>
              <Chip 
                label={workOrderInfo.priority} 
                color={workOrderInfo.priority === "CASREP" ? "error" : workOrderInfo.priority === "Urgent" ? "warning" : "default"}
                size="small"
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Typography variant="body2" color="text.secondary">Status</Typography>
              <Chip 
                label={workOrderInfo.status} 
                color={workOrderInfo.status === "In Progress" ? "primary" : "default"}
                size="small"
              />
            </Grid>
            <Grid item xs={12}>
              <Typography variant="body2" color="text.secondary">Symptoms</Typography>
              <Typography variant="body1" sx={{ fontWeight: 600 }}>{workOrderInfo.symptoms}</Typography>
            </Grid>
            <Grid item xs={12}>
              <Typography variant="body2" color="text.secondary">Recommended Action</Typography>
              <Typography variant="body1" sx={{ fontWeight: 600 }}>{workOrderInfo.recommendedAction}</Typography>
            </Grid>
          </Grid>
        </Paper>
      )}

      {/* Evidence Package Controls */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Typography variant="h6" gutterBottom sx={{ color: "primary.main", fontWeight: 600 }}>
          Sensor Evidence Analysis
        </Typography>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} sm={4}>
            <FormControl fullWidth>
              <InputLabel>System</InputLabel>
              <Select
                value={selectedSystem}
                label="System"
                onChange={(e) => setSelectedSystem(e.target.value)}
              >
                {systems.map((system) => (
                  <MenuItem key={system.id} value={system.id}>
                    {system.name} - {system.location}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={4}>
            <FormControl fullWidth>
              <InputLabel>Sensor</InputLabel>
              <Select
                value={selectedSensor}
                label="Sensor"
                onChange={(e) => setSelectedSensor(e.target.value)}
              >
                {sensorData.map((sensor) => (
                  <MenuItem key={sensor.sensorId} value={sensor.sensorId}>
                    {sensor.sensorName}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={4}>
            <FormControl fullWidth>
              <InputLabel>Analysis Period</InputLabel>
              <Select
                value={timeRange}
                label="Analysis Period"
                onChange={(e) => setTimeRange(e.target.value)}
              >
                <MenuItem value="24h">Last 24 Hours</MenuItem>
                <MenuItem value="7d">Last 7 Days</MenuItem>
                <MenuItem value="30d">Last 30 Days</MenuItem>
                <MenuItem value="90d">Last 90 Days</MenuItem>
              </Select>
            </FormControl>
          </Grid>
        </Grid>
      </Paper>

      {/* System Overview */}
      {selectedSystem && (
        <Paper sx={{ p: 2, mb: 3 }}>
          <Typography variant="h6" gutterBottom sx={{ color: "primary.main", fontWeight: 600 }}>
            System Overview - Evidence Context
          </Typography>
          <Grid container spacing={2}>
            {systems
              .filter((system) => system.id === selectedSystem)
              .map((system) => (
                <Grid item xs={12} key={system.id}>
                  <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <Box>
                      <Typography variant="h6">{system.name}</Typography>
                      <Typography variant="body2" color="text.secondary">
                        {system.type} - {system.location}
                      </Typography>
                    </Box>
                    <Chip
                      label={system.status.toUpperCase()}
                      color={system.status === "operational" ? "success" : 
                             system.status === "degraded" ? "warning" : "error"}
                      variant="outlined"
                    />
                  </Box>
                </Grid>
              ))}
          </Grid>
        </Paper>
      )}

      {/* Sensor Grid */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        {sensorData.map((sensor) => (
          <Grid item xs={12} sm={6} md={4} key={sensor.sensorId}>
            <Card 
              sx={{ 
                cursor: "pointer",
                border: selectedSensor === sensor.sensorId ? 2 : 1,
                borderColor: selectedSensor === sensor.sensorId ? "primary.main" : "divider",
                "&:hover": { boxShadow: 4 }
              }}
              onClick={() => setSelectedSensor(sensor.sensorId)}
            >
              <CardContent>
                <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", mb: 1 }}>
                  <Typography variant="h6" component="div" sx={{ fontSize: "1rem" }}>
                    {sensor.sensorName}
                  </Typography>
                  <Chip
                    icon={getStatusIcon(sensor.status)}
                    label={sensor.status}
                    color={getStatusColor(sensor.status)}
                    size="small"
                  />
                </Box>
                <Typography variant="h4" component="div" sx={{ fontWeight: 700, mb: 1 }}>
                  {sensor.value} {sensor.unit}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {sensor.sensorId} • {sensor.location}
                </Typography>
                <Typography variant="caption" display="block" sx={{ mt: 1 }}>
                  Last updated: {sensor.timestamp.toLocaleTimeString()}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Analytics and Chart */}
      {selectedSensor && analytics && (
        <>
          {/* Analytics Summary */}
          <Paper sx={{ p: 2, mb: 3 }}>
            <Typography variant="h6" gutterBottom sx={{ color: "primary.main", fontWeight: 600 }}>
              Evidence Analysis Summary
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={3}>
                <Box sx={{ textAlign: "center" }}>
                  <Typography variant="h4" color="primary" sx={{ fontWeight: 700 }}>
                    {analytics.averageValue}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Average Value
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={12} sm={3}>
                <Box sx={{ textAlign: "center" }}>
                  <Typography variant="h4" color="success.main" sx={{ fontWeight: 700 }}>
                    {analytics.minValue}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Minimum
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={12} sm={3}>
                <Box sx={{ textAlign: "center" }}>
                  <Typography variant="h4" color="error.main" sx={{ fontWeight: 700 }}>
                    {analytics.maxValue}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Maximum
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={12} sm={3}>
                <Box sx={{ textAlign: "center" }}>
                  <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", mb: 1 }}>
                    {getTrendIcon(analytics.trend)}
                    <Typography variant="h4" sx={{ fontWeight: 700, ml: 1 }}>
                      {analytics.trend}
                    </Typography>
                  </Box>
                  <Typography variant="body2" color="text.secondary">
                    Trend
                  </Typography>
                </Box>
              </Grid>
            </Grid>
            <Divider sx={{ my: 2 }} />
            <Grid container spacing={2}>
              <Grid item xs={12} sm={4}>
                <Box sx={{ textAlign: "center" }}>
                  <Typography variant="h5" color="warning.main" sx={{ fontWeight: 700 }}>
                    {analytics.anomalies}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Anomalies Detected
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={12} sm={4}>
                <Box sx={{ textAlign: "center" }}>
                  <Typography variant="h5" color="info.main" sx={{ fontWeight: 700 }}>
                    {analytics.efficiency}%
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    System Efficiency
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={12} sm={4}>
                <Box sx={{ textAlign: "center" }}>
                  <Typography variant="h5" color="text.primary" sx={{ fontWeight: 700 }}>
                    {timeRange}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Analysis Period
                  </Typography>
                </Box>
              </Grid>
            </Grid>
          </Paper>

          {/* Chart */}
          {chartData && (
            <Paper sx={{ p: 2, height: 400 }}>
              <Typography variant="h6" gutterBottom sx={{ color: "primary.main", fontWeight: 600 }}>
                Sensor Data Timeline - Evidence Package
              </Typography>
              <Line data={chartData} options={chartOptions} />
            </Paper>
          )}
        </>
      )}
    </Box>
  );
};

export default SensorAnalyzer;
