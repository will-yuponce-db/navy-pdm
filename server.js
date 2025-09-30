import { createRequestHandler } from "@react-router/node";
import { installGlobals } from "@react-router/node";
import express from "express";
import { createProxyMiddleware } from "http-proxy-middleware";

installGlobals();

const viteDevServer =
  process.env.NODE_ENV === "production"
    ? undefined
    : await import("vite").then((vite) =>
        vite.createServer({
          server: { middlewareMode: true },
        })
      );

const app = express();

// Proxy API requests to Flask backend
app.use(
  "/api",
  createProxyMiddleware({
    target: "http://localhost:8000",
    changeOrigin: true,
    onError: (err, req, res) => {
      console.error("Proxy error:", err);
      res.status(500).json({ error: "Backend service unavailable" });
    },
  })
);

// Handle React Router requests
app.all(
  "*",
  createRequestHandler({
    build: viteDevServer
      ? () => viteDevServer.ssrLoadModule("virtual:react-router/server-build")
      : await import("./build/server/index.js"),
  })
);

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Express server listening on port ${port}`);
});
