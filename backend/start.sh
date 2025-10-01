#!/bin/bash

# Navy PdM Flask Backend Startup Script

echo "Starting Navy PdM Flask Backend..."

# Check for virtual environment and prevent usage
if [ -n "$VIRTUAL_ENV" ] || [ -n "$CONDA_DEFAULT_ENV" ] || [ -n "$CONDA_PREFIX" ] || [ -n "$PIPENV_ACTIVE" ] || [ -n "$POETRY_ACTIVE" ]; then
    echo "⚠️  ERROR: Virtual environment detected!"
    echo "   This script requires system Python, not virtual environment."
    echo "   Please deactivate your virtual environment and try again."
    echo "   Run: deactivate"
    exit 1
fi

# Check if Python is installed
if ! command -v python3 &> /dev/null; then
    echo "Python 3 is not installed. Please install Python 3 first."
    exit 1
fi

# Check if pip is installed
if ! command -v pip3 &> /dev/null; then
    echo "pip3 is not installed. Please install pip3 first."
    exit 1
fi

# Install dependencies if requirements.txt exists
if [ -f "requirements.txt" ]; then
    echo "Installing Python dependencies..."
    pip3 install -r requirements.txt
fi

# Check if database exists, if not run seed script
if [ ! -f "navy_pdm.db" ]; then
    echo "Database not found. Seeding database with initial data..."
    python3 seed_data.py
fi

# Start the Flask server
echo "Starting Flask server on http://localhost:5000"
python3 run.py
