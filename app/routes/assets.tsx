import {
  Card,
  CardContent,
  Typography,
  Box,
  Grid,
  Chip,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  LinearProgress,
  IconButton,
  Tooltip,
  Badge,
} from "@mui/material";
import {
  DirectionsBoat,
  Build,
  Warning,
  CheckCircle,
  Schedule,
  Visibility,
  Edit,
  History,
  TrendingUp,
  LocationOn,
  Speed,
  BatteryAlert,
} from "@mui/icons-material";
import type { Route } from "./+types/home";
import { useState } from "react";

export function meta(_args: Route.MetaArgs) {
  return [
    { title: "Asset Management" },
    { name: "description", content: "Navy PDM Asset Management System" },
  ];
}

// Mock asset data for demonstration
const mockAssets = [
  {
    id: "DDG-51-001",
    name: "USS Arleigh Burke",
    type: "Destroyer",
    class: "Arleigh Burke",
    status: "Operational",
    location: "Norfolk, VA",
    lastMaintenance: "2024-01-15",
    nextMaintenance: "2024-04-15",
    operationalHours: 2847,
    readinessScore: 92,
    criticalIssues: 0,
    maintenanceCost: 1250000,
    fuelEfficiency: 85,
    systems: [
      { name: "Propulsion", status: "Good", lastCheck: "2024-01-10" },
      { name: "Navigation", status: "Good", lastCheck: "2024-01-12" },
      { name: "Combat Systems", status: "Good", lastCheck: "2024-01-08" },
      { name: "Communications", status: "Warning", lastCheck: "2024-01-05" },
    ],
  },
  {
    id: "CVN-78-001",
    name: "USS Gerald R. Ford",
    type: "Aircraft Carrier",
    class: "Gerald R. Ford",
    status: "Maintenance",
    location: "Newport News, VA",
    lastMaintenance: "2024-01-20",
    nextMaintenance: "2024-02-20",
    operationalHours: 1256,
    readinessScore: 78,
    criticalIssues: 2,
    maintenanceCost: 2500000,
    fuelEfficiency: 72,
    systems: [
      { name: "Nuclear Reactor", status: "Good", lastCheck: "2024-01-18" },
      { name: "Flight Deck", status: "Warning", lastCheck: "2024-01-15" },
      { name: "Catapult System", status: "Critical", lastCheck: "2024-01-12" },
      { name: "Radar Systems", status: "Good", lastCheck: "2024-01-16" },
    ],
  },
  {
    id: "SSN-774-001",
    name: "USS Virginia",
    type: "Submarine",
    class: "Virginia",
    status: "Operational",
    location: "Groton, CT",
    lastMaintenance: "2024-01-08",
    nextMaintenance: "2024-07-08",
    operationalHours: 3421,
    readinessScore: 96,
    criticalIssues: 0,
    maintenanceCost: 1800000,
    fuelEfficiency: 94,
    systems: [
      { name: "Nuclear Reactor", status: "Good", lastCheck: "2024-01-06" },
      { name: "Sonar Array", status: "Good", lastCheck: "2024-01-10" },
      { name: "Propulsion", status: "Good", lastCheck: "2024-01-08" },
      { name: "Life Support", status: "Good", lastCheck: "2024-01-09" },
    ],
  },
  {
    id: "LHD-1-001",
    name: "USS Wasp",
    type: "Amphibious Assault Ship",
    class: "Wasp",
    status: "Deployed",
    location: "Mediterranean Sea",
    lastMaintenance: "2023-12-20",
    nextMaintenance: "2024-03-20",
    operationalHours: 1892,
    readinessScore: 88,
    criticalIssues: 1,
    maintenanceCost: 950000,
    fuelEfficiency: 79,
    systems: [
      { name: "Propulsion", status: "Good", lastCheck: "2023-12-18" },
      { name: "Well Deck", status: "Good", lastCheck: "2023-12-15" },
      { name: "Flight Deck", status: "Warning", lastCheck: "2023-12-12" },
      { name: "Medical Facilities", status: "Good", lastCheck: "2023-12-20" },
    ],
  },
];

