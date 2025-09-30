# 504 Gateway Timeout - Fix Summary

## What Was Fixed

The 504 Gateway Timeout error was caused by several configuration issues:

### 1. **Port Configuration Issues**
- **Problem**: Frontend proxy was hardcoded to `localhost:8001` without flexibility
- **Fix**: Made backend URL configurable via environment variables (`BACKEND_URL`, `BACKEND_PORT`, `FLASK_RUN_PORT`)

### 2. **Timeout Too Short**
- **Problem**: Gunicorn timeout was 30 seconds, which may be too short for database initialization
- **Fix**: Increased default timeout to 120 seconds, configurable via `GUNICORN_TIMEOUT`

### 3. **No Startup Coordination**
- **Problem**: Frontend and backend started independently without ensuring backend was ready
- **Fix**: Created universal `start_production.sh` script that:
  - Automatically detects deployment environment (Databricks, Docker, or standard)
  - Starts backend first
  - Waits for backend health check to pass
  - Then starts frontend
  - Properly manages both processes with graceful shutdown

### 4. **Limited Error Visibility**
- **Problem**: No detailed error reporting when proxy failed
- **Fix**: Added comprehensive error handling and logging:
  - Proxy error handler with detailed messages
  - Gunicorn access/error logs to stdout/stderr
  - Backend startup confirmation messages

### 5. **No Health Check Tooling**
- **Problem**: Difficult to diagnose if backend was running correctly
- **Fix**: Created `backend/health_check.py` script for quick diagnosis

## Files Modified

1. **server.js** - Enhanced proxy configuration with environment variables and error handling
2. **backend/start_production.py** - Increased timeout, added logging, made workers configurable
3. **DEPLOYMENT.md** - Updated with universal deployment instructions
4. **package.json** - Simplified to one `start` command for all production deployments
5. **TROUBLESHOOTING.md** - New comprehensive troubleshooting guide
6. **start_production.sh** - New universal startup script that works everywhere
7. **backend/health_check.py** - New diagnostic script

## How to Deploy the Fix

### Step 1: Update Your Databricks Apps Configuration

Add these environment variables in your Databricks Apps settings:

```bash
# Required
PORT=8000
FLASK_RUN_PORT=8001
FLASK_RUN_HOST=0.0.0.0
NODE_ENV=production

# Recommended  
GUNICORN_TIMEOUT=120
GUNICORN_WORKERS=2

# Automatically provided by Databricks
DATABRICKS_APP_URL=https://navy-pdm-1444828305810485.aws.databricksapps.com
```

### Step 2: Update Startup Command

Set your Databricks Apps startup command to:

```bash
npm start
```

That's it! This single command works for Databricks, Docker, and any other deployment platform.

### Step 3: Commit and Push Changes

```bash
git add .
git commit -m "Fix 504 timeout: improve startup coordination and increase timeouts"
git push
```

### Step 4: Redeploy to Databricks Apps

Trigger a new deployment in Databricks Apps with the updated code and environment variables.

## Verification Steps

After deployment, check the logs for these success indicators:

### 1. Backend Startup
Look for these messages:
```
Starting Navy PdM Flask Backend Server (Production Mode)...
Server will be available at: http://0.0.0.0:8001
Starting Gunicorn with 2 workers, 120s timeout
```

### 2. Backend Health Check
The startup script will show:
```
Waiting for backend to be ready...
✓ Backend is ready!
```

### 3. Frontend Startup
Look for:
```
Starting Node.js frontend server on port 8000...
Server running on port 8000
API proxy configured for /api -> http://localhost:8001
```

## Testing Locally

Before deploying, test the fix locally:

### Test 1: Run Health Check
```bash
cd backend
python3 health_check.py
```

Should output:
```
✓ Backend is healthy!
✓ Work orders endpoint is working!
```

### Test 2: Test Full Stack
```bash
# From project root
npm start
```

The script will:
1. Build the frontend
2. Start the backend
3. Wait for backend health check
4. Start the frontend

Watch for the backend to become ready, then the frontend to start.

### Test 3: Test API
In another terminal:
```bash
# Test health
curl http://localhost:8000/api/health

# Test work orders
curl http://localhost:8000/api/work-orders?limit=5
```

## If You Still See 504 Errors

### Immediate Checks

1. **Verify backend is running:**
   ```bash
   curl http://localhost:8001/api/health
   ```

2. **Check logs for errors:**
   - Look for Python/Gunicorn errors
   - Look for database initialization errors
   - Look for port binding errors

3. **Run health check script:**
   ```bash
   cd backend
   python3 health_check.py
   ```

### Common Issues

**Backend not starting:**
- Check Python dependencies are installed
- Verify database permissions
- Check for port conflicts

**Still timing out:**
- Increase `GUNICORN_TIMEOUT` to 180 or 240
- Reduce `GUNICORN_WORKERS` to 1 if resources are limited
- Check database size/initialization time

**Connection refused:**
- Verify `FLASK_RUN_PORT=8001` is set
- Check that backend process is actually running
- Verify no firewall blocking localhost connections

### Get Detailed Help

See the comprehensive troubleshooting guide:
```bash
cat TROUBLESHOOTING.md
```

Or review specific sections:
- [504 Gateway Timeout](./TROUBLESHOOTING.md#504-gateway-timeout-error)
- [Backend Not Running](./TROUBLESHOOTING.md#1-backend-not-running)
- [Port Mismatch](./TROUBLESHOOTING.md#2-port-mismatch)

## Summary of Key Changes

| What | Before | After |
|------|--------|-------|
| Gunicorn Timeout | 30s | 120s (configurable) |
| Backend URL | Hardcoded | Environment variable |
| Startup | Concurrent, uncoordinated | Sequential, verified |
| Error Handling | Basic | Detailed with messages |
| Logging | Minimal | Comprehensive |
| Diagnostics | Manual | Automated script |

## Expected Behavior

After applying this fix:

1. ✅ Backend starts and initializes database
2. ✅ Health check confirms backend is ready
3. ✅ Frontend starts and connects to backend
4. ✅ API requests succeed without timeouts
5. ✅ Detailed logs help diagnose any issues

## Support

If you continue to experience issues:

1. Collect the startup logs
2. Run the health check script and save output
3. Note any specific error messages
4. Check the TROUBLESHOOTING.md guide
5. Verify all environment variables are set correctly

The fix addresses the root causes of the 504 timeout and provides better tooling for diagnosing any remaining issues.

