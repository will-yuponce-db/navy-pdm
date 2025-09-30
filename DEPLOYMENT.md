# Deployment Guide

## Environment Variables

### Frontend (React Router)
Set these environment variables in your deployment platform:

- `VITE_API_URL`: The full URL to your backend API (e.g., `https://your-backend-domain.com/api`)

### Backend (Flask)
Set these environment variables in your deployment platform:

- `HOST`: The host to bind to (default: `0.0.0.0`)
- `PORT`: The port to bind to (default: `5000`)
- `CORS_ORIGINS`: Comma-separated list of allowed origins (e.g., `https://your-frontend-domain.com,https://www.your-frontend-domain.com`)
- `DATABASE_URL`: Database connection string (default: SQLite)

## Deployment Examples

### Vercel (Frontend)
```bash
# Set environment variable in Vercel dashboard
VITE_API_URL=https://your-backend-domain.com/api
```

### Railway/Heroku (Backend)
```bash
# Set environment variables
HOST=0.0.0.0
PORT=5000
CORS_ORIGINS=https://your-frontend-domain.com
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
If you see CORS errors, make sure to set the `CORS_ORIGINS` environment variable with your frontend domain.

### API Connection Refused
If you see `ERR_CONNECTION_REFUSED`, check that:
1. Your backend is running and accessible
2. The `VITE_API_URL` environment variable is set correctly
3. Your backend CORS configuration allows your frontend domain

### Environment Variables Not Loading
Make sure your deployment platform is configured to inject environment variables at build time for the frontend, and at runtime for the backend.
