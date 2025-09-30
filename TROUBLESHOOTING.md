# Troubleshooting Guide

## 504 Gateway Timeout Error

If you're seeing a 504 Gateway Timeout error when accessing the API, this means the backend server is not responding. Here are the steps to diagnose and fix:

### Symptoms
- API requests return `504 Gateway Timeout`
- Frontend loads but cannot fetch data
- Error occurs on endpoints like `/api/work-orders`

### Common Causes

#### 1. Backend Not Running
The most common cause is that the backend Flask server is not running or not accessible.

**Check if backend is running:**
```bash
# In Databricks Apps, check logs for backend startup messages
# Look for: "Starting Navy PdM Flask Backend Server"
# and: "Starting Gunicorn with X workers"

# Test backend health endpoint directly
curl http://localhost:8001/api/health
# Should return: {"status":"healthy","timestamp":"..."}
```

#### 2. Port Mismatch
The frontend proxy expects the backend on a specific port.

**Verify port configuration:**
- Frontend proxy: Uses `BACKEND_PORT` or `FLASK_RUN_PORT` environment variable (default: 8001)
- Backend server: Uses `FLASK_RUN_PORT` or `PORT` environment variable (default: 8001)

**For Databricks Apps:**
```bash
# Databricks typically uses:
PORT=8000           # Frontend
FLASK_RUN_PORT=8001 # Backend
```

#### 3. Database Initialization Taking Too Long
If the database is slow to initialize, requests may timeout before completion.

**Solutions:**
- Increased Gunicorn timeout to 120 seconds (already fixed)
- Set `GUNICORN_TIMEOUT` environment variable for longer timeout
- Check database logs for errors

#### 4. Worker Process Issues
Gunicorn workers might be crashing or not starting.

**Check worker count:**
```bash
# Default is 4 workers, but can be adjusted:
export GUNICORN_WORKERS=2  # Use fewer workers for limited resources
```

### Solutions

#### Quick Fix for All Production Deployments

1. **Use the universal startup command:**
   ```bash
   npm start
   ```
   This automatically:
   - Detects your deployment environment
   - Starts backend first and waits for it to be ready
   - Verifies health endpoint before starting frontend
   - Properly manages both processes

2. **For Databricks Apps, set start command to:**
   ```bash
   npm start
   ```

3. **Set required environment variables in Databricks Apps:**
   ```
   PORT=8000
   FLASK_RUN_PORT=8001
   GUNICORN_TIMEOUT=120
   GUNICORN_WORKERS=2
   NODE_ENV=production
   ```

#### Verify Backend Connectivity

1. **Check backend logs:**
   Look for these success messages:
   ```
   Database tables created successfully
   Starting Gunicorn with X workers, 120s timeout
   Server will be available at: http://0.0.0.0:8001
   ```

2. **Test health endpoint:**
   ```bash
   curl http://localhost:8001/api/health
   ```

3. **Test work orders endpoint:**
   ```bash
   curl http://localhost:8001/api/work-orders?limit=5
   ```

4. **Check frontend proxy:**
   ```bash
   curl http://localhost:8000/api/health
   ```
   This should proxy through to the backend.

#### Database Issues

If you see database errors:

1. **Initialize database manually:**
   ```bash
   cd backend
   python3 -c "from app import app, db; app.app_context().push(); db.create_all()"
   ```

2. **Check database file permissions:**
   ```bash
   ls -la backend/instance/
   # Should show navy_pdm.db with write permissions
   ```

3. **Verify database URL:**
   ```bash
   echo $DATABASE_URL
   # Should be set or defaults to sqlite:///navy_pdm.db
   ```

### Advanced Debugging

#### Enable Debug Logging

1. **Backend logs:**
   ```python
   # In backend/app.py, the logging is already enabled
   # Check for INFO level messages
   ```

2. **Frontend proxy logs:**
   The proxy middleware already has `logLevel: 'debug'` enabled.

3. **Gunicorn logs:**
   Now configured to log to stdout/stderr with `--log-level info`

#### Check Process Status

```bash
# Find backend process
ps aux | grep gunicorn
ps aux | grep python

# Find frontend process
ps aux | grep node
```

#### Network Connectivity

```bash
# Check if ports are listening
netstat -an | grep LISTEN | grep -E '8000|8001'

# Or use lsof
lsof -i :8000
lsof -i :8001
```

### Databricks Apps Specific Issues

#### Single Process Limitation
Databricks Apps might require a single entry point. Our startup script handles this by:
1. Starting backend in background
2. Waiting for backend health check
3. Starting frontend in foreground

#### Resource Limits
If you have limited resources:
```bash
export GUNICORN_WORKERS=1  # Use single worker
export GUNICORN_TIMEOUT=180  # Increase timeout
```

#### CORS Issues
The backend automatically configures CORS based on `DATABRICKS_APP_URL`. Make sure this environment variable is set by Databricks Apps.

### Prevention

1. **Always use the startup script** for Databricks Apps deployment
2. **Monitor health endpoint** regularly
3. **Check logs** during deployment
4. **Set appropriate timeouts** based on your database size
5. **Use fewer workers** if you have limited resources

### Getting Help

If you're still experiencing issues:

1. Check backend logs for errors
2. Verify all environment variables are set correctly
3. Test backend health endpoint directly
4. Ensure database is initialized and accessible
5. Check that both processes are running

For persistent issues, collect:
- Backend startup logs
- Frontend proxy error messages  
- Output of health endpoint test
- Process list (`ps aux | grep -E 'gunicorn|node'`)

