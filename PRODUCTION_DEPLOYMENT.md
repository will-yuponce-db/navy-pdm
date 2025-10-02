# Universal Production Deployment

## One Command. Any Platform.

```bash
npm start
```

That's it! This single command automatically handles production deployment for:
- ✅ Databricks Apps
- ✅ Docker containers
- ✅ Traditional servers (VPS, EC2, etc.)
- ✅ Platform-as-a-Service (Heroku, Render, Railway)
- ✅ Local production testing

## How It Works

The `start_production.sh` script:

1. **Detects Environment**
   - Automatically identifies if running on Databricks, Docker, or standard server
   - Sets appropriate defaults for each platform

2. **Installs Dependencies**
   - Installs Python packages with appropriate flags for the environment
   - Handles system package restrictions gracefully

3. **Starts Backend First**
   - Launches Flask/Gunicorn backend on port 8001
   - Runs in background with proper process management

4. **Health Check**
   - Waits up to 30 seconds for backend to be ready
   - Verifies `/api/health` endpoint responds
   - Fails fast with helpful error messages if backend doesn't start

5. **Starts Frontend**
   - Launches Node.js/Express frontend on port 8000
   - Proxies `/api` requests to backend
   - Serves React Router application

6. **Graceful Shutdown**
   - Handles Ctrl+C and termination signals
   - Cleanly stops both frontend and backend
   - No orphaned processes

## Environment Variables

### Required (with smart defaults)
```bash
PORT=8000              # Frontend port
FLASK_RUN_PORT=8001    # Backend port
NODE_ENV=production    # Environment mode
```

### Optional (recommended for production)
```bash
GUNICORN_WORKERS=2     # Number of workers (adjust based on CPU)
GUNICORN_TIMEOUT=120   # Request timeout in seconds
FLASK_RUN_HOST=0.0.0.0 # Bind to all interfaces
DATABASE_URL=...       # Database connection (defaults to SQLite)
```

### Databricks-specific (automatically provided)
```bash
DATABRICKS_APP_URL=https://your-app.databricksapps.com
DATABRICKS_APP_NAME=navy-pdm
```

## Platform-Specific Instructions

### Databricks Apps

**Startup Command:**
```bash
npm start
```

**Required Environment Variables:**
```bash
PORT=8000
FLASK_RUN_PORT=8001
GUNICORN_TIMEOUT=120
GUNICORN_WORKERS=2
```

### Docker

**Dockerfile:**
```dockerfile
FROM node:18

WORKDIR /app

# Install Python for backend
RUN apt-get update && apt-get install -y python3 python3-pip

# Copy package files
COPY package*.json ./
COPY backend/requirements.txt ./backend/

# Install dependencies
RUN npm ci --only=production

# Copy application
COPY . .

# Build frontend
RUN npm run build

# Expose ports
EXPOSE 8000

# Start application
CMD ["npm", "start"]
```

**Run:**
```bash
docker build -t navy-pdm .
docker run -p 8000:8000 -e NODE_ENV=production navy-pdm
```

### Traditional Server (VPS, EC2)

**Setup:**
```bash
# Clone repository
git clone <your-repo>
cd navy-pdm

# Install Node.js and Python
# (varies by OS)

# Install dependencies
npm ci
cd backend && pip install -r requirements.txt && cd ..

# Start
npm start
```

**Systemd Service** (optional):
```ini
[Unit]
Description=Navy PdM Application
After=network.target

[Service]
Type=simple
User=appuser
WorkingDirectory=/opt/navy-pdm
Environment="NODE_ENV=production"
Environment="PORT=8000"
Environment="FLASK_RUN_PORT=8001"
ExecStart=/usr/bin/npm start
Restart=always

[Install]
WantedBy=multi-user.target
```

### Heroku / Render / Railway

**Setup:**
1. Connect your Git repository
2. Set environment variables in platform dashboard
3. Set build command: `npm run build`
4. Set start command: `npm start`

**Procfile** (if needed):
```
web: npm start
```

## Local Production Testing

Test the production setup locally:

```bash
# No special environment variables needed
npm start
```

Access at:
- Frontend: http://localhost:8000
- Backend API: http://localhost:8001/api

## Troubleshooting

### Backend Not Starting

**Symptoms:**
```
✗ Backend failed to start within 30 seconds
```

**Solutions:**
1. Check Python dependencies: `cd backend && pip install -r requirements.txt`
2. Verify database permissions: `ls -la backend/instance/`
3. Check for port conflicts: `lsof -i :8001`
4. Review backend logs for errors

### Port Already in Use

**Symptoms:**
```
Error: listen EADDRINUSE: address already in use :::8000
```

**Solutions:**
1. Find and kill the process: `lsof -ti:8000 | xargs kill -9`
2. Change ports: `PORT=3000 FLASK_RUN_PORT=5000 npm start`

### Permission Denied

**Symptoms:**
```
bash: ./start_production.sh: Permission denied
```

**Solution:**
```bash
chmod +x start_production.sh
```

### Database Errors

**Symptoms:**
```
sqlalchemy.exc.OperationalError: unable to open database file
```

**Solutions:**
1. Create instance directory: `mkdir -p backend/instance`
2. Check permissions: `chmod 755 backend/instance`
3. Initialize database manually:
   ```bash
   cd backend
   python3 -c "from app import app, db; app.app_context().push(); db.create_all()"
   ```

## Health Check Script

Run diagnostics anytime:

```bash
cd backend
python3 health_check.py
```

This will:
- ✅ Check if backend is responding
- ✅ Test health endpoint
- ✅ Verify work orders endpoint
- ✅ Provide troubleshooting tips if issues found

## What Makes This Universal?

### Environment Detection
```bash
if [ -n "$DATABRICKS_APP_URL" ]; then
  ENV_TYPE="Databricks Apps"
elif [ -f /.dockerenv ]; then
  ENV_TYPE="Docker"
else
  ENV_TYPE="Standard"
fi
```

### Smart Defaults
```bash
export PORT=${PORT:-8000}
export FLASK_RUN_PORT=${FLASK_RUN_PORT:-8001}
export GUNICORN_TIMEOUT=${GUNICORN_TIMEOUT:-120}
```

### Flexible Dependency Installation
```bash
# Tries with --break-system-packages for restricted environments
# Falls back to standard pip install
python3 -m pip install -r requirements.txt --break-system-packages 2>/dev/null || \
  python3 -m pip install -r requirements.txt
```

### Process Management
```bash
# Background process with PID tracking
python3 start_production.py &
BACKEND_PID=$!

# Cleanup on exit
trap cleanup EXIT INT TERM
```

## Migration from Old Setup

If you were using different commands before:

**Old:**
```bash
npm run start:databricks  # For Databricks
npm run start:production  # For other platforms
npm run prod:stack        # For local testing
```

**New:**
```bash
npm start  # Works everywhere!
```

## Summary

✅ **One command** for all production deployments
✅ **Automatic** environment detection
✅ **Smart defaults** that work everywhere  
✅ **Coordinated startup** prevents 504 errors
✅ **Health checks** ensure backend is ready
✅ **Graceful shutdown** cleans up processes
✅ **Comprehensive logging** for troubleshooting

Deploy with confidence using `npm start`!



