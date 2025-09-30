#!/bin/bash
# Universal production startup script
# Works for Databricks Apps, Docker, traditional servers, and local production testing

set -e  # Exit on error

echo "=========================================="
echo "Navy PdM Production Startup"
echo "=========================================="
echo ""

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
if python3 -m pip install -r requirements.txt --quiet --break-system-packages 2>/dev/null; then
  echo "✓ Python dependencies installed (with --break-system-packages)"
else
  python3 -m pip install -r requirements.txt --quiet
  echo "✓ Python dependencies installed"
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

