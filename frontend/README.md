# UrbanVerse — Frontend & 3D Digital Twin (Member 2)

Welcome to the **UrbanVerse** Frontend and 3D Digital Twin subsystem for the Mangalore Pilot Area flood resilience digital twin.

---

## 1. Overview
The frontend is built with React and serves as the visual dashboard for disaster response coordinators, urban planners, and hackathon evaluators.

### Core Capabilities:
- **GIS Zone Data**:
  - The active browser bundle validates `GET /api/zones` and uses its stable zone IDs, names, descriptions, elevations, centers, and polygon coordinates.
  - If the API is unavailable or invalid, it loads `public/data/pilot-area.geojson`; embedded zones are retained as a final fallback if that file cannot be loaded.
  - All zone sources keep the IDs `UV001`–`UV004` and feed the 2D map, 3D twin, inspector, and scenario view.
  - The supplied GeoJSON is a synthetic RFC 7946 FeatureCollection in WGS84 (`EPSG:4326`) with bounds `[74.8400, 12.8550, 74.8640, 12.8750]`.
- **Mangalore Pilot Area Map (2D GIS)**:
  - Coordinate projection from WGS84 decimal degrees to SVG screen space.
  - Shared topology junction vertex at `[74.8520°E, 12.8650°N]`.
  - Reactive risk colors: Low (Green `#10b981`), Medium (Amber `#f59e0b`), High (Red `#ef4444`).
  - Pulsating stroke highlights on `affected_zones`.
- **3D Urban Digital Twin**:
  - Isometric 3D model featuring height-extruded terrain blocks based on baseline elevations (`UV001`: 24m ➔ `UV002`: 18m ➔ `UV003`: 10m ➔ `UV004`: 4m).
  - Building meshes with risk-colored illuminated roofs.
  - Dynamic 3D flood plane that physically rises with rainfall depth, inundating the low-lying `UV004` Riverside Zone first.
  - Interactive camera controls (tilt, rotate, zoom, reset).
- **Precipitation Controls**:
  - Continuous slider (0 to 300 mm) with preset scenarios (Light 25mm, Benchmark 80mm, Heavy 150mm, Extreme 240mm).
- **Flood Simulation**:
  - Triggers `POST /api/simulate` and updates risk scores, colors, affected areas, and emergency directives.
- **Multi-Hazard Assessment**:
  - Heatwave, air pollution, and landslide use `POST /api/assess` with supported input fields and the active area ID from zone data.
  - Landslide's percentage control is converted to the backend's 0–1 saturation index.
  - Backend hazard-specific scores and explanations are displayed separately from composite priority scores.
- **Multi-Hazard Priorities and Assets**:
  - Loads `GET /api/priorities?rainfall_mm=...` and shows its P1–P4 composite rankings as a separate inspector section.
  - Loads `GET /api/zones/{zone_id}/assets` for the selected zone, with loading, error, empty, and stale-response handling.
- **Risk Explanations**:
  - Displays an explanation from the assessment response when present. Local demonstration calculations do not supply or claim validated scientific explanations.
  - Shows a neutral message when the response has no explanation.
- **Hazard Demonstrations**:
  - Cyclone remains frontend-only because no backend cyclone model is available.
  - If `/api/assess` is unavailable or invalid for heatwave, air pollution, or landslide, the UI clearly labels the local demonstration fallback.
  - ScenarioLab remains local demonstration-only.
- **Contract-Compliant Fallback**:
  - Automated health checks (`GET /api/health`) and seamless local mock fallback if Member 1's FastAPI server is offline.
- **Mandatory Safety Disclaimer**:
  - Visible note: *"Simulation only; not a live emergency warning."*

---

## 2. Shared Interface Contract Adherence
This frontend strictly obeys the contract defined in `00_Team_Integration_Guide.pdf`:

### Request (`POST /api/simulate`):
```json
{
  "rainfall_mm": 80
}
```

The active area ID is taken dynamically from the zone API and included in `/api/assess` requests. The flood endpoint uses the rainfall-only request shown above.

### Other backend integrations:

- `POST /api/assess` is used for heatwave, air pollution, and landslide. It sends `rainfall_mm`, `temperature_c`, `aqi`, `slope_saturation_index`, and the dynamic `area_id`; it does not send `hazard_type` or `intensity_value`.
- `GET /api/priorities?rainfall_mm=80` supplies P1–P4 composite rankings, rendered separately from hazard-specific scores.
- `GET /api/zones/{zone_id}/assets` supplies the selected zone's critical assets.
- Backend assessment and priority disclaimers are retained. The visible safety disclaimer remains: **Simulation only; not a live emergency warning.**

The frontend validates the flood response's area ID, rainfall value, four stable zone IDs and risk scores, affected zones, recommendations, and `simulation_only` flag before displaying it.

---

## 3. Quick Start (Run Locally)

```bash
cd frontend
npm start
# (or: node server.js)
```

Open your browser to: **`http://localhost:3000`**

To run the automated verification test suite:
```bash
npm test
# (or: node tests/frontend.test.js)
```
The latest verified suite result is **205 passing assertions, 0 failures** with `npm test`.

The active runtime is `public/index.html`, which loads local React vendor bundles and `public/app.js` directly. The files under `src/` are not part of this browser entry path.

---

## 4. Team Integration Status

- **Member 1 (Backend + Integration):**
  - Expects FastAPI running at `http://localhost:8000`.
  - The dashboard checks `GET /api/health` and loads zone geometry from `GET /api/zones`, falling back to the local GeoJSON file if needed.
  - The API response `zones` array should use the permanent zone IDs: `UV001`, `UV002`, `UV003`, `UV004`.
  - Flood uses `POST /api/simulate`; priorities use `GET /api/priorities`; heatwave, air pollution, and landslide use `POST /api/assess`; selected-zone assets use `GET /api/zones/{zone_id}/assets`.
  - Cyclone has no backend model and remains a frontend demonstration.
- **Member 3 (GIS Data):**
  - `data/pilot-area.geojson` from commit `7bd6305` is completely integrated.
  - Zone geometry, bounding boxes, and elevations match `docs/geojson-field-guide.md`.
