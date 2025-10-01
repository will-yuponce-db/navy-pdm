#!/usr/bin/env node
/**
 * Production startup script for Navy PdM
 * Now uses integrated Node.js server (no separate Python backend)
 */

import { spawn } from 'child_process';
import { existsSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT_DIR = join(__dirname, '..');

// Configuration
const config = {
  nodeEnv: process.env.NODE_ENV || 'production',
  port: process.env.PORT || '8000',
  databricksAppUrl: process.env.DATABRICKS_APP_URL || null,
};

// Detect environment
function detectEnvironment() {
  if (config.databricksAppUrl) return 'Databricks Apps';
  if (process.env.DOCKER_CONTAINER || existsSync('/.dockerenv')) return 'Docker';
  return 'Standard';
}

const envType = detectEnvironment();

console.log('==========================================');
console.log('Navy PdM Production Startup');
console.log('==========================================');
console.log('');
console.log(`Environment: ${envType}`);
console.log('');
console.log('Configuration:');
console.log(`  Port: ${config.port}`);
console.log(`  Node Environment: ${config.nodeEnv}`);
if (config.databricksAppUrl) {
  console.log(`  Databricks App URL: ${config.databricksAppUrl}`);
}
console.log('');

// Run command and return promise
function runCommand(command, args, options = {}) {
  return new Promise((resolve, reject) => {
    const proc = spawn(command, args, {
      stdio: options.silent ? 'pipe' : 'inherit',
      shell: options.useShell !== false,
      ...options,
    });

    let stdout = '';
    let stderr = '';

    if (options.silent) {
      proc.stdout?.on('data', (data) => {
        stdout += data.toString();
      });
      proc.stderr?.on('data', (data) => {
        stderr += data.toString();
      });
    }

    proc.on('close', (code) => {
      if (code === 0) {
        resolve({ code, stdout, stderr });
      } else {
        reject({ code, stdout, stderr });
      }
    });

    proc.on('error', (err) => {
      reject({ error: err, stdout, stderr });
    });
  });
}

// Seed database if needed
async function seedDatabaseIfNeeded() {
  console.log('Checking if database needs seeding...');
  
  try {
    // Check if database file exists and has data
    const dbPath = join(ROOT_DIR, 'backend', 'instance', 'navy_pdm.db');
    
    if (!existsSync(dbPath)) {
      console.log('Database not found, seeding...');
      await runCommand('npm', ['run', 'seed'], { cwd: ROOT_DIR });
      console.log('✓ Database seeded successfully');
    } else {
      console.log('✓ Database exists, skipping seed');
    }
  } catch (error) {
    console.error('Failed to seed database:', error.message || error.toString());
    throw error;
  }
}

// Start the integrated server
function startServer() {
  console.log('');
  console.log('==========================================');
  console.log(`Starting integrated Node.js server on port ${config.port}...`);
  console.log('==========================================');
  console.log('');
  console.log('Application will be available at:');
  if (config.databricksAppUrl) {
    console.log(`  External: ${config.databricksAppUrl}`);
  }
  console.log(`  Local: http://localhost:${config.port}`);
  console.log(`  API: http://localhost:${config.port}/api`);
  console.log('');
  console.log('Press Ctrl+C to stop the server');
  console.log('');

  const serverEnv = {
    ...process.env,
    PORT: config.port,
    NODE_ENV: config.nodeEnv,
  };

  const server = spawn('node', ['server.js'], {
    cwd: ROOT_DIR,
    env: serverEnv,
    stdio: 'inherit',
    shell: true,
  });

  return server;
}

// Graceful shutdown
function setupGracefulShutdown(server) {
  const cleanup = () => {
    console.log('');
    console.log('==========================================');
    console.log('Shutting down server...');
    console.log('==========================================');
    
    if (server && !server.killed) {
      console.log('Stopping server...');
      server.kill('SIGTERM');
    }
    
    setTimeout(() => {
      console.log('✓ Server stopped');
      process.exit(0);
    }, 1000);
  };

  process.on('SIGINT', () => cleanup());
  process.on('SIGTERM', () => cleanup());
  process.on('exit', () => cleanup());
}

// Main startup sequence
async function main() {
  let server = null;

  try {
    // Step 1: Seed database if needed
    await seedDatabaseIfNeeded();

    // Step 2: Start integrated server
    server = startServer();

    // Step 3: Setup graceful shutdown
    setupGracefulShutdown(server);

    // Keep process alive
    server.on('exit', (code) => {
      console.log(`Server exited with code ${code}`);
      process.exit(code || 0);
    });

  } catch (error) {
    console.error('');
    console.error('✗ Startup failed:', error.message);
    if (server) server.kill();
    process.exit(1);
  }
}

// Run main
main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});