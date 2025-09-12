import QuickActions from "~/components/QuickActions";
import type { Route } from "./+types/home";
import MaintenanceOverview from "~/components/MaintenanceOverview";
import WorkOrderTable from "~/components/WorkOrderTable";
import WorkOrderModal from "~/components/WorkOrderModal";
import { useState } from "react";
export function meta({}: Route.MetaArgs) {
  return [
    { title: "Work Orders" },
    { name: "description", content: "Welcome to React Router!" },
  ];
}

export default function WorkOrder() {

  return (
    <></>
  );
}
