import React, { useState } from "react";
import QuickActions from "~/components/QuickActions";
import MaintenanceOverview from "~/components/MaintenanceOverview";
import WorkOrderTable from "~/components/WorkOrderTable";
import WorkOrderModal from "~/components/WorkOrderModal";
import { Box } from "@mui/material";
import { useWorkflowShortcuts } from "~/components/WorkflowShortcuts";

export function meta() {
  return [
    { title: "Home" },
    { name: "description", content: "Welcome to React Router!" },
  ];
}

export default function Home() {
  const [workOrderModalOpen, setWorkOrderModalOpen] = useState(false);

  function openWorkOrderModal() {
    setWorkOrderModalOpen(true);
  }

  function closeWorkOrderModal() {
    setWorkOrderModalOpen(false);
  }

  const handleRefreshData = () => {
    // Trigger data refresh (only on client side)
    if (typeof window !== "undefined") {
      window.location.reload();
    }
  };

  // Enable workflow shortcuts
  useWorkflowShortcuts({
    onOpenWorkOrderModal: openWorkOrderModal,
    onRefreshData: handleRefreshData,
  });

  return (
    <Box
      sx={{
        width: "100%",
        minHeight: "100vh",
        position: "relative",
        zIndex: 1,
        p: 3,
        background: "transparent",
      }}
    >
      <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
        <Box
          sx={{
            display: "flex",
            flexDirection: { xs: "column", lg: "row" },
            gap: 3,
          }}
        >
          <Box sx={{ flex: { xs: 1, lg: 2 } }}>
            <MaintenanceOverview />
          </Box>
          <Box sx={{ flex: { xs: 1, lg: 1 } }}>
            <QuickActions />
          </Box>
        </Box>

        <Box sx={{ flex: 1 }}>
          <WorkOrderTable openWorkOrderModal={openWorkOrderModal} />
        </Box>

        <WorkOrderModal
          modalOpen={workOrderModalOpen}
          handleModalClose={closeWorkOrderModal}
        />
      </Box>
    </Box>
  );
}
