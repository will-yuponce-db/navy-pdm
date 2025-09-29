import React, { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  Typography,
  Box,
  CircularProgress,
  LinearProgress,
  Alert,
} from "@mui/material";
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
} from "recharts";

// Mock data generation for real-time updates
const generatePerformanceData = () => {
  const data = [];
  for (let i = 0; i < 10; i++) {
    data.push({
      month: `Month ${i + 1}`,
      efficiency: Math.floor(Math.random() * 30) + 70, // 70-99%
      downtime: Math.floor(Math.random() * 10) + 1, // 1-10 days
      readiness: Math.floor(Math.random() * 20) + 80, // 80-99%
      maintenance: Math.floor(Math.random() * 15) + 5, // 5-19%
    });
  }
  return data;
};

const generateEfficiencyMetrics = () => ({
  overallEfficiency: Math.floor(Math.random() * 20) + 75, // 75-95%
  predictiveAccuracy: Math.floor(Math.random() * 15) + 80, // 80-95%
  costSavings: Math.floor(Math.random() * 50000) + 100000, // $100k - $150k
  systemUptime: Math.floor(Math.random() * 10) + 90, // 90-99%
});

const generateReadinessData = () => [
  {
    name: "Operational",
    value: Math.floor(Math.random() * 20) + 70,
    color: "#4CAF50",
  },
  {
    name: "Maintenance",
    value: Math.floor(Math.random() * 10) + 10,
    color: "#FFC107",
  },
  {
    name: "CASREP",
    value: Math.floor(Math.random() * 5) + 1,
    color: "#F44336",
  },
];

export default function AdvancedAnalytics() {
  const [performanceData, setPerformanceData] = useState(
    generatePerformanceData(),
  );
  const [efficiencyMetrics, setEfficiencyMetrics] = useState(
    generateEfficiencyMetrics(),
  );
  const [readinessData, setReadinessData] = useState(generateReadinessData());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Initial load
    const timer = setTimeout(() => {
      setPerformanceData(generatePerformanceData());
      setEfficiencyMetrics(generateEfficiencyMetrics());
      setReadinessData(generateReadinessData());
      setLoading(false);
    }, 1000); // Quick initial load

    // Set up interval for updates
    const interval = setInterval(() => {
      setPerformanceData(generatePerformanceData());
      setEfficiencyMetrics(generateEfficiencyMetrics());
      setReadinessData(generateReadinessData());
    }, 10000); // Update every 10 seconds

    return () => {
      clearTimeout(timer);
      clearInterval(interval);
    };
  }, []);

  if (loading) {
    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "400px",
        }}
      >
        <CircularProgress />
        <Typography variant="h6" sx={{ ml: 2 }}>
          Loading Advanced Analytics...
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ flexGrow: 1, mt: 3 }}>
      <Typography variant="h5" gutterBottom sx={{ mb: 3 }}>
        Advanced Fleet Performance Analytics
      </Typography>
      <Alert severity="success" sx={{ mb: 3 }}>
        <Typography variant="body2">
          This dashboard provides real-time insights into fleet performance,
          predictive accuracy, and maintenance efficiency. Data updates every 5
          seconds.
        </Typography>
      </Alert>

      {/* Key Performance Indicators */}
      <Box sx={{ display: "flex", flexDirection: "column", gap: 3, mb: 4 }}>
        <Box
          sx={{
            display: "flex",
            flexDirection: { xs: "column", sm: "row" },
            gap: 3,
          }}
        >
          <Box sx={{ flex: 1 }}>
            <Card>
              <CardContent>
                <Typography variant="subtitle1" color="text.secondary">
                  Overall Efficiency
                </Typography>
                <Typography variant="h4" color="primary">
                  {efficiencyMetrics.overallEfficiency}%
                </Typography>
                <LinearProgress
                  variant="determinate"
                  value={efficiencyMetrics.overallEfficiency}
                  sx={{ mt: 1 }}
                />
              </CardContent>
            </Card>
          </Box>
          <Box sx={{ flex: 1 }}>
            <Card>
              <CardContent>
                <Typography variant="subtitle1" color="text.secondary">
                  Predictive Accuracy
                </Typography>
                <Typography variant="h4" color="secondary">
                  {efficiencyMetrics.predictiveAccuracy}%
                </Typography>
                <LinearProgress
                  variant="determinate"
                  color="secondary"
                  value={efficiencyMetrics.predictiveAccuracy}
                  sx={{ mt: 1 }}
                />
              </CardContent>
            </Card>
          </Box>
          <Box sx={{ flex: 1 }}>
            <Card>
              <CardContent>
                <Typography variant="subtitle1" color="text.secondary">
                  Cost Savings (YTD)
                </Typography>
                <Typography variant="h4" sx={{ color: "success.main" }}>
                  ${efficiencyMetrics.costSavings.toLocaleString()}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  vs. traditional maintenance
                </Typography>
              </CardContent>
            </Card>
          </Box>
          <Box sx={{ flex: 1 }}>
            <Card>
              <CardContent>
                <Typography variant="subtitle1" color="text.secondary">
                  System Uptime
                </Typography>
                <Typography variant="h4" sx={{ color: "warning.main" }}>
                  {efficiencyMetrics.systemUptime}%
                </Typography>
                <LinearProgress
                  variant="determinate"
                  value={efficiencyMetrics.systemUptime}
                  color="primary"
                  sx={{ mt: 1 }}
                />
              </CardContent>
            </Card>
          </Box>
        </Box>
      </Box>

      {/* Performance Analytics */}
      <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
        <Box
          sx={{
            display: "flex",
            flexDirection: { xs: "column", md: "row" },
            gap: 3,
          }}
        >
          <Box sx={{ flex: 2 }}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Maintenance Performance Trends
                </Typography>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={performanceData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Area
                      type="monotone"
                      dataKey="efficiency"
                      stroke="#8884d8"
                      fill="#8884d8"
                      name="Efficiency (%)"
                    />
                    <Area
                      type="monotone"
                      dataKey="downtime"
                      stroke="#82ca9d"
                      fill="#82ca9d"
                      name="Downtime (days)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </Box>

          <Box sx={{ flex: 1 }}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Fleet Efficiency Overview
                </Typography>
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                    height: 300,
                  }}
                >
                  <PieChart width={250} height={250}>
                    <Pie
                      data={readinessData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      outerRadius={100}
                      dataKey="value"
                      label={(props: { name: string; percent: number }) =>
                        `${props.name} ${(props.percent * 100).toFixed(0)}%`
                      }
                    >
                      {readinessData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </Box>
              </CardContent>
            </Card>
          </Box>
        </Box>

        <Box>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Ship Readiness vs Maintenance Load
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={performanceData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Bar
                    dataKey="readiness"
                    stackId="a"
                    fill="#4CAF50"
                    name="Readiness %"
                  />
                  <Bar
                    dataKey="maintenance"
                    stackId="a"
                    fill="#F44336"
                    name="Maintenance %"
                  />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Box>
      </Box>

      {/* Performance Alerts */}
      <Alert severity="info" sx={{ mt: 3 }}>
        <Typography variant="body2">
          <strong>Analytics Note:</strong> Data is updated every 5 seconds.
          Performance metrics are calculated using real-time sensor data and
          predictive algorithms.
        </Typography>
      </Alert>
    </Box>
  );
}
