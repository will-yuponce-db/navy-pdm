#!/usr/bin/env python3
"""
Quick health check script for the Navy PdM backend
Run this to verify the backend is working correctly
"""

import sys
import os
import requests
from time import sleep

def check_health(port=8001, max_retries=5):
    """Check if the backend is healthy"""
    url = f"http://localhost:{port}/api/health"
    
    print(f"Checking backend health at {url}")
    print(f"Will retry up to {max_retries} times...\n")
    
    for attempt in range(1, max_retries + 1):
        try:
            response = requests.get(url, timeout=5)
            if response.status_code == 200:
                data = response.json()
                print(f"✓ Backend is healthy!")
                print(f"  Status: {data.get('status')}")
                print(f"  Timestamp: {data.get('timestamp')}")
                return True
            else:
                print(f"✗ Attempt {attempt}/{max_retries}: Got status code {response.status_code}")
        except requests.exceptions.ConnectionError:
            print(f"✗ Attempt {attempt}/{max_retries}: Connection refused - backend may not be running")
        except requests.exceptions.Timeout:
            print(f"✗ Attempt {attempt}/{max_retries}: Request timed out")
        except Exception as e:
            print(f"✗ Attempt {attempt}/{max_retries}: {str(e)}")
        
        if attempt < max_retries:
            print(f"  Waiting 2 seconds before retry...")
            sleep(2)
    
    print(f"\n✗ Backend health check failed after {max_retries} attempts")
    return False

def check_work_orders(port=8001):
    """Check if work orders endpoint is accessible"""
    url = f"http://localhost:{port}/api/work-orders?limit=1"
    
    print(f"\nChecking work orders endpoint at {url}")
    
    try:
        response = requests.get(url, timeout=10)
        if response.status_code == 200:
            data = response.json()
            print(f"✓ Work orders endpoint is working!")
            print(f"  Total work orders: {data.get('total', 0)}")
            print(f"  Page size: {data.get('pageSize', 0)}")
            return True
        else:
            print(f"✗ Got status code {response.status_code}")
            print(f"  Response: {response.text[:200]}")
            return False
    except Exception as e:
        print(f"✗ Error: {str(e)}")
        return False

def main():
    port = int(os.environ.get('FLASK_RUN_PORT', 8001))
    
    print("=" * 50)
    print("Navy PdM Backend Health Check")
    print("=" * 50)
    print(f"Backend port: {port}")
    print()
    
    # Check health endpoint
    if not check_health(port):
        print("\n" + "=" * 50)
        print("DIAGNOSIS:")
        print("=" * 50)
        print("The backend is not responding. Possible causes:")
        print("1. Backend is not running")
        print("   → Start with: cd backend && python3 start_production.py")
        print("2. Backend is on a different port")
        print("   → Set FLASK_RUN_PORT environment variable")
        print("3. Backend crashed during startup")
        print("   → Check backend logs for errors")
        print("4. Database initialization failed")
        print("   → Run: cd backend && python3 -c 'from app import app, db; app.app_context().push(); db.create_all()'")
        sys.exit(1)
    
    # Check work orders endpoint
    check_work_orders(port)
    
    print("\n" + "=" * 50)
    print("✓ All checks passed!")
    print("=" * 50)
    print("\nYour backend is working correctly.")
    print("If you're still seeing 504 errors in production:")
    print("1. Verify frontend proxy is pointing to the correct backend URL")
    print("2. Check that CORS is properly configured")
    print("3. Review the TROUBLESHOOTING.md guide")

if __name__ == '__main__':
    try:
        import requests
    except ImportError:
        print("Error: 'requests' library is required")
        print("Install with: pip install requests")
        sys.exit(1)
    
    main()

