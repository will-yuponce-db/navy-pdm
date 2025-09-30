#!/usr/bin/env python3
"""
Production start script for the Flask backend server using Gunicorn
"""

import os
import sys
from app import app, db

if __name__ == '__main__':
    with app.app_context():
        db.create_all()
    
    print("Starting Navy PdM Flask Backend Server (Production Mode)...")
    host = os.environ.get('FLASK_RUN_HOST', os.environ.get('HOST', '0.0.0.0'))
    port = os.environ.get('FLASK_RUN_PORT', os.environ.get('PORT', '8000'))
    databricks_app_url = os.environ.get('DATABRICKS_APP_URL', '')
    
    print(f"Server will be available at: http://{host}:{port}")
    print(f"API endpoints available at: http://{host}:{port}/api/")
    print(f"Health check: http://{host}:{port}/api/health")
    if databricks_app_url:
        print(f"Databricks App URL: {databricks_app_url}")
    
    # Gunicorn configuration
    bind = f"{host}:{port}"
    workers = 4
    worker_class = "sync"
    timeout = 30
    max_requests = 1000
    max_requests_jitter = 100
    preload_app = True
    
    # Start with Gunicorn
    os.system(f"gunicorn --bind {bind} --workers {workers} --worker-class {worker_class} --timeout {timeout} --max-requests {max_requests} --max-requests-jitter {max_requests_jitter} --preload app:app")
