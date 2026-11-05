import os
from pathlib import Path
from typing import List

# Paths
APP_DIR = Path(__file__).resolve().parent
BACKEND_DIR = APP_DIR.parent
PROJECT_ROOT = BACKEND_DIR.parent
DATA_DIR = PROJECT_ROOT / "data"
GEOJSON_PATH = DATA_DIR / "pilot-area.geojson"

# Default Area Identifiers
DEFAULT_AREA_ID = "urbanverse-pilot"
SUPPORTED_AREA_IDS = ["urbanverse-pilot", "pilot-area-01"]

# CORS Origins
CORS_ORIGINS: List[str] = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "http://localhost:8080",
    "http://127.0.0.1:8080",
    "http://localhost:8000",
    "http://127.0.0.1:8000",
    "*",
]

# Service Metadata
SERVICE_NAME = "UrbanVerse Multi-Hazard Resilience Backend API"
SERVICE_VERSION = "2.0.0"
DISCLAIMER_TEXT = "Simulation only; not a live emergency warning. Results are estimated for prototype demonstration."
