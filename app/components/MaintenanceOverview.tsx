import * as React from "react";
import Box from "@mui/material/Box";
import Card from "@mui/material/Card";
import CardActions from "@mui/material/CardActions";
import CardContent from "@mui/material/CardContent";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";

export default function MaintenanceOverview() {
  const kpis = [
    {
      title: "GTEs – Need Maintenance (predicted)",
      metric: "51",
      details: "Across all ships (model inference)",
    },
    {
      title: "GTEs – Fully Operational",
      metric: "153",
      details: "No faults observed",
    },
    {
      title: "CASREP GTEs",
      metric: "7",
      details: "Requires immediate attention",
    },
  ];
  return (
    <Card sx={{ minWidth: 275 }}>
      <CardContent>
        <Typography variant="h5">Fleet Maintenance Overview</Typography>
        <Typography variant="p2" sx={{ color: "text.secondary", mb: 1.5 }}>
          Commanders' view for Gas Turbine Engines (GTEs): readiness, predicted
          maintenance, and CASREP status across homeports. This demo mirrors
          Databricks SQL dashboards and Lakehouse workflows with a simplified
          UI.
        </Typography>
        <div style={{ gap: "20px", display: "flex", padding: "10px" }}>
          {kpis.map((item) => {
            let key = 0;
            return (
              <Card
                key={key++}
                elevation="0"
                sx={{ minWidth: 275 }}
                style={{ outline: "gray solid 1px" }}
              >
                <CardContent>
                  <Typography variant="p2" sx={{ color: "text.secondary" }}>
                    {item.title}
                  </Typography>
                  <Typography variant="h5"> {item.metric}</Typography>
                  <Typography variant="p2" sx={{ color: "text.secondary" }}>
                    {item.details}
                  </Typography>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </CardContent>
      <CardActions>
        <Button size="small">Learn More</Button>
      </CardActions>
    </Card>
  );
}
