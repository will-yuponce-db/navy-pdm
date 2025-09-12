import { type RouteConfig, route, index } from "@react-router/dev/routes";

export default [
  index("routes/home.tsx"),
  route("/readiness", "routes/readiness.tsx"),
  route("/work-order", "routes/workorder.tsx"),
  route("/about", "routes/about.tsx"),
] satisfies RouteConfig;
