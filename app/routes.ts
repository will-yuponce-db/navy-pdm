import { type RouteConfig, route, index } from "@react-router/dev/routes";

export default [
  index("routes/home.tsx"),
  route("/login", "routes/login.tsx"),
  route("/readiness", "routes/readiness.tsx"),
  route("/work-order", "routes/workorder.tsx"),
  route("/sensor-analyzer", "routes/sensor-analyzer.tsx"),
  route("/assets", "routes/assets.tsx"),
  route("/parts", "routes/parts.tsx"),
  route("/maintenance-schedule", "routes/maintenance-schedule.tsx"),
  route("/spo-dashboard", "routes/spo-dashboard.tsx"),
  route("/maintainer-dashboard", "routes/maintainer-dashboard.tsx"),
  route("/about", "routes/about.tsx"),
] satisfies RouteConfig;
