import QuickActions from "~/components/QuickActions";
import type { Route } from "./+types/home";
import MaintenanceOverview from "~/components/MaintenanceOverview";
import WorkOrderTable from "~/components/WorkOrderTable";
import WorkOrderModal from "~/components/WorkOrderModal";
import { useState } from "react";
import { useGetPokemonByNameQuery } from "../redux/services/pokemon";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Asset Analysis" },
    { name: "description", content: "Welcome to React Router!" },
  ];
}

export default function Assets() {
  const [workOrderModalOpen, setWorkOrderModalOpen] = useState(false);
  const { data, error, isLoading } = useGetPokemonByNameQuery("bulbasaur");

  function openWorkOrderModal() {
    console.log(data);
    setWorkOrderModalOpen(true);
  }

  function closeWorkOrderModal() {
    setWorkOrderModalOpen(false);
  }
  return (
    <iframe
      src="https://e2-demo-field-eng.cloud.databricks.com/embed/dashboardsv3/01f068bce09e1c689fa25b66d73296b9?o=1444828305810485"
      style={{ height: "100vh", width: "100vw" }}
      frameBorder="0"
    ></iframe>
  );
}
