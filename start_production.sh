#!/bin/bash
# Universal production startup script
# Works for Databricks Apps, Docker, traditional servers, and local production testing

set -e  # Exit on error

echo "=========================================="
echo "Navy PdM Production Startup"
echo "=========================================="
echo ""

# Check for virtual environment and prevent usage
if [ -n "$VIRTUAL_ENV" ] || [ -n "$CONDA_DEFAULT_ENV" ] || [ -n "$CONDA_PREFIX" ] || [ -n "$PIPENV_ACTIVE" ] || [ -n "$POETRY_ACTIVE" ]; then
    echo "⚠️  ERROR: Virtual environment detected!"
    echo "   This production script requires system Python, not virtual environment."
    echo "   Please deactivate your virtual environment and try again."
    echo "   Run: deactivate"
    exit 1
fi

# Detect environment
if [ -n "$DATABRICKS_APP_URL" ]; then
  ENV_TYPE="Databricks Apps"
elif [ -n "$DOCKER_CONTAINER" ] || [ -f /.dockerenv ]; then
  ENV_TYPE="Docker"
else
  ENV_TYPE="Standard"
fi

echo "Environment: $ENV_TYPE"
echo ""

# Set default environment variables
export NODE_ENV=${NODE_ENV:-production}
export PORT=${PORT:-8000}
export FLASK_RUN_PORT=${FLASK_RUN_PORT:-8001}
export FLASK_RUN_HOST=${FLASK_RUN_HOST:-0.0.0.0}
export BACKEND_PORT=${FLASK_RUN_PORT}
export GUNICORN_TIMEOUT=${GUNICORN_TIMEOUT:-120}
export GUNICORN_WORKERS=${GUNICORN_WORKERS:-2}

# Ensure virtual environment variables are unset
unset VIRTUAL_ENV
unset CONDA_DEFAULT_ENV
unset CONDA_PREFIX
unset PIPENV_ACTIVE
unset POETRY_ACTIVE
unset VENV
unset ENV

echo "Configuration:"
echo "  Frontend Port: $PORT"
echo "  Backend Port: $FLASK_RUN_PORT"
echo "  Node Environment: $NODE_ENV"
echo "  Gunicorn Workers: $GUNICORN_WORKERS"
echo "  Gunicorn Timeout: ${GUNICORN_TIMEOUT}s"
if [ -n "$DATABRICKS_APP_URL" ]; then
  echo "  Databricks App URL: $DATABRICKS_APP_URL"
fi
echo ""

# Install backend dependencies
echo "Installing Python dependencies..."
cd backend

# Try multiple pip methods
PIP_INSTALLED=false

# Method 1: Try pip3 directly
if command -v pip3 > /dev/null 2>&1; then
  echo "Found pip3, attempting install..."
  if pip3 install -r requirements.txt --quiet --break-system-packages 2>/dev/null; then
    echo "✓ Python dependencies installed via pip3 (with --break-system-packages)"
    PIP_INSTALLED=true
  elif pip3 install -r requirements.txt --quiet 2>/dev/null; then
    echo "✓ Python dependencies installed via pip3"
    PIP_INSTALLED=true
  fi
fi

# Method 2: Try python3 -m pip
if [ "$PIP_INSTALLED" = false ] && python3 -m pip --version > /dev/null 2>&1; then
  echo "Found python3 -m pip, attempting install..."
  if python3 -m pip install -r requirements.txt --quiet --break-system-packages 2>/dev/null; then
    echo "✓ Python dependencies installed via python3 -m pip (with --break-system-packages)"
    PIP_INSTALLED=true
  elif python3 -m pip install -r requirements.txt --quiet 2>/dev/null; then
    echo "✓ Python dependencies installed via python3 -m pip"
    PIP_INSTALLED=true
  fi
fi

# Method 3: Try to bootstrap pip
if [ "$PIP_INSTALLED" = false ]; then
  echo "⚠ pip not found, attempting to bootstrap..."
  if python3 -m ensurepip --default-pip 2>/dev/null; then
    echo "✓ pip bootstrapped successfully"
    if python3 -m pip install -r requirements.txt --quiet 2>/dev/null; then
      echo "✓ Python dependencies installed"
      PIP_INSTALLED=true
    fi
  fi
fi

# Method 4: Check if packages are pre-installed
if [ "$PIP_INSTALLED" = false ]; then
  echo "⚠ Could not install via pip. Checking if packages are already available..."
  if python3 -c "import flask, flask_cors, flask_sqlalchemy, flask_migrate" 2>/dev/null; then
    echo "✓ Python dependencies appear to be pre-installed"
    PIP_INSTALLED=true
  else
    echo "✗ Python dependencies missing and pip unavailable"
    echo "Tried: pip3, python3 -m pip, ensurepip"
    echo "Please ensure the Databricks environment has Python packages or pip available"
    cd ..
    exit 1
  fi
fi

cd ..

# Start backend in background
echo ""
echo "Starting Flask backend on port $FLASK_RUN_PORT..."
cd backend
python3 start_production.py &
BACKEND_PID=$!
cd ..

echo "✓ Backend started with PID: $BACKEND_PID"

# Wait for backend to be ready
echo ""
echo "Waiting for backend to be ready..."
MAX_RETRIES=30
for i in $(seq 1 $MAX_RETRIES); do
  if curl -s http://localhost:$FLASK_RUN_PORT/api/health > /dev/null 2>&1; then
    echo "✓ Backend is ready!"
    break
  fi
  if [ $i -eq $MAX_RETRIES ]; then
    echo "✗ Backend failed to start within $MAX_RETRIES seconds"
    echo ""
    echo "Troubleshooting tips:"
    echo "  1. Check backend logs above for errors"
    echo "  2. Verify database can be initialized"
    echo "  3. Check if port $FLASK_RUN_PORT is already in use"
    echo "  4. Try running backend manually: cd backend && python3 start_production.py"
    kill $BACKEND_PID 2>/dev/null || true
    exit 1
  fi
  echo "  Waiting... ($i/$MAX_RETRIES)"
  sleep 1
done

# Verify backend health
echo ""
echo "Verifying backend health..."
HEALTH_RESPONSE=$(curl -s http://localhost:$FLASK_RUN_PORT/api/health || echo "failed")
if echo "$HEALTH_RESPONSE" | grep -q "healthy"; then
  echo "✓ Backend health check passed"
else
  echo "✗ Backend health check failed"
  echo "Response: $HEALTH_RESPONSE"
  kill $BACKEND_PID 2>/dev/null || true
  exit 1
fi

# Start frontend
echo ""
echo "=========================================="
echo "Starting Node.js frontend on port $PORT..."
echo "=========================================="
echo ""
echo "Application will be available at:"
if [ -n "$DATABRICKS_APP_URL" ]; then
  echo "  External: $DATABRICKS_APP_URL"
fi
echo "  Local: http://localhost:$PORT"
echo "  Backend API: http://localhost:$FLASK_RUN_PORT/api"
echo ""
echo "Press Ctrl+C to stop all services"
echo ""

# Start frontend (this will block)
node server.js

# This cleanup function runs when the script exits
cleanup() {
  echo ""
  echo "=========================================="
  echo "Shutting down services..."
  echo "=========================================="
  if [ -n "$BACKEND_PID" ]; then
    echo "Stopping backend (PID: $BACKEND_PID)..."
    kill $BACKEND_PID 2>/dev/null || true
    wait $BACKEND_PID 2>/dev/null || true
  fi
  echo "✓ All services stopped"
  exit
}

# Set up signal handlers for graceful shutdown
trap cleanup EXIT INT TERM

