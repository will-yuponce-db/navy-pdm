import express from 'express';
import { createProxyMiddleware } from 'http-proxy-middleware';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Proxy API requests to backend
app.use('/api', createProxyMiddleware({
  target: 'http://localhost:8000',
  changeOrigin: true,
  secure: false,
  logLevel: 'debug',
}));

// Serve static files from build/client directory
app.use(express.static(join(__dirname, 'build/client')));

// Import and use React Router server
let reactRouterServer;
try {
  const serverModule = await import('./build/server/index.js');
  // React Router v7 exports the request handler directly
  reactRouterServer = serverModule.default || serverModule;
} catch (error) {
  console.error('Failed to import React Router server:', error);
  // Fallback for development or if server build fails
  reactRouterServer = (req, res) => {
    res.status(500).send('React Router server not available');
  };
}

// Handle all other requests with React Router
app.all('*', reactRouterServer);

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`API proxy configured for /api -> http://localhost:8000`);
  console.log(`React Router SSR server loaded`);
});
