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
import type {
  SensorAnalyzerProps,
  SensorData,
  SensorSystem,
  SensorAnalytics,
  SensorStatus,
  WorkOrder,
  DatabricksSensorData,
} from "../types";
import { databricksApi } from "../services/api";
import { createAIWorkOrder } from "../utils/aiWorkOrderGenerator";
import { useAppDispatch } from "../redux/hooks";
import {
  mapDatabricksSensorDataArrayToSensorDataArray,
  groupSensorDataBySensorName,
} from "../utils/databricksMapper";

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  ChartTooltip,
  Legend,
  Filler,
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
  const [timeRange, setTimeRange] = useState<string>("24h");
  const [analytics, setAnalytics] = useState<SensorAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [workOrderInfo, setWorkOrderInfo] = useState<WorkOrder | null>(null);
  const [dataSource, setDataSource] = useState<string>("Unknown");

  // Load initial data
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Load work order information if workOrderId is provided
        if (workOrderId) {
          try {
            // Try to fetch from Databricks first
            const aiWorkOrderResponse = await databricksApi.getAIWorkOrderById(
              workOrderId,
            );

            if (aiWorkOrderResponse.success && aiWorkOrderResponse.data) {
              // Map the Databricks work order to the WorkOrder type
              const databricksWO = aiWorkOrderResponse.data as any;
              const workOrder: WorkOrder = {
                wo: databricksWO.work_order || workOrderId,
                shipId: String(databricksWO.designator_id || ""),
                gteSystemId: databricksWO.turbine_id,
                fm: `${databricksWO.prediction || "Unknown"} - ${databricksWO.maintenance_type || ""}`,
                priority: databricksWO.priority || "Routine",
                status: "Pending approval",
                eta: databricksWO.ttr || 0,
                symptoms: `AI detected ${databricksWO.prediction || "anomaly"} requiring ${databricksWO.maintenance_type || "maintenance"}. ${databricksWO.operable ? "Currently Operable" : "Currently Non-Operable"}. Average energy output: ${databricksWO.avg_energy?.toFixed(4) || "N/A"}.`,
                recommendedAction: databricksWO.maintenance_type || "Inspect system",
                partsRequired: databricksWO.parts_required,
                slaCategory: databricksWO.maintenance_type,
                creationSource: "ai",
                createdAt: new Date(databricksWO.hourly_timestamp),
                ship: {
                  id: String(databricksWO.designator_id || ""),
                  name: databricksWO.designator || "Unknown Ship",
                  designation: databricksWO.designator?.match(/\(([^)]+)\)/)?.[1] || "",
                  class: "DDG",
                  homeport: databricksWO.home_location || "Unknown",
                  status: databricksWO.operable ? "Active" : "Maintenance",
                },
              };
              setWorkOrderInfo(workOrder);

              // Fetch sensor data for the turbine
              if (databricksWO.turbine_id) {
                const turbineId = databricksWO.turbine_id;
                setSelectedSystem(turbineId);

                // Calculate time range: 1 day back from work order creation
                const workOrderTime = new Date(databricksWO.hourly_timestamp).getTime() / 1000;
                const oneDayInSeconds = 24 * 60 * 60;
                const startTime = Math.floor(workOrderTime - oneDayInSeconds);
                const endTime = Math.floor(workOrderTime);

                const sensorResponse = await databricksApi.getSensorData(
                  turbineId,
                  {
                    startTime,
                    endTime,
                    limit: 1000,
                  },
                );

                if (sensorResponse.success && sensorResponse.data) {
                  // Map Databricks sensor data to SensorData array
                  const mappedSensorData = mapDatabricksSensorDataArrayToSensorDataArray(
                    sensorResponse.data as DatabricksSensorData[],
                  );
                  setSensorData(mappedSensorData);
                  setDataSource(sensorResponse.source || "Unknown");

                  // Set initial selected sensor if not already set
                  if (!selectedSensor && mappedSensorData.length > 0) {
                    // Find the abnormal sensor if available
                    const abnormalSensor = mappedSensorData.find(
                      (s) => s.status === "critical",
                    );
                    setSelectedSensor(
                      abnormalSensor?.sensorId || mappedSensorData[0].sensorId,
                    );
                  }
                }
              }
            }
          } catch (err) {
            console.error("Error fetching AI work order:", err);
            setError(`Failed to load work order: ${err instanceof Error ? err.message : "Unknown error"}`);
          }
        }
      } catch (err) {
        setError("Failed to load sensor data");
        console.error("Error loading sensor data:", err);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [workOrderId]);

  // Calculate analytics when sensor or sensor data changes
  useEffect(() => {
    if (selectedSensor && sensorData.length > 0) {
      try {
        const sensorReadings = sensorData.filter(
          (s) => s.sensorId === selectedSensor,
        );
        if (sensorReadings.length > 0) {
          const values = sensorReadings.map((s) => s.value);
          const avgValue = values.reduce((a, b) => a + b, 0) / values.length;
          const minValue = Math.min(...values);
          const maxValue = Math.max(...values);

          // Calculate trend (simple linear regression slope)
          let trend = "stable";
          if (values.length > 2) {
            const firstHalf = values.slice(0, Math.floor(values.length / 2));
            const secondHalf = values.slice(Math.floor(values.length / 2));
            const firstAvg = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length;
            const secondAvg = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length;
            const changePercent = ((secondAvg - firstAvg) / firstAvg) * 100;
            if (changePercent > 5) trend = "increasing";
            else if (changePercent < -5) trend = "decreasing";
          }

          // Count anomalies (critical status)
          const anomalies = sensorReadings.filter((s) => s.status === "critical" || s.status === "warning").length;

          // Calculate efficiency (inverse of anomaly rate)
          const efficiency = Math.round((1 - anomalies / sensorReadings.length) * 100);

          setAnalytics({
            sensorId: selectedSensor,
            timeRange: timeRange,
            averageValue: parseFloat(avgValue.toFixed(2)),
            minValue: parseFloat(minValue.toFixed(2)),
            maxValue: parseFloat(maxValue.toFixed(2)),
            trend: trend,
            anomalies: anomalies,
            efficiency: efficiency,
          });
        }
      } catch (err) {
        console.error("Error calculating analytics:", err);
      }
    }
  }, [selectedSensor, sensorData, timeRange]);

  const handleRefresh = useCallback(async () => {
    if (workOrderInfo && workOrderInfo.gteSystemId) {
      try {
        setLoading(true);
        const turbineId = workOrderInfo.gteSystemId;

        // Calculate time range: 1 day back from work order creation
        const workOrderTime = workOrderInfo.createdAt
          ? new Date(workOrderInfo.createdAt).getTime() / 1000
          : Date.now() / 1000;
        const oneDayInSeconds = 24 * 60 * 60;
        const startTime = Math.floor(workOrderTime - oneDayInSeconds);
        const endTime = Math.floor(workOrderTime);

        const sensorResponse = await databricksApi.getSensorData(turbineId, {
          startTime,
          endTime,
          limit: 1000,
        });

        if (sensorResponse.success && sensorResponse.data) {
          const mappedSensorData = mapDatabricksSensorDataArrayToSensorDataArray(
            sensorResponse.data as DatabricksSensorData[],
          );
          setSensorData(mappedSensorData);
          setDataSource(sensorResponse.source || "Unknown");
        }
      } catch (err) {
        console.error("Error refreshing sensor data:", err);
      } finally {
        setLoading(false);
      }
    }
  }, [workOrderInfo]);

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
        return undefined;
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
    if (!selectedSensor || sensorData.length === 0) return null;

    // Get all readings for the selected sensor
    const sensorReadings = sensorData
      .filter((s) => s.sensorId === selectedSensor)
      .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());

    if (sensorReadings.length === 0) return null;

    const firstSensor = sensorReadings[0];
    const hasCritical = sensorReadings.some((s) => s.status === "critical");
    const hasWarning = sensorReadings.some((s) => s.status === "warning");

    return {
      labels: sensorReadings.map((reading) => {
        return reading.timestamp.toLocaleTimeString("en-US", {
          month: "short",
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        });
      }),
      datasets: [
        {
          label: `${firstSensor.sensorName} (${firstSensor.unit})`,
          data: sensorReadings.map((d) => d.value),
          borderColor: hasCritical
            ? "#f44336"
            : hasWarning
              ? "#ff9800"
              : "#4caf50",
          backgroundColor: hasCritical
            ? "rgba(244, 67, 54, 0.1)"
            : hasWarning
              ? "rgba(255, 152, 0, 0.1)"
              : "rgba(76, 175, 80, 0.1)",
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
        text: "Sensor Data Timeline (24 Hours Prior to Work Order)",
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
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 3,
        }}
      >
        <Box>
          <Typography variant="h4" component="h1" sx={{ fontWeight: 700 }}>
            Work Order Evidence Package
          </Typography>
          {workOrderInfo && (
            <>
              <Typography variant="h6" color="primary" sx={{ mt: 1 }}>
                Work Order #{workOrderInfo.wo} - {workOrderInfo.ship?.name || "Unknown Ship"}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Data Source: {dataSource}
              </Typography>
            </>
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
        <Paper
          sx={{
            p: 2,
            mb: 3,
            backgroundColor: "primary.50",
            border: "1px solid",
            borderColor: "primary.200",
          }}
        >
          <Typography
            variant="h6"
            gutterBottom
            sx={{ color: "primary.main", fontWeight: 600 }}
          >
            Work Order Summary
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6} md={3}>
              <Typography variant="body2" color="text.secondary">
                System
              </Typography>
              <Typography variant="body1" sx={{ fontWeight: 600 }}>
                {workOrderInfo.gteSystemId || "N/A"}
              </Typography>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Typography variant="body2" color="text.secondary">
                Failure Mode
              </Typography>
              <Typography variant="body1" sx={{ fontWeight: 600 }}>
                {workOrderInfo.fm}
              </Typography>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Typography variant="body2" color="text.secondary">
                Priority
              </Typography>
              <Chip
                label={workOrderInfo.priority}
                color={
                  workOrderInfo.priority === "CASREP"
                    ? "error"
                    : workOrderInfo.priority === "Urgent"
                      ? "warning"
                      : "default"
                }
                size="small"
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Typography variant="body2" color="text.secondary">
                Status
              </Typography>
              <Chip
                label={workOrderInfo.status}
                color={
                  workOrderInfo.status === "In Progress" ? "primary" : "default"
                }
                size="small"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <Typography variant="body2" color="text.secondary">
                Symptoms
              </Typography>
              <Typography variant="body1" sx={{ fontWeight: 600 }}>
                {workOrderInfo.symptoms || "N/A"}
              </Typography>
            </Grid>
            <Grid item xs={12} sm={6}>
              <Typography variant="body2" color="text.secondary">
                Recommended Action
              </Typography>
              <Typography variant="body1" sx={{ fontWeight: 600 }}>
                {workOrderInfo.recommendedAction || "N/A"}
              </Typography>
            </Grid>
            <Grid item xs={12} sm={6}>
              <Typography variant="body2" color="text.secondary">
                Ship
              </Typography>
              <Typography variant="body1" sx={{ fontWeight: 600 }}>
                {workOrderInfo.ship?.name || "Unknown"} - {workOrderInfo.ship?.homeport || "Unknown"}
              </Typography>
            </Grid>
            <Grid item xs={12} sm={6}>
              <Typography variant="body2" color="text.secondary">
                ETA (Days)
              </Typography>
              <Typography variant="body1" sx={{ fontWeight: 600 }}>
                {workOrderInfo.eta || "N/A"}
              </Typography>
            </Grid>
          </Grid>
        </Paper>
      )}

      {/* Evidence Package Controls */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Typography
          variant="h6"
          gutterBottom
          sx={{ color: "primary.main", fontWeight: 600 }}
        >
          Sensor Evidence Analysis
        </Typography>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} sm={4}>
            <FormControl fullWidth>
              <InputLabel>Turbine ID</InputLabel>
              <Select
                value={selectedSystem}
                label="Turbine ID"
                disabled
              >
                <MenuItem value={selectedSystem}>
                  {selectedSystem || "N/A"}
                </MenuItem>
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
                {Array.from(new Set(sensorData.map((sensor) => sensor.sensorId)))
                  .map((sensorId) => {
                    const sensor = sensorData.find((s) => s.sensorId === sensorId);
                    return sensor ? (
                      <MenuItem key={sensorId} value={sensorId}>
                        {sensor.sensorName} ({sensor.sensorType})
                      </MenuItem>
                    ) : null;
                  })}
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
                <MenuItem value="24h">24 Hours (from WO trigger)</MenuItem>
              </Select>
            </FormControl>
          </Grid>
        </Grid>
      </Paper>

      {/* Sensor Grid */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        {Array.from(new Set(sensorData.map((s) => s.sensorId)))
          .map((sensorId) => {
            // Get the latest reading for this sensor
            const sensorReadings = sensorData
              .filter((s) => s.sensorId === sensorId)
              .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
            const latestSensor = sensorReadings[0];

            if (!latestSensor) return null;

            // Count critical and warning readings
            const criticalCount = sensorReadings.filter((s) => s.status === "critical").length;
            const warningCount = sensorReadings.filter((s) => s.status === "warning").length;
            const overallStatus = criticalCount > 0 ? "critical" : warningCount > 0 ? "warning" : "normal";

            return (
              <Grid item xs={12} sm={6} md={4} key={sensorId}>
                <Card
                  sx={{
                    cursor: "pointer",
                    border: selectedSensor === sensorId ? 2 : 1,
                    borderColor:
                      selectedSensor === sensorId
                        ? "primary.main"
                        : "divider",
                    "&:hover": { boxShadow: 4 },
                  }}
                  onClick={() => setSelectedSensor(sensorId)}
                >
                  <CardContent>
                    <Box
                      sx={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "flex-start",
                        mb: 1,
                      }}
                    >
                      <Typography
                        variant="h6"
                        component="div"
                        sx={{ fontSize: "1rem" }}
                      >
                        {latestSensor.sensorName}
                      </Typography>
                      <Chip
                        icon={getStatusIcon(overallStatus)}
                        label={overallStatus}
                        color={getStatusColor(overallStatus)}
                        size="small"
                      />
                    </Box>
                    <Typography
                      variant="h4"
                      component="div"
                      sx={{ fontWeight: 700, mb: 1 }}
                    >
                      {latestSensor.value.toFixed(2)} {latestSensor.unit}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {latestSensor.sensorType} • {sensorReadings.length} readings
                    </Typography>
                    {(criticalCount > 0 || warningCount > 0) && (
                      <Typography variant="caption" display="block" sx={{ mt: 1, color: "error.main" }}>
                        {criticalCount > 0 && `${criticalCount} critical`}
                        {criticalCount > 0 && warningCount > 0 && ", "}
                        {warningCount > 0 && `${warningCount} warning`}
                      </Typography>
                    )}
                    <Typography variant="caption" display="block" sx={{ mt: 1 }}>
                      Latest: {latestSensor.timestamp.toLocaleString()}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            );
          })}
      </Grid>

      {/* Analytics and Chart */}
      {selectedSensor && analytics && (
        <>
          {/* Analytics Summary */}
          <Paper sx={{ p: 2, mb: 3 }}>
            <Typography
              variant="h6"
              gutterBottom
              sx={{ color: "primary.main", fontWeight: 600 }}
            >
              Evidence Analysis Summary
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={3}>
                <Box sx={{ textAlign: "center" }}>
                  <Typography
                    variant="h4"
                    color="primary"
                    sx={{ fontWeight: 700 }}
                  >
                    {analytics.averageValue}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Average Value
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={12} sm={3}>
                <Box sx={{ textAlign: "center" }}>
                  <Typography
                    variant="h4"
                    color="success.main"
                    sx={{ fontWeight: 700 }}
                  >
                    {analytics.minValue}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Minimum
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={12} sm={3}>
                <Box sx={{ textAlign: "center" }}>
                  <Typography
                    variant="h4"
                    color="error.main"
                    sx={{ fontWeight: 700 }}
                  >
                    {analytics.maxValue}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Maximum
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={12} sm={3}>
                <Box sx={{ textAlign: "center" }}>
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      mb: 1,
                    }}
                  >
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
                  <Typography
                    variant="h5"
                    color="warning.main"
                    sx={{ fontWeight: 700 }}
                  >
                    {analytics.anomalies}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Anomalies Detected
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={12} sm={4}>
                <Box sx={{ textAlign: "center" }}>
                  <Typography
                    variant="h5"
                    color="info.main"
                    sx={{ fontWeight: 700 }}
                  >
                    {analytics.efficiency}%
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    System Efficiency
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={12} sm={4}>
                <Box sx={{ textAlign: "center" }}>
                  <Typography
                    variant="h5"
                    color="text.primary"
                    sx={{ fontWeight: 700 }}
                  >
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
              <Typography
                variant="h6"
                gutterBottom
                sx={{ color: "primary.main", fontWeight: 600 }}
              >
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
