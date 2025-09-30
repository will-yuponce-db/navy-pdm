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

// Serve static files from build directory
app.use(express.static(join(__dirname, 'build/client')));

// Handle React Router routes
app.get('*', (req, res) => {
  res.sendFile(join(__dirname, 'build/client/index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`API proxy configured for /api -> http://localhost:8000`);
});
