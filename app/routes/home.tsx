import QuickActions from "~/components/QuickActions";
import type { Route } from "./+types/home";
import MaintenanceOverview from "~/components/MaintenanceOverview";
import WorkOrderTable from "~/components/WorkOrderTable";
import WorkOrderModal from "~/components/WorkOrderModal";
import { useState } from "react";
import { useGetPokemonByNameQuery } from '../redux/services/pokemon'

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Home" },
    { name: "description", content: "Welcome to React Router!" },
  ];
}

export default function Home() {
  const [workOrderModalOpen, setWorkOrderModalOpen] = useState(false);
  const { data, error, isLoading } = useGetPokemonByNameQuery('bulbasaur')

  function openWorkOrderModal() {
    console.log(data)
    setWorkOrderModalOpen(true);
  }

  function closeWorkOrderModal() {
    setWorkOrderModalOpen(false);
  }
  return (
    <div style={{ display: "flex", gap: "20px", flexDirection: "column" }}>
      <div style={{ display: "flex", gap: "20px" }}>
        <MaintenanceOverview /> <QuickActions />
      </div>
      <WorkOrderModal
        modalOpen={workOrderModalOpen}
        handleModalClose={closeWorkOrderModal}
      />
      <WorkOrderTable openWorkOrderModal={openWorkOrderModal} />
    </div>
  );
}
