import { Grid, Card, CardContent, Typography, Box, Chip, Button } from "@mui/material";
import { 
  Dashboard, 
  Work, 
  Category, 
  Inventory2, 
  Schedule, 
  Description, 
  PhoneAndroid,
  Assignment,
  Build,
  Warning
} from "@mui/icons-material";

export function meta() {
  return [
    { title: "Maintainer Dashboard" },
    { name: "description", content: "Maintainer Dashboard for daily operations" },
  ];
}

export default function MaintainerDashboard() {
  // Mock data for Maintainer dashboard
  const data = {
    assignedWorkOrders: 8,
    completedToday: 3,
    pendingParts: 5,
    scheduledMaintenance: 4,
    urgentTasks: 2,
    efficiency: 92,
    partsNeeded: [
      { part: "Hydraulic Filter", quantity: 2, priority: "High" },
      { part: "Engine Oil", quantity: 5, priority: "Medium" },
      { part: "Brake Pads", quantity: 1, priority: "Low" }
    ],
    recentWorkOrders: [
      { id: "WO-2024-001", asset: "USS Example", task: "Engine Maintenance", status: "In Progress" },
      { id: "WO-2024-002", asset: "USS Test", task: "Hydraulic System Check", status: "Completed" },
      { id: "WO-2024-003", asset: "USS Demo", task: "Safety Inspection", status: "Pending" }
    ]
  };

  const quickActions = [
    {
      title: "My Work Orders",
      count: data.assignedWorkOrders,
      icon: <Work />,
      route: "/work-order",
      color: "primary"
    },
    {
      title: "Parts Needed",
      count: data.pendingParts,
      icon: <Category />,
      route: "/parts",
      color: "warning"
    },
    {
      title: "Scheduled Tasks",
      count: data.scheduledMaintenance,
      icon: <Schedule />,
      route: "/maintenance-schedule",
      color: "info"
    },
    {
      title: "Technical Docs",
      count: "12",
      icon: <Description />,
      route: "/docs",
      color: "secondary"
    }
  ];

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "High": return "error";
      case "Medium": return "warning";
      case "Low": return "success";
      default: return "default";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Completed": return "success";
      case "In Progress": return "info";
      case "Pending": return "warning";
      default: return "default";
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <Dashboard />
        Maintainer Dashboard
      </Typography>
      
      <Typography variant="subtitle1" color="text.secondary" sx={{ mb: 3 }}>
        Your daily maintenance tasks and operational overview
      </Typography>

      {/* Quick Stats */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography variant="h6" component="div">
                    {data.assignedWorkOrders}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Assigned Work Orders
                  </Typography>
                </Box>
                <Box sx={{ color: 'primary.main' }}>
                  <Assignment />
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography variant="h6" component="div">
                    {data.completedToday}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Completed Today
                  </Typography>
                </Box>
                <Box sx={{ color: 'success.main' }}>
                  <Build />
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography variant="h6" component="div">
                    {data.urgentTasks}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Urgent Tasks
                  </Typography>
                </Box>
                <Box sx={{ color: 'error.main' }}>
                  <Warning />
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography variant="h6" component="div">
                    {data.efficiency}%
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Efficiency Rating
                  </Typography>
                </Box>
                <Box sx={{ color: 'success.main' }}>
                  <Dashboard />
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Quick Actions */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {quickActions.map((action, index) => (
          <Grid item xs={12} sm={6} md={3} key={index}>
            <Card sx={{ cursor: 'pointer', '&:hover': { boxShadow: 3 } }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Box>
                    <Typography variant="h6" component="div">
                      {action.count}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {action.title}
                    </Typography>
                  </Box>
                  <Box sx={{ color: `${action.color}.main` }}>
                    {action.icon}
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Parts Needed */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Parts Needed
              </Typography>
              {data.partsNeeded.map((part, index) => (
                <Box key={index} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                  <Box>
                    <Typography variant="body2" fontWeight="medium">
                      {part.part}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Qty: {part.quantity}
                    </Typography>
                  </Box>
                  <Chip 
                    label={part.priority} 
                    color={getPriorityColor(part.priority)}
                    size="small"
                  />
                </Box>
              ))}
              <Button variant="outlined" size="small" sx={{ mt: 2 }}>
                View All Parts
              </Button>
            </CardContent>
          </Card>
        </Grid>

        {/* Recent Work Orders */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Recent Work Orders
              </Typography>
              {data.recentWorkOrders.map((workOrder, index) => (
                <Box key={index} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                  <Box>
                    <Typography variant="body2" fontWeight="medium">
                      {workOrder.id}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {workOrder.asset} - {workOrder.task}
                    </Typography>
                  </Box>
                  <Chip 
                    label={workOrder.status} 
                    color={getStatusColor(workOrder.status)}
                    size="small"
                  />
                </Box>
              ))}
              <Button variant="outlined" size="small" sx={{ mt: 2 }}>
                View All Work Orders
              </Button>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Mobile Tools */}
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <PhoneAndroid />
            Mobile Tools
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Access maintenance tools and documentation on your mobile device
          </Typography>
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Button variant="contained" startIcon={<Work />}>
              Work Orders
            </Button>
            <Button variant="outlined" startIcon={<Description />}>
              Technical Docs
            </Button>
            <Button variant="outlined" startIcon={<Inventory2 />}>
              Parts Lookup
            </Button>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
}
