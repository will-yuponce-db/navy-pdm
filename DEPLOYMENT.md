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
The application is configured to work automatically with Databricks Apps. The following environment variables are automatically provided:

```bash
# Automatically provided by Databricks Apps
DATABRICKS_APP_NAME=navy-pdm
DATABRICKS_APP_PORT=8000
DATABRICKS_APP_URL=https://navy-pdm-1444828305810485.aws.databricksapps.com
FLASK_RUN_HOST=0.0.0.0
FLASK_RUN_PORT=8000
PORT=8000
```

### Other Platforms
For other deployment platforms, you may need to set these environment variables manually:

```bash
# Frontend
VITE_API_URL=https://your-backend-domain.com/api

# Backend
FLASK_RUN_HOST=0.0.0.0
FLASK_RUN_PORT=8000
DATABRICKS_APP_URL=https://your-app-domain.com
DATABASE_URL=postgresql://user:password@host:port/database
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

### CORS Errors
If you see CORS errors, the backend automatically configures CORS based on the `DATABRICKS_APP_URL` environment variable. For Databricks Apps, this is automatically provided.

### API Connection Refused
If you see `ERR_CONNECTION_REFUSED`, check that:
1. Your backend is running and accessible on the correct port (8000 for Databricks Apps)
2. The frontend is using the correct API URL (automatically detected in production)
3. Your backend CORS configuration allows your frontend domain

### Environment Variables Not Loading
For Databricks Apps, all required environment variables are automatically provided. For other platforms, make sure your deployment platform is configured to inject environment variables at build time for the frontend, and at runtime for the backend.

### Port Configuration
- **Databricks Apps**: Uses port 8000 (automatically configured)
- **Development**: Uses port 5000 (default Flask port)
- **Other platforms**: May need to set `FLASK_RUN_PORT` environment variable
