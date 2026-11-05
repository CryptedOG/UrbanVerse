# UrbanVerse Backend

**City-Scale Digital Twin for Multi-Hazard Prediction and Urban Resilience Planning**  
FastAPI Backend & Integration Engine (Mangalore Coastal Pilot Area MVP).

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
* **Urban Zones (GIS GeoJSON):** `http://127.0.0.1:8000/api/zones`
* **Zone Critical Assets:** `http://127.0.0.1:8000/api/zones/{zone_id}/assets`
* **Flood Simulation (Contract):** `http://127.0.0.1:8000/api/simulate`
* **Hazard Catalog:** `http://127.0.0.1:8000/api/hazards`
* **Resilience Priorities (P1–P4):** `http://127.0.0.1:8000/api/priorities`
* **Multi-Hazard Assessment:** `http://127.0.0.1:8000/api/assess`
* **Data Sources & Provenance:** `http://127.0.0.1:8000/api/data-sources/status`

---

## 3. Supported Multi-Hazards

UrbanVerse implements 4 hazards tailored to coastal urban environments:

| Hazard ID | Name | Metric / Unit | Applicable Zones | Model Type |
| :--- | :--- | :--- | :--- | :--- |
| **`flood`** | Urban Flooding & Waterlogging | `rainfall_mm` (0–200 mm) | All (`UV001`–`UV004`) | Elevation & Runoff Inundation |
| **`heatwave`** | Urban Heat Island | `temperature_c` (°C) | All (`UV001`–`UV004`) | Impervious Surface & Canopy Thermal Index |
| **`air_pollution`** | Particulate Exposure | `aqi` (0–500 AQI) | All (`UV001`–`UV004`) | Traffic & Industrial Emission Dispersion |
| **`landslide`** | Slope Failure / Slip | `slope_saturation_index` | `UV001` (Only elevated sloped hills) | Slope Instability & Rainfall Saturation |

---

## 4. Priority & Sub-Priority System

Zones are classified into a 4-tier resilience hierarchy based on Composite Risk (50% Hazard + 30% Exposure + 20% Vulnerability):

* **P1 — Critical:** Immediate life safety / vital utility danger (Composite $\ge 75$ or Hazard $\ge 90$).
* **P2 — High:** Significant disruption to commercial, industrial, or transit corridors ($55 \le \text{Score} < 75$).
* **P3 — Moderate:** Localized disruptions manageable by standard protocols ($35 \le \text{Score} < 55$).
* **P4 — Low:** Minimal risk; routine municipal monitoring ($\text{Score} < 35$).

**Sub-Priority Ranking:** Zones within the same priority tier are ranked using exact continuous scores (`P1 Rank #1`, `P1 Rank #2`, etc.) to break ties and direct emergency resource allocation.

---

## 5. Automated Verification Suite
To run all 9 automated tests verifying contract compliance, GIS loading, and hazard math:
```powershell
python test_api.py
```
*(All 9 tests pass with zero warnings).*
