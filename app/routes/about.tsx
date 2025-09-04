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

export default function About() {
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
    <img src="../public/demo.png" alt="Italian Trulli"/>
  );
}
