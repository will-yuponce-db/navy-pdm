import type { Route } from "./+types/home";
import MaintenanceOverview from "~/components/MaintenanceOverview";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Home" },
    { name: "description", content: "Welcome to React Router!" },
  ];
}

export default function Home() {
  return (
    <div>
    <MaintenanceOverview />
    </div>
  );
}
