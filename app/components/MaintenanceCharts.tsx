import React, { useState, useEffect } from "react";
import { Card, CardContent, Typography, Box } from "@mui/material";
import LoadingSpinner from "./LoadingSpinner";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  ResponsiveContainer,
} from "recharts";

// Mock data for charts
const workOrdersByStatus = [
  { name: "Submitted", value: 12, color: "#FF3621" }, // Databricks Orange
  { name: "In Progress", value: 8, color: "#FFC107" },
  { name: "Completed", value: 25, color: "#4CAF50" },
  { name: "On Hold", value: 3, color: "#FF9800" },
  { name: "Cancelled", value: 2, color: "#F44336" },
];

const workOrdersByPriority = [
  { name: "Routine", value: 20, color: "#1B3139" }, // Databricks Teal
  { name: "Priority", value: 10, color: "#2C646E" }, // Myrtle Green
  { name: "CASREP", value: 5, color: "#FF3621" }, // Databricks Orange
];

const maintenanceTrends = [
  { month: "Jan", predicted: 30, actual: 25 },
  { month: "Feb", predicted: 35, actual: 32 },
  { month: "Mar", predicted: 40, actual: 38 },
  { month: "Apr", predicted: 45, actual: 42 },
  { month: "May", predicted: 50, actual: 51 },
];

const shipReadiness = [
  { name: "USS Enterprise", operational: 90, maintenance: 10 },
  { name: "USS Voyager", operational: 85, maintenance: 15 },
  { name: "USS Defiant", operational: 95, maintenance: 5 },
  { name: "USS Discovery", operational: 80, maintenance: 20 },
];

export default function MaintenanceCharts() {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate loading time for charts
    const timer = setTimeout(() => {
      setLoading(false);
    }, 800);

    return () => clearTimeout(timer);
  }, []);

  if (loading) {
    return (
      <LoadingSpinner
        loading={true}
        message="Loading maintenance analytics..."
        minHeight={400}
      />
    );
  }

  return (
    <Box sx={{ flexGrow: 1, mt: 3 }}>
      <Typography variant="h5" gutterBottom sx={{ mb: 3 }}>
        Maintenance Analytics
      </Typography>
      <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
        {/* Work Orders by Status */}
        <Box
          sx={{
            display: "flex",
            flexDirection: { xs: "column", md: "row" },
            gap: 3,
          }}
        >
          <Box sx={{ flex: 1 }}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Work Orders by Status
                </Typography>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={workOrdersByStatus}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      outerRadius={100}
                      fill="#1B3139"
                      dataKey="value"
                      label={(props: { name: string; percent: number }) =>
                        `${props.name} ${(props.percent * 100).toFixed(0)}%`
                      }
                    >
                      {workOrdersByStatus.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </Box>

          {/* Work Orders by Priority */}
          <Box sx={{ flex: 1 }}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Work Orders by Priority
                </Typography>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={workOrdersByPriority}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="value" fill="#FF3621" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </Box>
        </Box>

        {/* Maintenance Trends */}
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
                  Predictive vs Actual Maintenance
                </Typography>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={maintenanceTrends}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Line
                      type="monotone"
                      dataKey="predicted"
                      stroke="#1B3139"
                      name="Predicted"
                    />
                    <Line
                      type="monotone"
                      dataKey="actual"
                      stroke="#2C646E"
                      name="Actual"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </Box>

          {/* Ship Readiness */}
          <Box sx={{ flex: 1 }}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Fleet Readiness Status
                </Typography>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart layout="vertical" data={shipReadiness}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" />
                    <YAxis type="category" dataKey="name" />
                    <Tooltip />
                    <Bar
                      dataKey="operational"
                      fill="#4CAF50"
                      name="Operational"
                      stackId="a"
                    />
                    <Bar
                      dataKey="maintenance"
                      fill="#F44336"
                      name="Maintenance"
                      stackId="a"
                    />
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
