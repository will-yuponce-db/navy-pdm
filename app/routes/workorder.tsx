import React, { useState } from "react";
import WorkOrderTable from "~/components/WorkOrderTable";
import WorkOrderModal from "~/components/WorkOrderModal";
import { Box } from "@mui/material";
import { useSearchParams } from "react-router";

export function meta() {
  return [
    { title: "Work Orders" },
    { name: "description", content: "Navy PDM Work Order Management System" },
  ];
}

export default function WorkOrder() {
  const [workOrderModalOpen, setWorkOrderModalOpen] = useState(false);
  const [searchParams] = useSearchParams();

  function openWorkOrderModal() {
    setWorkOrderModalOpen(true);
  }

  function closeWorkOrderModal() {
    setWorkOrderModalOpen(false);
  }

  // Get initial filter from URL parameters
  const initialFilter = searchParams.get("filter") || "All";

  return (
    <Box
      sx={{
        p: 3,
        display: "flex",
        flexDirection: "column",
        gap: 3,
        width: "100%",
        maxWidth: "100%",
      }}
    >
      <WorkOrderTable
        openWorkOrderModal={openWorkOrderModal}
        initialFilter={initialFilter}
      />
      <WorkOrderModal
        modalOpen={workOrderModalOpen}
        handleModalClose={closeWorkOrderModal}
      />
    </Box>
  );
}
