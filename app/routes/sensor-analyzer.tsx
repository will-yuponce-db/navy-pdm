import React, { useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router";
import SensorAnalyzer from "~/components/SensorAnalyzer";
import { Box } from "@mui/material";
import { useSelector } from "react-redux";
import { selectAllWorkOrders } from "~/redux/services/workOrderSlice";

export function meta() {
  return [
    { title: "Work Order Evidence Package" },
    {
      name: "description",
      content: "Sensor data evidence package for work order analysis",
    },
  ];
}

export default function SensorAnalyzerRoute() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const workOrders = useSelector(selectAllWorkOrders);

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

  // Find the work order and check if it's AI-generated
  const workOrder = workOrders.find((wo) => wo.wo === workOrderId);

  // Redirect if work order is manual (not AI-generated)
  useEffect(() => {
    if (workOrder && workOrder.creationSource !== "ai") {
      navigate(`/work-order?highlight=${workOrderId}`);
    }
  }, [workOrder, workOrderId, navigate]);

  // Don't render if work order is manual
  if (workOrder && workOrder.creationSource !== "ai") {
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
