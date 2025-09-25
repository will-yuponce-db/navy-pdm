import type { Route } from "./+types/home";
import InteractiveImageGallery from "../components/InteractiveImageGallery";

export function meta(_args: Route.MetaArgs) {
  return [
    { title: "About - Navy PdM System" },
    {
      name: "description",
      content:
        "Explore the Navy Predictive Maintenance system through interactive visualizations and comprehensive analytics.",
    },
  ];
}

export default function About() {
  return <InteractiveImageGallery />;
}
