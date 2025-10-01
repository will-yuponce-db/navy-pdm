import { Grid, Card, CardContent, Typography, Box, Chip } from "@mui/material";
import { 
  Dashboard, 
  CheckBox, 
  Inventory2, 
  AccountBalance, 
  Warning, 
  Analytics, 
  Schedule, 
  Assessment 
} from "@mui/icons-material";

export function meta() {
  return [
    { title: "SPO Dashboard" },
    { name: "description", content: "Strategic Planning Office Dashboard" },
  ];
}

export default function SPODashboard() {
  // Mock data for SPO dashboard
  const data = {
    fleetReadiness: 87,
    budgetUtilization: 72,
    riskLevel: "Medium",
    maintenanceEfficiency: 94,
    assetAvailability: 91,
    costSavings: 1250000,
    criticalAlerts: 3,
    upcomingMaintenance: 12
  };

  const metrics = [
    {
      title: "Fleet Readiness",
      value: `${data.fleetReadiness}%`,
      icon: <CheckBox />,
      color: data.fleetReadiness >= 85 ? "success" : "warning"
    },
    {
      title: "Budget Utilization",
      value: `${data.budgetUtilization}%`,
      icon: <AccountBalance />,
      color: data.budgetUtilization <= 80 ? "success" : "warning"
    },
    {
      title: "Maintenance Efficiency",
      value: `${data.maintenanceEfficiency}%`,
      icon: <Schedule />,
      color: "success"
    },
    {
      title: "Asset Availability",
      value: `${data.assetAvailability}%`,
      icon: <Inventory2 />,
      color: "success"
    }
  ];

  const alerts = [
    {
      type: "warning",
      message: "3 assets require immediate attention",
      icon: <Warning />
    },
    {
      type: "info",
      message: "12 maintenance tasks scheduled this week",
      icon: <Schedule />
    },
    {
      type: "success",
      message: `$${data.costSavings.toLocaleString()} saved this quarter`,
      icon: <Analytics />
    }
  ];

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <Dashboard />
        Strategic Planning Office Dashboard
      </Typography>
      
      <Typography variant="subtitle1" color="text.secondary" sx={{ mb: 3 }}>
        High-level strategic overview and fleet management insights
      </Typography>

      {/* Key Metrics */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {metrics.map((metric, index) => (
          <Grid item xs={12} sm={6} md={3} key={index}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Box>
                    <Typography variant="h6" component="div">
                      {metric.value}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {metric.title}
                    </Typography>
                  </Box>
                  <Box sx={{ color: `${metric.color}.main` }}>
                    {metric.icon}
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Risk Assessment */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Risk Assessment
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Chip 
                  label={data.riskLevel} 
                  color={data.riskLevel === "Low" ? "success" : data.riskLevel === "Medium" ? "warning" : "error"}
                  variant="outlined"
                />
                <Typography variant="body2" color="text.secondary">
                  Current fleet risk level
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Cost Savings
              </Typography>
              <Typography variant="h4" color="success.main">
                ${data.costSavings.toLocaleString()}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Achieved this quarter through optimized maintenance
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Alerts and Notifications */}
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Strategic Alerts
          </Typography>
          {alerts.map((alert, index) => (
            <Box key={index} sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
              <Box sx={{ color: `${alert.type}.main` }}>
                {alert.icon}
              </Box>
              <Typography variant="body2">
                {alert.message}
              </Typography>
            </Box>
          ))}
        </CardContent>
      </Card>
    </Box>
  );
}
