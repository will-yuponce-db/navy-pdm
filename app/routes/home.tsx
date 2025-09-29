import QuickActions from "~/components/QuickActions";
import MaintenanceOverview from "~/components/MaintenanceOverview";
import WorkOrderTable from "~/components/WorkOrderTable";
import WorkOrderModal from "~/components/WorkOrderModal";
import MaintenanceCharts from "~/components/MaintenanceCharts";
import AdvancedAnalytics from "~/components/AdvancedAnalytics";
import FleetMap from "~/components/FleetMap";
import PredictiveAnalytics from "~/components/PredictiveAnalytics";
import { useState } from "react";
import { Box, Tabs, Tab } from "@mui/material";
import { useWorkflowShortcuts } from "~/components/WorkflowShortcuts";

export function meta() {
  return [
    { title: "Home" },
    { name: "description", content: "Welcome to React Router!" },
  ];
}

export default function Home() {
  const [workOrderModalOpen, setWorkOrderModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState(0);

  function openWorkOrderModal() {
    setWorkOrderModalOpen(true);
  }

  function closeWorkOrderModal() {
    setWorkOrderModalOpen(false);
  }

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

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
          <Box
            sx={{
              borderBottom: 1,
              borderColor: "divider",
              mb: 3,
              background: "rgba(255,255,255,0.05)",
              backdropFilter: "blur(10px)",
              borderRadius: 2,
              p: 2,
            }}
          >
            <Tabs value={activeTab} onChange={handleTabChange}>
              <Tab label="Work Orders" />
              <Tab label="Analytics" />
              <Tab label="Advanced Analytics" />
              <Tab label="Fleet Map" />
              <Tab label="Predictive Analytics" />
            </Tabs>
          </Box>

          {activeTab === 0 && (
            <WorkOrderTable openWorkOrderModal={openWorkOrderModal} />
          )}

          {activeTab === 1 && <MaintenanceCharts />}

          {activeTab === 2 && <AdvancedAnalytics />}

          {activeTab === 3 && <FleetMap />}

          {activeTab === 4 && <PredictiveAnalytics />}
        </Box>

        <WorkOrderModal
          modalOpen={workOrderModalOpen}
          handleModalClose={closeWorkOrderModal}
        />
      </Box>
    </Box>
  );
}
