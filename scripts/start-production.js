#!/usr/bin/env node
/**
 * Universal production startup script
 * Works for Databricks Apps, Docker, traditional servers, and local production testing
 */

import { spawn } from 'child_process';
import { existsSync, readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT_DIR = join(__dirname, '..');

// Configuration
const config = {
  nodeEnv: process.env.NODE_ENV || 'production',
  frontendPort: process.env.PORT || '8000',
  backendPort: process.env.FLASK_RUN_PORT || '8001',
  backendHost: process.env.FLASK_RUN_HOST || '0.0.0.0',
  gunicornWorkers: process.env.GUNICORN_WORKERS || '2',
  gunicornTimeout: process.env.GUNICORN_TIMEOUT || '120',
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
console.log(`  Frontend Port: ${config.frontendPort}`);
console.log(`  Backend Port: ${config.backendPort}`);
console.log(`  Node Environment: ${config.nodeEnv}`);
console.log(`  Gunicorn Workers: ${config.gunicornWorkers}`);
console.log(`  Gunicorn Timeout: ${config.gunicornTimeout}s`);
if (config.databricksAppUrl) {
  console.log(`  Databricks App URL: ${config.databricksAppUrl}`);
}
console.log('');

// Run command and return promise
function runCommand(command, args, options = {}) {
  return new Promise((resolve, reject) => {
    const proc = spawn(command, args, {
      stdio: options.silent ? 'pipe' : 'inherit',
      shell: true,
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

// Install Python dependencies
async function installPythonDependencies() {
  console.log('Installing Python dependencies...');
  
  try {
    // Check for virtual environment and warn if found
    const venvCheck = await runCommand('python3', ['-c', 'import sys; print("VIRTUAL_ENV" in sys.modules or hasattr(sys, "real_prefix") or (hasattr(sys, "base_prefix") and sys.base_prefix != sys.prefix))'], { silent: true });
    if (venvCheck.stdout && venvCheck.stdout.trim() === 'True') {
      console.log('⚠️  Warning: Virtual environment detected. Using system Python instead.');
    }

    // First, check if packages are already available
    try {
      await runCommand('python3', ['-c', 'import flask, flask_cors, flask_sqlalchemy, flask_migrate'], { silent: true });
      console.log('✓ Python dependencies appear to be pre-installed');
      return true;
    } catch (err) {
      console.log('Python dependencies not found, attempting installation...');
    }

    // Try multiple pip methods for different environments - prioritize system Python
    const pipMethods = [
      ['python3', ['-m', 'pip', 'install', '-r', 'backend/requirements.txt', '--break-system-packages', '--user']],
      ['python3', ['-m', 'pip', 'install', '-r', 'backend/requirements.txt', '--break-system-packages']],
      ['python3', ['-m', 'pip', 'install', '-r', 'backend/requirements.txt', '--user']],
      ['python3', ['-m', 'pip', 'install', '-r', 'backend/requirements.txt']],
      ['pip3', ['install', '-r', 'backend/requirements.txt', '--break-system-packages', '--user']],
      ['pip3', ['install', '-r', 'backend/requirements.txt', '--break-system-packages']],
      ['pip3', ['install', '-r', 'backend/requirements.txt', '--user']],
      ['pip3', ['install', '-r', 'backend/requirements.txt']],
    ];

    let installed = false;
    for (const [command, args] of pipMethods) {
      try {
        console.log(`Trying: ${command} ${args.join(' ')}`);
        await runCommand(command, args, { silent: false }); // Show output for debugging
        console.log(`✓ Python dependencies installed via ${command}`);
        installed = true;
        break;
      } catch (err) {
        console.log(`✗ Failed with ${command}: ${err.message || err.stderr || 'Unknown error'}`);
        // Try next method
        continue;
      }
    }

    if (!installed) {
      console.error('✗ All pip installation methods failed');
      console.error('Please ensure the environment has Python packages or pip available');
      throw new Error('Failed to install Python dependencies');
    }

    // Verify installation worked by testing imports
    try {
      await runCommand('python3', ['-c', 'import flask, flask_cors, flask_sqlalchemy, flask_migrate'], { silent: true });
      console.log('✓ Python dependencies verified after installation');
      return true;
    } catch (err) {
      console.error('✗ Python dependencies installation failed verification');
      console.error('Flask modules are still not available after installation');
      throw new Error('Python dependencies installation verification failed');
    }

  } catch (error) {
    console.error('Failed to install Python dependencies:', error.message);
    throw error;
  }
}

// Start backend server
async function startBackend() {
  return new Promise(async (resolve, reject) => {
    console.log('');
    console.log(`Starting Flask backend on port ${config.backendPort}...`);
    
    const backendDir = join(ROOT_DIR, 'backend');
    const backendEnv = {
      ...process.env,
      FLASK_RUN_HOST: config.backendHost,
      FLASK_RUN_PORT: config.backendPort,
      GUNICORN_WORKERS: config.gunicornWorkers,
      GUNICORN_TIMEOUT: config.gunicornTimeout,
      NODE_ENV: config.nodeEnv,
      // Ensure we use system Python, not virtual environment
      VIRTUAL_ENV: undefined,
      PYTHONPATH: undefined,
    };

    // Use absolute path to system python3 to avoid virtual environment
    const pythonPath = await runCommand('which', ['python3'], { silent: true }).then(result => result.stdout.trim()).catch(() => 'python3');
    
    const backend = spawn(pythonPath, ['backend/start_production.py'], {
      cwd: ROOT_DIR,
      env: backendEnv,
      stdio: 'inherit',
      shell: true,
    });

    backend.on('error', (err) => {
      reject(new Error(`Failed to start backend: ${err.message}`));
    });

    // Give backend a moment to start, then resolve with the process
    setTimeout(() => {
      if (backend.exitCode === null) {
        console.log(`✓ Backend started with PID: ${backend.pid}`);
        resolve(backend);
      } else {
        reject(new Error(`Backend exited with code ${backend.exitCode}`));
      }
    }, 2000);
  });
}

// Wait for backend to be ready
async function waitForBackend(maxRetries = 30) {
  console.log('');
  console.log('Waiting for backend to be ready...');
  
  for (let i = 1; i <= maxRetries; i++) {
    try {
      const response = await fetch(`http://localhost:${config.backendPort}/api/health`);
      if (response.ok) {
        console.log('✓ Backend is ready!');
        return true;
      }
    } catch (err) {
      // Backend not ready yet
    }

    if (i === maxRetries) {
      console.error(`✗ Backend failed to start within ${maxRetries} seconds`);
      console.error('');
      console.error('Troubleshooting tips:');
      console.error('  1. Check backend logs above for errors');
      console.error('  2. Verify database can be initialized');
      console.error(`  3. Check if port ${config.backendPort} is already in use`);
      console.error('  4. Try running backend manually: cd backend && python3 start_production.py');
      return false;
    }

    console.log(`  Waiting... (${i}/${maxRetries})`);
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  return false;
}

// Start frontend server
function startFrontend() {
  console.log('');
  console.log('==========================================');
  console.log(`Starting Node.js frontend on port ${config.frontendPort}...`);
  console.log('==========================================');
  console.log('');
  console.log('Application will be available at:');
  if (config.databricksAppUrl) {
    console.log(`  External: ${config.databricksAppUrl}`);
  }
  console.log(`  Local: http://localhost:${config.frontendPort}`);
  console.log(`  Backend API: http://localhost:${config.backendPort}/api`);
  console.log('');
  console.log('Press Ctrl+C to stop all services');
  console.log('');

  const frontendEnv = {
    ...process.env,
    PORT: config.frontendPort,
    BACKEND_PORT: config.backendPort,
    FLASK_RUN_PORT: config.backendPort,
    NODE_ENV: config.nodeEnv,
  };

  const frontend = spawn('node', ['server.js'], {
    cwd: ROOT_DIR,
    env: frontendEnv,
    stdio: 'inherit',
    shell: true,
  });

  return frontend;
}

// Graceful shutdown
function setupGracefulShutdown(backend, frontend) {
  const cleanup = (signal) => {
    console.log('');
    console.log('==========================================');
    console.log('Shutting down services...');
    console.log('==========================================');
    
    if (frontend && !frontend.killed) {
      console.log('Stopping frontend...');
      frontend.kill('SIGTERM');
    }
    
    if (backend && !backend.killed) {
      console.log('Stopping backend...');
      backend.kill('SIGTERM');
    }
    
    setTimeout(() => {
      console.log('✓ All services stopped');
      process.exit(0);
    }, 1000);
  };

  process.on('SIGINT', () => cleanup('SIGINT'));
  process.on('SIGTERM', () => cleanup('SIGTERM'));
  process.on('exit', () => cleanup('exit'));
}

// Main startup sequence
async function main() {
  let backend = null;
  let frontend = null;

  try {
    // Step 1: Install Python dependencies
    await installPythonDependencies();

    // Step 2: Start backend
    backend = await startBackend();

    // Step 3: Wait for backend to be ready
    const backendReady = await waitForBackend();
    if (!backendReady) {
      if (backend) backend.kill();
      process.exit(1);
    }

    // Step 4: Start frontend
    frontend = startFrontend();

    // Step 5: Setup graceful shutdown
    setupGracefulShutdown(backend, frontend);

    // Keep process alive
    frontend.on('exit', (code) => {
      console.log(`Frontend exited with code ${code}`);
      if (backend) backend.kill();
      process.exit(code || 0);
    });

    backend.on('exit', (code) => {
      console.log(`Backend exited with code ${code}`);
      if (frontend) frontend.kill();
      process.exit(code || 0);
    });

  } catch (error) {
    console.error('');
    console.error('✗ Startup failed:', error.message);
    if (backend) backend.kill();
    if (frontend) frontend.kill();
    process.exit(1);
  }
}

// Run main
main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});

