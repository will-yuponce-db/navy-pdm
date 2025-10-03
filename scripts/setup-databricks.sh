#!/bin/bash
# Setup script to configure Databricks credentials
# Run this script to test your Databricks connection

echo "=========================================="
echo "Databricks Connection Setup"
echo "=========================================="
echo ""

# Check if .env file exists
if [ -f .env ]; then
  echo "✓ Found existing .env file"
  echo "  Loading environment variables..."
  export $(grep -v '^#' .env | xargs)
else
  echo "⚠ No .env file found"
  echo ""
  echo "Creating .env template..."
  cat > .env << 'EOF'
# Databricks Configuration
# Required for Databricks connectivity

# Server hostname (without https://)
DATABRICKS_SERVER_HOSTNAME=your-workspace.cloud.databricks.com

# HTTP path to your SQL warehouse or cluster
DATABRICKS_HTTP_PATH=/sql/1.0/warehouses/your-warehouse-id

# Authentication - Use EITHER Token OR OAuth (Client ID + Secret)

# Option 1: Personal Access Token
# DATABRICKS_TOKEN=your-personal-access-token

# Option 2: OAuth Service Principal (Recommended for production)
DATABRICKS_CLIENT_ID=your-service-principal-client-id
DATABRICKS_CLIENT_SECRET=your-service-principal-client-secret

# Server Configuration
NODE_ENV=production
PORT=8000
EOF
  echo "✓ Created .env template"
  echo ""
  echo "Please edit the .env file with your actual Databricks credentials"
  echo "Then run this script again to test the connection"
  exit 0
fi

echo ""
echo "Current Configuration:"
echo "----------------------"
echo "NODE_ENV: ${NODE_ENV:-not set}"
echo "DATABRICKS_SERVER_HOSTNAME: ${DATABRICKS_SERVER_HOSTNAME:-not set}"
echo "DATABRICKS_HTTP_PATH: ${DATABRICKS_HTTP_PATH:-not set}"

if [ -n "$DATABRICKS_TOKEN" ]; then
  echo "DATABRICKS_TOKEN: [SET - $(echo $DATABRICKS_TOKEN | cut -c1-10)...]"
elif [ -n "$DATABRICKS_CLIENT_ID" ] && [ -n "$DATABRICKS_CLIENT_SECRET" ]; then
  echo "DATABRICKS_CLIENT_ID: ${DATABRICKS_CLIENT_ID}"
  echo "DATABRICKS_CLIENT_SECRET: [SET - $(echo $DATABRICKS_CLIENT_SECRET | cut -c1-10)...]"
else
  echo "⚠ No authentication method configured"
  echo "  Set either DATABRICKS_TOKEN or both DATABRICKS_CLIENT_ID and DATABRICKS_CLIENT_SECRET"
fi

echo ""
echo "Validation:"
echo "-----------"

# Check required variables
MISSING=0

if [ -z "$DATABRICKS_SERVER_HOSTNAME" ]; then
  echo "✗ DATABRICKS_SERVER_HOSTNAME is not set"
  MISSING=1
else
  echo "✓ DATABRICKS_SERVER_HOSTNAME is set"
fi

if [ -z "$DATABRICKS_HTTP_PATH" ]; then
  echo "✗ DATABRICKS_HTTP_PATH is not set"
  MISSING=1
else
  echo "✓ DATABRICKS_HTTP_PATH is set"
fi

if [ -z "$DATABRICKS_TOKEN" ] && ([ -z "$DATABRICKS_CLIENT_ID" ] || [ -z "$DATABRICKS_CLIENT_SECRET" ]); then
  echo "✗ No valid authentication method configured"
  echo "  Set either DATABRICKS_TOKEN or both DATABRICKS_CLIENT_ID and DATABRICKS_CLIENT_SECRET"
  MISSING=1
else
  echo "✓ Authentication credentials are set"
fi

if [ $MISSING -eq 1 ]; then
  echo ""
  echo "⚠ Configuration incomplete - please set the missing variables in .env"
  exit 1
fi

echo ""
echo "✓ All required variables are set"
echo ""
echo "=========================================="
echo "Testing Connection"
echo "=========================================="
echo ""

# Test if server is running
echo "Checking if server is running..."
if curl -s http://localhost:8000/api/databricks/health > /dev/null; then
  echo "✓ Server is running"
  echo ""
  
  echo "Databricks Health Status:"
  echo "-------------------------"
  curl -s http://localhost:8000/api/databricks/health | python3 -m json.tool
  
  echo ""
  echo "Testing Connection:"
  echo "-------------------"
  curl -s http://localhost:8000/api/databricks/test | python3 -m json.tool
else
  echo "⚠ Server is not running"
  echo ""
  echo "Start the server with:"
  echo "  npm start"
  echo ""
  echo "Or for development:"
  echo "  NODE_ENV=production node server.js"
fi

echo ""
echo "=========================================="
echo "Done"
echo "=========================================="

