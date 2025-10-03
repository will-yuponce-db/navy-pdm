import express from 'express';
import { createRequestHandler } from '@react-router/express';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Serve static assets from build/client
app.use('/assets', express.static(path.join(__dirname, 'build/client/assets'), {
  immutable: true,
  maxAge: '1y'
}));

// Serve other static files from build/client
app.use(express.static(path.join(__dirname, 'build/client'), {
  maxAge: '1h'
}));

// Handle SSR requests
const build = await import('./build/server/index.js');
app.all('*', createRequestHandler({ build }));

app.listen(PORT, () => {
  console.log(`Frontend server running on http://localhost:${PORT}`);
});

