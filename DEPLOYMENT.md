# Deployment Guide

## Environment Variables

### Frontend (React Router)
The frontend automatically detects the correct API URL based on the environment:
- **Development**: Uses `http://localhost:5000/api`
- **Production**: Uses `${window.location.origin}/api` (relative to current domain)

### Backend (Flask)
The backend uses these environment variables (automatically provided by Databricks Apps):

- `FLASK_RUN_HOST`: The host to bind to (default: `0.0.0.0`)
- `FLASK_RUN_PORT`: The port to bind to (default: `8000` for Databricks Apps)
- `DATABRICKS_APP_URL`: The full URL of your Databricks App (e.g., `https://navy-pdm-1444828305810485.aws.databricksapps.com`)
- `DATABASE_URL`: Database connection string (default: SQLite)

## Deployment Examples

### Databricks Apps (Recommended)

#### Quick Start
```bash
# One universal command for all production deployments
npm start
```

The application automatically detects the deployment environment and configures itself accordingly.

#### Required Environment Variables
Set these in your Databricks Apps configuration:

```bash
# Automatically provided by Databricks Apps
DATABRICKS_APP_NAME=navy-pdm
DATABRICKS_APP_URL=https://navy-pdm-1444828305810485.aws.databricksapps.com

# You should set these (with recommended defaults):
PORT=8000                # Frontend port (Databricks default)
FLASK_RUN_PORT=8001      # Backend port
FLASK_RUN_HOST=0.0.0.0
NODE_ENV=production
GUNICORN_WORKERS=2       # Adjust based on available resources
GUNICORN_TIMEOUT=120     # Seconds to wait for requests
```

#### Startup Command
In your Databricks Apps configuration, set the start command to:
```bash
npm start
```

That's it! The startup script automatically:
- Detects it's running on Databricks Apps
- Installs Python dependencies
- Starts backend and waits for health check
- Starts frontend with proper configuration
- Handles graceful shutdown

### Other Platforms

The same `npm start` command works everywhere! Just set environment variables for your platform:

#### Heroku / Render / Railway
```bash
PORT=8000
FLASK_RUN_PORT=8001
FLASK_RUN_HOST=0.0.0.0
NODE_ENV=production
DATABASE_URL=postgresql://user:password@host:port/database  # Optional
```

#### Traditional VPS / EC2
```bash
# Same as above, runs with: npm start
PORT=8000
FLASK_RUN_PORT=8001
NODE_ENV=production
```

#### Local Production Testing
```bash
# No environment variables needed, just run:
npm start
# Defaults to ports 8000 (frontend) and 8001 (backend)
```

### Docker
```dockerfile
# Frontend Dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]

# Backend Dockerfile
FROM python:3.11-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt
COPY . .
EXPOSE 5000
CMD ["python", "start_production.py"]
```

## Common Issues

For detailed troubleshooting, see [TROUBLESHOOTING.md](./TROUBLESHOOTING.md).

### 504 Gateway Timeout
**Symptoms:** API requests fail with 504 timeout error

**Quick Fix:**
1. Ensure backend is running on port 8001
2. Use `npm start` - the startup script ensures proper coordination
3. Increase `GUNICORN_TIMEOUT` to 120 or higher (already default)

See [TROUBLESHOOTING.md](./TROUBLESHOOTING.md#504-gateway-timeout-error) for detailed steps.

### CORS Errors
If you see CORS errors, the backend automatically configures CORS based on the `DATABRICKS_APP_URL` environment variable. For Databricks Apps, this is automatically provided.

### API Connection Refused
If you see `ERR_CONNECTION_REFUSED`, check that:
1. Your backend is running and accessible on the correct port (8001 for backend)
2. The frontend proxy is configured to point to the correct backend URL
3. Your backend CORS configuration allows your frontend domain

**Verify backend is running:**
```bash
curl http://localhost:8001/api/health
```

### Environment Variables Not Loading
For Databricks Apps, some environment variables are automatically provided, but you need to set:
- `FLASK_RUN_PORT=8001`
- `GUNICORN_TIMEOUT=120`
- `GUNICORN_WORKERS=2`

### Port Configuration
- **Databricks Apps**: 
  - Frontend: port 8000 (automatically configured)
  - Backend: port 8001 (set via `FLASK_RUN_PORT`)
- **Development**: 
  - Frontend: port 3000
  - Backend: port 5000 (default Flask port)
- **Other platforms**: May need to set `FLASK_RUN_PORT` and `PORT` environment variables

### Backend Not Starting
If the backend fails to start:
1. Check that all Python dependencies are installed
2. Verify database can be initialized
3. Check logs for error messages
4. Try starting backend manually: `cd backend && python3 start_production.py`
