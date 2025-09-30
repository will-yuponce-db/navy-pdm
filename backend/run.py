#!/usr/bin/env python3
"""
Run script for the Flask backend server
"""

from app import app, db

if __name__ == '__main__':
    with app.app_context():
        db.create_all()
    
    print("Starting Navy PdM Flask Backend Server...")
    print("Server will be available at: http://localhost:5000")
    print("API endpoints available at: http://localhost:5000/api/")
    print("Health check: http://localhost:5000/api/health")
    
    app.run(debug=True, host='0.0.0.0', port=5000)
