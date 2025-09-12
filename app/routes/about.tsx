import QuickActions from "~/components/QuickActions";
import type { Route } from "./+types/home";
import MaintenanceOverview from "~/components/MaintenanceOverview";
import WorkOrderTable from "~/components/WorkOrderTable";
import WorkOrderModal from "~/components/WorkOrderModal";
import { useState } from "react";
export function meta({}: Route.MetaArgs) {
  return [
    { title: "Home" },
    { name: "description", content: "Welcome to React Router!" },
  ];
}

export default function About() {
  return (
    <div style={{ gap: "20px", display: "flex", flexDirection: "column" }}>
      <img src="/assets/demo.png" alt="Demo flow" />
      <img src="/assets/end_2_end.png" alt="End to end workflow" />
      <img src="/assets/edge_analytics.png" alt="Edge analytics" />
      <img
        src="/assets/maintianance_analytics.png"
        alt="Maintainance analytics"
      />
      <img src="/assets/logistic_analytics.png" alt="Maintainance analytics" />
    </div>
  );
}
