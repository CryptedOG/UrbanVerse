# UrbanVerse Backend

FastAPI backend service for the **UrbanVerse** City-Scale Digital Twin for Multi-Hazard Prediction and Urban Resilience Planning (Mangalore Pilot MVP).

---

## 1. Quick Start

### Step 1: Open Terminal in `backend/`
```powershell
cd UrbanVerse/backend
```

### Step 2: Activate the Virtual Environment
On Windows PowerShell:
```powershell
.\.venv\Scripts\Activate.ps1
```
*(If installing on a new machine where packages are not yet installed)*:
```powershell
pip install -r requirements.txt
```

### Step 3: Run the Server
```powershell
python run.py
```
Or directly with uvicorn:
```powershell
uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```

---

## 2. Server Endpoints & URLs

* **Base URL:** `http://127.0.0.1:8000`
* **Interactive API Documentation (Swagger UI):** `http://127.0.0.1:8000/docs`
* **Health Check:** `http://127.0.0.1:8000/api/health`
* **Urban Zones (GIS):** `http://127.0.0.1:8000/api/zones`
* **Simulation Engine:** `http://127.0.0.1:8000/api/simulate`

---

## 3. Official Zone IDs & API Contracts

### Official UrbanVerse Zones
* **UV001** – Residential Zone
* **UV002** – Commercial Zone
* **UV003** – Industrial Zone
* **UV004** – Riverside Zone

*(Coordinates are provisional demo boundaries until Member 3 / GIS provides the final GeoJSON dataset).*

### A. Health Check: `GET /api/health`
* **Response (200 OK):**
```json
{
  "status": "ok",
  "service": "UrbanVerse Backend API",
  "version": "1.0.0",
  "simulation_only": true
}
```

### B. Urban Zones: `GET /api/zones`
Returns the 4 official UrbanVerse pilot zones with provisional map coordinates and GeoJSON polygons.
* **Sample Response (200 OK):**
```json
{
  "area_id": "urbanverse-pilot",
  "area_name": "UrbanVerse Pilot Zone",
  "count": 4,
  "zones": [
    {
      "zone_id": "UV001",
      "name": "Residential Zone",
      "description": "Provisional coordinates for Residential Zone. Elevated residential district...",
      "elevation_m": 38.0,
      "center": {"latitude": 12.8805, "longitude": 74.858},
      "polygon": [[74.852, 12.877], [74.864, 12.877], [74.863, 12.885], [74.853, 12.884], [74.852, 12.877]]
    },
    {
      "zone_id": "UV002",
      "name": "Commercial Zone",
      "description": "Provisional coordinates for Commercial Zone. High-density commercial district...",
      "elevation_m": 14.0,
      "center": {"latitude": 12.8682, "longitude": 74.8436},
      "polygon": [[74.84, 12.865], [74.848, 12.865], [74.848, 12.872], [74.841, 12.872], [74.84, 12.865]]
    },
    {
      "zone_id": "UV003",
      "name": "Industrial Zone",
      "description": "Provisional coordinates for Industrial Zone. Coastal transit and industrial strip...",
      "elevation_m": 5.0,
      "center": {"latitude": 12.951, "longitude": 74.809},
      "polygon": [[74.803, 12.945], [74.815, 12.945], [74.814, 12.956], [74.804, 12.955], [74.803, 12.945]]
    },
    {
      "zone_id": "UV004",
      "name": "Riverside Zone",
      "description": "Provisional coordinates for Riverside Zone. Low-lying riverfront basin...",
      "elevation_m": 3.5,
      "center": {"latitude": 12.8732, "longitude": 74.8344},
      "polygon": [[74.83, 12.87], [74.838, 12.87], [74.839, 12.876], [74.832, 12.877], [74.83, 12.87]]
    }
  ],
  "simulation_only": true,
  "disclaimer": "Simulation only; not a live emergency warning."
}
```

### C. Flood Risk Simulation: `POST /api/simulate`
* **Sample Request:**
```json
{
  "rainfall_mm": 80,
  "area_id": "urbanverse-pilot"
}
```
* **Sample Response (200 OK):**
```json
{
  "area_id": "urbanverse-pilot",
  "rainfall_mm": 80.0,
  "zones": [
    {
      "zone_id": "UV001",
      "zone_name": "Residential Zone",
      "risk_score": 30,
      "risk_level": "Low",
      "explanation": "Rainfall of 80.0 mm remains within manageable drainage capacity given Residential Zone's 38.0m elevation."
    },
    {
      "zone_id": "UV002",
      "zone_name": "Commercial Zone",
      "risk_score": 67,
      "risk_level": "Medium",
      "explanation": "Moderate surface accumulation expected in Commercial Zone. Stormwater channels near capacity; local street ponding likely."
    },
    {
      "zone_id": "UV003",
      "zone_name": "Industrial Zone",
      "risk_score": 77,
      "risk_level": "High",
      "explanation": "Severe waterlogging hazard for Industrial Zone under 80.0 mm rainfall. Low elevation (5.0m) and high runoff volume exceed drainage capacity."
    },
    {
      "zone_id": "UV004",
      "zone_name": "Riverside Zone",
      "risk_score": 87,
      "risk_level": "High",
      "explanation": "Severe waterlogging hazard for Riverside Zone under 80.0 mm rainfall. Low elevation (3.5m) and high runoff volume exceed drainage capacity."
    }
  ],
  "affected_zones": [
    "UV002",
    "UV003",
    "UV004"
  ],
  "recommendations": [
    "URGENT: Activate flood-resilience response protocol for Riverside Zone (UV004) and Industrial Zone (UV003).",
    "Deploy high-capacity mobile pumps to Riverside Zone (UV004) and Industrial Zone (UV003).",
    "Divert arterial traffic away from Commercial Zone (UV002) into elevated Residential Zone (UV001) corridors.",
    "Alert emergency response teams along Riverside Zone (UV004) riverbank settlements."
  ],
  "simulation_only": true,
  "disclaimer": "Simulation only; not a live emergency warning."
}
```

---

## 4. Run Automated Verification Suite
To test all endpoints and verify contract adherence:
```powershell
python test_api.py
```
All 8 unit and integration tests will run and print their pass status.
