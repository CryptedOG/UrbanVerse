import uvicorn
import os
import sys

# Ensure backend folder is in Python path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

if __name__ == "__main__":
    print("=" * 60)
    print("  Starting UrbanVerse Backend API Server...")
    print("  Local URL:    http://127.0.0.1:8000")
    print("  Health Check: http://127.0.0.1:8000/api/health")
    print("  Zones API:    http://127.0.0.1:8000/api/zones")
    print("  Interactive:  http://127.0.0.1:8000/docs")
    print("=" * 60)
    uvicorn.run("app.main:app", host="127.0.0.1", port=8000, reload=True)
