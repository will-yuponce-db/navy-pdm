import * as React from "react";
import Box from "@mui/material/Box";
import Card from "@mui/material/Card";
import CardActions from "@mui/material/CardActions";
import CardContent from "@mui/material/CardContent";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import Tooltip from "@mui/material/Tooltip";
import { useNavigate } from "react-router";

export default function QuickActions() {
  const navigate = useNavigate();

  return (
    <Card sx={{ minWidth: 275 }}>
      <CardContent>
        <Typography variant="h5">Quick Actions</Typography>
      </CardContent>
      <CardActions>
        <Tooltip title={"Open Readiness Dashboard"}>
          <Button
            onClick={() => {
              navigate("/readiness");
            }}
            variant="outlined"
          >
            Readiness Dashboard
          </Button>
        </Tooltip>
        <Tooltip title={"Open Asset Management"}>
          <Button variant="outlined">Asset Management</Button>
        </Tooltip>
      </CardActions>
    </Card>
  );
}
