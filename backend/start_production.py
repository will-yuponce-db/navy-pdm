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
    print("Server will be available at: http://localhost:5000")
    print("API endpoints available at: http://localhost:5000/api/")
    print("Health check: http://localhost:5000/api/health")
    
    # Gunicorn configuration
    bind = "0.0.0.0:5000"
    workers = 4
    worker_class = "sync"
    worker_connections = 1000
    timeout = 30
    keepalive = 2
    max_requests = 1000
    max_requests_jitter = 100
    preload_app = True
    
    # Start with Gunicorn
    os.system(f"gunicorn --bind {bind} --workers {workers} --worker-class {worker_class} --worker-connections {worker_connections} --timeout {timeout} --keepalive {keepalive} --max-requests {max_requests} --max-requests-jitter {max_requests_jitter} --preload app:app")
