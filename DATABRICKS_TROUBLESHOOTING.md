# Databricks Connection Troubleshooting

## Issue: Databricks Not Connecting

### Symptoms
- Databricks endpoints return 503 errors
- Health check shows `"credentials": false`
- Logs show "Skipping initialization - not in production or missing credentials"

### Root Cause
The Databricks connection requires **two conditions** to be met:
1. ✓ `NODE_ENV=production` (Server must be in production mode)
2. ✗ **Databricks credentials must be set** (Currently missing)

## Quick Diagnosis

Check your current status:
```bash
curl http://localhost:8000/api/databricks/health | python3 -m json.tool
```

Expected output if working:
```json
{
    "status": "connected",
    "mode": "production",
    "databricks": {
        "available": true,
        "credentials": true
    }
}
```

## Solution: Configure Databricks Credentials

### Step 1: Get Your Databricks Credentials

You need:
1. **Server Hostname**: Your Databricks workspace URL (e.g., `your-workspace.cloud.databricks.com`)
2. **HTTP Path**: Path to your SQL warehouse (e.g., `/sql/1.0/warehouses/abc123def456`)
3. **Authentication**: Either:
   - Personal Access Token, OR
   - Service Principal (Client ID + Secret)

### Step 2: Create a `.env` File

Run the setup script to create a template:
```bash
cd navy-pdm
./scripts/setup-databricks.sh
```

This will create a `.env` file. Edit it with your actual credentials:

```bash
# .env file
DATABRICKS_SERVER_HOSTNAME=your-workspace.cloud.databricks.com
DATABRICKS_HTTP_PATH=/sql/1.0/warehouses/your-warehouse-id

# Use ONE of these authentication methods:

# Option A: Personal Access Token (simpler for testing)
DATABRICKS_TOKEN=dapi1234567890abcdef

# Option B: Service Principal (recommended for production)
DATABRICKS_CLIENT_ID=your-client-id
DATABRICKS_CLIENT_SECRET=your-client-secret

# Required
NODE_ENV=production
PORT=8000
```

### Step 3: Restart the Server

After setting credentials, restart your server:

```bash
# Stop the current server (Ctrl+C)

# Start with environment variables loaded
npm start
```

Or manually load the .env file:
```bash
export $(grep -v '^#' .env | xargs)
node server.js
```

### Step 4: Verify Connection

Test the connection:
```bash
# Check health
curl http://localhost:8000/api/databricks/health | python3 -m json.tool

# Test query
curl http://localhost:8000/api/databricks/test | python3 -m json.tool
```

## Where to Find Your Databricks Credentials

### 1. Server Hostname
- Go to your Databricks workspace
- Look at the URL: `https://[THIS-PART].cloud.databricks.com`
- Use only the hostname (without https://)

### 2. HTTP Path
- In Databricks, go to **SQL Warehouses**
- Click on your warehouse
- Go to **Connection Details** tab
- Copy the **HTTP Path** (looks like `/sql/1.0/warehouses/abc123def456`)

### 3. Personal Access Token
- In Databricks, click your user icon (top right)
- Go to **User Settings**
- Go to **Developer** tab
- Click **Manage** next to Access Tokens
- Click **Generate New Token**
- Copy the token (save it securely - you won't see it again!)

### 4. Service Principal (OAuth)
- In Databricks, go to **Admin Console**
- Go to **Service Principals**
- Create or select a service principal
- Note the **Application ID** (this is your Client ID)
- Generate a **Client Secret**
- Copy both values

## Common Issues

### Issue 1: "credentials": false
**Cause**: Environment variables not set  
**Fix**: Create .env file and restart server

### Issue 2: "Token request failed with status 401"
**Cause**: Invalid credentials  
**Fix**: Double-check your Client ID, Secret, or Token

### Issue 3: "Connection timeout"
**Cause**: Network issue or incorrect hostname  
**Fix**: Verify hostname and check firewall/VPN settings

### Issue 4: "ENOTFOUND" error
**Cause**: Incorrect server hostname  
**Fix**: Ensure hostname is correct (without https://)

### Issue 5: Server runs but Databricks still disconnected
**Cause**: Server was started before credentials were set  
**Fix**: Restart the server after setting credentials

## Testing Without Restarting Server

If you want to test credentials without restarting:

1. Set environment variables in your terminal:
```bash
export DATABRICKS_SERVER_HOSTNAME=your-workspace.cloud.databricks.com
export DATABRICKS_HTTP_PATH=/sql/1.0/warehouses/your-warehouse-id
export DATABRICKS_CLIENT_ID=your-client-id
export DATABRICKS_CLIENT_SECRET=your-client-secret
export NODE_ENV=production
```

2. Restart the server in that same terminal:
```bash
node server.js
```

## Production Deployment

For production deployment (e.g., Databricks Apps), set these as **Environment Variables** in your deployment configuration:

```
DATABRICKS_SERVER_HOSTNAME=your-workspace.cloud.databricks.com
DATABRICKS_HTTP_PATH=/sql/1.0/warehouses/your-warehouse-id
DATABRICKS_CLIENT_ID=your-client-id
DATABRICKS_CLIENT_SECRET=your-client-secret
NODE_ENV=production
PORT=8000
```

## Using the Setup Script

The `scripts/setup-databricks.sh` script helps you:
- Create a .env template
- Validate your configuration
- Test the connection
- Diagnose issues

Run it at any time:
```bash
./scripts/setup-databricks.sh
```

## Additional Help

If you're still having issues:

1. Check the server logs for detailed error messages
2. Verify your Databricks workspace is accessible
3. Test SQL warehouse connectivity in Databricks UI
4. Ensure your credentials have appropriate permissions

For more information, see:
- `DATABRICKS_SETUP.md` - Initial setup guide
- `DATABRICKS_PARTS_INTEGRATION.md` - Parts data integration
- `PRODUCTION_DEPLOYMENT.md` - Production deployment guide

