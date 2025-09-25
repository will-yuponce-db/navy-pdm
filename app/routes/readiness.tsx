import type { Route } from "./+types/home";

export function meta(_args: Route.MetaArgs) {
  return [
    { title: "Readiness Dashboard" },
    { name: "description", content: "Welcome to React Router!" },
  ];
}

export default function Readiness() {
  return (
    <iframe
      src="https://e2-demo-field-eng.cloud.databricks.com/embed/dashboardsv3/01f068bce09e1c689fa25b66d73296b9?o=1444828305810485"
      style={{ height: "100vh", width: "100vw" }}
    ></iframe>
  );
}
