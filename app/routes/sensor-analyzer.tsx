import React from "react";
import { useSearchParams, useNavigate } from "react-router";
import SensorAnalyzer from "~/components/SensorAnalyzer";
import { Box } from "@mui/material";

export function meta() {
  return [
    { title: "Work Order Evidence Package" },
    { name: "description", content: "Sensor data evidence package for work order analysis" },
  ];
}

export default function SensorAnalyzerRoute() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const workOrderId = searchParams.get("workOrderId");
  const systemId = searchParams.get("systemId");
  const sensorId = searchParams.get("sensorId");

  const handleClose = () => {
    // Navigate back to work orders or previous page
    if (workOrderId) {
      navigate(`/work-order?highlight=${workOrderId}`);
    } else {
      navigate(-1);
    }
  };

  // Redirect if no work order ID is provided
  if (!workOrderId) {
    navigate("/work-order");
    return null;
  }

  return (
    <Box
      sx={{
        height: "100vh",
        overflow: "hidden",
        backgroundColor: "background.default",
      }}
    >
      <SensorAnalyzer
        workOrderId={workOrderId}
        systemId={systemId || undefined}
        sensorId={sensorId || undefined}
        onClose={handleClose}
      />
    </Box>
  );
}
