import type { Config } from "@react-router/dev/config";

export default {
  // Server-side render by default, to enable SPA mode set this to `false`
  ssr: true,
  // Optimize for production builds
  future: {
    v3_relativeSplatPath: true,
    v3_throwAbortReason: true,
  },
  // Bundle optimization
  buildDirectory: "build",
  publicPath: "/",
  // Performance optimizations
  serverBuildTarget: "node-esm",
  serverModuleFormat: "esm",
} satisfies Config;
