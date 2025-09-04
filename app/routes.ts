import { type RouteConfig, route, index } from "@react-router/dev/routes";

export default [index("routes/home.tsx"), route("/readiness", "routes/readiness.tsx"), route("/about", "routes/about.tsx")] satisfies RouteConfig;
