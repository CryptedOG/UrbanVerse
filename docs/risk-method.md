# UrbanVerse: Flood Simulation & Risk Logic Methodology

**Module:** `simulation/risk_model.py`  
**Role Owner:** Member 4 (Flood Simulation + Risk Logic)  
**Target Area:** Mangalore Pilot Digital Twin (`pilot-area-01`)  
**Hackathon Target:** 24-Hour Working MVP  

---

## 1. Overview & Objective

The UrbanVerse simulation module provides a lightweight, explainable, rule-based flood-risk calculation engine. It takes simulated rainfall inputs and geographical zone properties (elevation, proximity to water, and drainage conditions) to compute individual zone risk scores, classify risk levels, identify affected zones, and generate practical response recommendations.

> **Scope & Safety Disclaimer:**  
> This simulation is an educational and hackathon decision-support prototype. Output data is clearly tagged with `"simulation_only": true`. It is **not** an operational meteorological forecast or a certified civil engineering hydraulic model.

---

## 2. Factors & Mathematical Scoring Logic

The simulation uses four primary factors to evaluate surface-flood risk for each zone.

### A. Factor Normalization

1. **Elevation Vulnerability ($E_{\text{risk}}$):**
   * *Mechanism:* Water accumulates in low-lying topography. Low elevations face severe accumulation risks, whereas elevated ridges drain naturally.
   * *Formula:*
     $$\text{Elev}_{\text{risk}} = \text{clamp}\left(\frac{35.0 - \text{elevation\_m}}{35.0 - 2.0} \times 100,\ 0,\ 100\right)$$
   * *Scale:* $\le 2.0\,\text{m}$ yields 100 (maximum vulnerability); $\ge 35.0\,\text{m}$ yields 0.

2. **Proximity to Water Bodies ($W_{\text{risk}}$):**
   * *Mechanism:* Proximity to estuaries (e.g., Gurupura / Netravati rivers) or stormwater canals increases tidal backflow and overflow hazard.
   * *Formula:*
     $$\text{Water}_{\text{risk}} = \text{clamp}\left(\frac{1000.0 - \text{distance\_to\_water\_m}}{1000.0 - 50.0} \times 100,\ 0,\ 100\right)$$
   * *Scale:* $\le 50.0\,\text{m}$ yields 100; $\ge 1000.0\,\text{m}$ yields 0.

3. **Drainage Deficit ($D_{\text{risk}}$):**
   * *Mechanism:* Drainage capacity is rated from 1.0 (silted / inadequate culverts) to 5.0 (modern high-capacity storm drains).
   * *Formula:*
     $$\text{Drain}_{\text{risk}} = \text{clamp}\left(\frac{5.0 - \text{drainage\_capacity}}{5.0 - 1.0} \times 100,\ 0,\ 100\right)$$
   * *Scale:* 1.0 yields 100; 5.0 yields 0.

---

### B. Zone Physical Susceptibility ($S$)

The physical characteristics are combined into a composite susceptibility index using weighted multi-criteria evaluation:

$$S = (0.40 \times E_{\text{risk}}) + (0.35 \times W_{\text{risk}}) + (0.25 \times D_{\text{risk}})$$

* **Elevation Weight (40%):** Topography is the primary driver of gravity-fed runoff.
* **Water Proximity Weight (35%):** Proximity dictates external water ingress and backflow.
* **Drainage Capacity Weight (25%):** Local infrastructure determines evacuation rate.

---

### C. Rainfall Response Scaling ($F_{\text{rain}}$)

Rainfall is the driving trigger of flood events. In zero rainfall conditions ($0\,\text{mm}$), flood risk remains zero. As rainfall increases, the response follows a power curve:

$$F_{\text{rain}} = \min\left(1.3,\ \left(\frac{\text{rainfall\_mm}}{100.0}\right)^{0.75}\right) \quad (\text{for } \text{rainfall\_mm} > 0)$$

The final zone risk score is:

$$\text{Risk Score} = \text{round}\left(\text{clamp}\left(S \times F_{\text{rain}},\ 0,\ 100\right)\right)$$

---

## 3. Score Thresholds & Classification

Every zone receives an integer risk score between 0 and 100 and is classified into one of three standardized labels:

| Risk Score Range | Risk Level | Description & Visual Indication |
| :--- | :--- | :--- |
| **0 – 39** | **Low** | Minimal surface ponding; normal municipal operations. Displayed in green. |
| **40 – 69** | **Medium** | Moderate waterlogging possible on roads; culvert saturation. Displayed in amber/yellow. |
| **70 – 100** | **High** | Severe inundation threat; underpasses and low ground submerged. Displayed in red. |

---

## 4. Affected Zones & Emergency Recommendations

1. **Affected Zones:**
   Zones reaching the **High** risk classification ($\text{score} \ge 70$) are appended to the `affected_zones` list to guide priority field response.

2. **Recommendations Engine:**
   * **High Risk:**
     * *"Prioritise checks near low-lying roads and watercourses"*
     * *"Deploy portable de-watering pumps to high-risk zones"*
     * *"Issue precautionary flood advisory for zones: [zone list]"*
     * *"Alert ward disaster response units and monitor underpasses"*
   * **Medium Risk:**
     * *"Inspect and clear primary storm drains and culverts"*
     * *"Monitor stormwater accumulation in low-lying commercial sectors"*
     * *"Keep municipal emergency standby teams on alert"*
   * **Low Risk:**
     * *"Normal municipal monitoring; standard culvert maintenance advised"*
     * *"No active emergency traffic or drainage diversion required"*

---

## 5. Graceful Fallback & Safe Handling

* **Missing Geographical Data:** If Member 3's GeoJSON or zone data lacks attributes (e.g., elevation or drainage not recorded), the module automatically substitutes neutral baseline defaults (`elevation_m = 15.0`, `distance_to_water_m = 500.0`, `drainage_capacity = 3.0`) without raising exceptions.
* **Negative Rainfall:** Clamped safely to `0.0 mm`.
* **Sample Pilot Data:** Includes 4 calibrated zones (`zone-a` through `zone-d`) representing Mangalore coastal, commercial, residential, and transit zones.

---

## 6. Integration Guide for Member 1 (FastAPI Backend)

Member 1 can import and call the simulation directly in `backend/app/main.py`:

```python
# In Member 1's backend router:
from simulation.risk_model import simulate_flood

@app.post("/api/simulate")
def run_simulation(request: SimulateRequest):
    # rainfall_mm and area_id come from request body
    result = simulate_flood(
        rainfall_mm=request.rainfall_mm,
        area_id=request.area_id
    )
    return result
```

### Verified API Response Example (80 mm Rainfall)

```json
{
  "area_id": "pilot-area-01",
  "rainfall_mm": 80.0,
  "zones": [
    {
      "zone_id": "zone-a",
      "risk_score": 82,
      "risk_level": "High"
    },
    {
      "zone_id": "zone-b",
      "risk_score": 46,
      "risk_level": "Medium"
    },
    {
      "zone_id": "zone-c",
      "risk_score": 6,
      "risk_level": "Low"
    },
    {
      "zone_id": "zone-d",
      "risk_score": 74,
      "risk_level": "High"
    }
  ],
  "affected_zones": [
    "zone-a",
    "zone-d"
  ],
  "recommendations": [
    "Prioritise checks near low-lying roads and watercourses",
    "Deploy portable de-watering pumps to high-risk zones",
    "Issue precautionary flood advisory for zones: zone-a, zone-d",
    "Alert ward disaster response units and monitor underpasses"
  ],
  "simulation_only": true
}
```