export default function Assets() {
  const [selectedAsset, setSelectedAsset] = useState<string | null>(null);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Operational":
        return "success";
      case "Maintenance":
        return "warning";
      case "Deployed":
        return "info";
      case "Critical":
        return "error";
      default:
        return "default";
    }
  };

  const getSystemStatusColor = (status: string) => {
    switch (status) {
      case "Good":
        return "success";
      case "Warning":
        return "warning";
      case "Critical":
        return "error";
      default:
        return "default";
    }
  };

  const getReadinessColor = (score: number) => {
    if (score >= 90) return "success";
    if (score >= 75) return "warning";
    return "error";
  };

  const totalAssets = mockAssets.length;
  const operationalAssets = mockAssets.filter(
    (a) => a.status === "Operational",
  ).length;
  const maintenanceAssets = mockAssets.filter(
    (a) => a.status === "Maintenance",
  ).length;
  const deployedAssets = mockAssets.filter(
    (a) => a.status === "Deployed",
  ).length;
  const totalCriticalIssues = mockAssets.reduce(
    (sum, a) => sum + a.criticalIssues,
    0,
  );

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box
        sx={{
          mb: 3,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <Typography variant="h4" component="h1">
          Asset Management
        </Typography>
        <Box sx={{ display: "flex", gap: 2 }}>
          <Button variant="outlined" startIcon={<History />}>
            Maintenance History
          </Button>
          <Button variant="contained" startIcon={<Build />}>
            Schedule Maintenance
          </Button>
        </Box>
      </Box>

      {/* Summary Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                <DirectionsBoat color="primary" />
                <Box>
                  <Typography variant="h6">Total Assets</Typography>
                  <Typography variant="h4">{totalAssets}</Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                <CheckCircle color="success" />
                <Box>
                  <Typography variant="h6">Operational</Typography>
                  <Typography variant="h4">{operationalAssets}</Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                <Build color="warning" />
                <Box>
                  <Typography variant="h6">In Maintenance</Typography>
                  <Typography variant="h4">{maintenanceAssets}</Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                <Warning color="error" />
                <Box>
                  <Typography variant="h6">Critical Issues</Typography>
                  <Typography variant="h4">{totalCriticalIssues}</Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Asset Overview Table */}
      <Typography variant="h5" sx={{ mb: 2 }}>
        Fleet Overview
      </Typography>

      <TableContainer component={Paper} sx={{ mb: 4 }}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Asset</TableCell>
              <TableCell>Type</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Location</TableCell>
              <TableCell>Readiness</TableCell>
              <TableCell>Next Maintenance</TableCell>
              <TableCell>Critical Issues</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {mockAssets.map((asset) => (
              <TableRow key={asset.id} hover>
                <TableCell>
                  <Box>
                    <Typography variant="subtitle2" fontWeight="bold">
                      {asset.name}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {asset.id}
                    </Typography>
                  </Box>
                </TableCell>
                <TableCell>
                  <Box>
                    <Typography variant="body2">{asset.type}</Typography>
                    <Typography variant="caption" color="text.secondary">
                      {asset.class}
                    </Typography>
                  </Box>
                </TableCell>
                <TableCell>
                  <Chip
                    label={asset.status}
                    color={getStatusColor(asset.status) as any}
                    size="small"
                  />
                </TableCell>
                <TableCell>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <LocationOn fontSize="small" color="action" />
                    <Typography variant="body2">{asset.location}</Typography>
                  </Box>
                </TableCell>
                <TableCell>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <Box sx={{ width: "100%", mr: 1 }}>
                      <LinearProgress
                        variant="determinate"
                        value={asset.readinessScore}
                        color={getReadinessColor(asset.readinessScore) as any}
                        sx={{ height: 8, borderRadius: 4 }}
                      />
                    </Box>
                    <Typography variant="body2" fontWeight="bold">
                      {asset.readinessScore}%
                    </Typography>
                  </Box>
                </TableCell>
                <TableCell>
                  <Typography variant="body2">
                    {asset.nextMaintenance}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Badge badgeContent={asset.criticalIssues} color="error">
                    <Warning
                      color={asset.criticalIssues > 0 ? "error" : "disabled"}
                    />
                  </Badge>
                </TableCell>
                <TableCell>
                  <Box sx={{ display: "flex", gap: 1 }}>
                    <Tooltip title="View Details">
                      <IconButton
                        size="small"
                        onClick={() => setSelectedAsset(asset.id)}
                      >
                        <Visibility />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Edit Asset">
                      <IconButton size="small">
                        <Edit />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Maintenance History">
                      <IconButton size="small">
                        <History />
                      </IconButton>
                    </Tooltip>
                  </Box>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Asset Details Cards */}
      <Typography variant="h5" sx={{ mb: 2 }}>
        Asset Details
      </Typography>

      <Grid container spacing={3}>
        {mockAssets.map((asset) => (
          <Grid item xs={12} md={6} lg={4} key={asset.id}>
            <Card sx={{ height: "100%" }}>
              <CardContent>
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                    mb: 2,
                  }}
                >
                  <Box>
                    <Typography variant="h6" component="h3">
                      {asset.name}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {asset.id} • {asset.type}
                    </Typography>
                  </Box>
                  <Chip
                    label={asset.status}
                    color={getStatusColor(asset.status) as any}
                    size="small"
                  />
                </Box>

                <Box sx={{ mb: 2 }}>
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      gap: 1,
                      mb: 1,
                    }}
                  >
                    <LocationOn fontSize="small" color="action" />
                    <Typography variant="body2">{asset.location}</Typography>
                  </Box>
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      gap: 1,
                      mb: 1,
                    }}
                  >
                    <Speed fontSize="small" color="action" />
                    <Typography variant="body2">
                      {asset.operationalHours.toLocaleString()} hrs
                    </Typography>
                  </Box>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <BatteryAlert fontSize="small" color="action" />
                    <Typography variant="body2">
                      {asset.fuelEfficiency}% efficiency
                    </Typography>
                  </Box>
                </Box>

                <Box sx={{ mb: 2 }}>
                  <Typography variant="subtitle2" gutterBottom>
                    Readiness Score
                  </Typography>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <Box sx={{ width: "100%", mr: 1 }}>
                      <LinearProgress
                        variant="determinate"
                        value={asset.readinessScore}
                        color={getReadinessColor(asset.readinessScore) as any}
                        sx={{ height: 8, borderRadius: 4 }}
                      />
                    </Box>
                    <Typography variant="body2" fontWeight="bold">
                      {asset.readinessScore}%
                    </Typography>
                  </Box>
                </Box>

                <Box sx={{ mb: 2 }}>
                  <Typography variant="subtitle2" gutterBottom>
                    System Status
                  </Typography>
                  <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
                    {asset.systems.map((system, index) => (
                      <Chip
                        key={index}
                        label={system.name}
                        color={getSystemStatusColor(system.status) as any}
                        size="small"
                        variant="outlined"
                      />
                    ))}
                  </Box>
                </Box>

                <Box sx={{ display: "flex", gap: 1 }}>
                  <Button variant="outlined" size="small" fullWidth>
                    View Details
                  </Button>
                  <Button variant="contained" size="small" fullWidth>
                    Schedule Work
                  </Button>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
}
