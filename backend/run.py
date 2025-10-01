#!/usr/bin/env python3
"""
Run script for the Flask backend server
"""

import os
import sys

# Check for virtual environment and prevent usage
def check_virtual_environment():
    """Check if running in a virtual environment and exit if so"""
    venv_indicators = [
        'VIRTUAL_ENV' in os.environ,
        'CONDA_DEFAULT_ENV' in os.environ,
        'CONDA_PREFIX' in os.environ,
        'PIPENV_ACTIVE' in os.environ,
        'POETRY_ACTIVE' in os.environ,
        hasattr(sys, 'real_prefix'),
        (hasattr(sys, 'base_prefix') and sys.base_prefix != sys.prefix)
    ]
    
    if any(venv_indicators):
        print("⚠️  ERROR: Virtual environment detected!")
        print("   This script requires system Python, not virtual environment.")
        print("   Please deactivate your virtual environment and try again.")
        print("   Run: deactivate")
        sys.exit(1)

# Check for virtual environment before proceeding
check_virtual_environment()

from app import app, db

if __name__ == "__main__":
    with app.app_context():
        db.create_all()

    print("Starting Navy PdM Flask Backend Server...")
    print("Server will be available at: http://localhost:5000")
    print("API endpoints available at: http://localhost:5000/api/")
    print("Health check: http://localhost:5000/api/health")

    app.run(debug=True, host="0.0.0.0", port=5000)
