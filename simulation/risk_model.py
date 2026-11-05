"""
UrbanVerse - Flood Risk Simulation Engine
Role: Member 4 (Flood Simulation + Risk Logic)

Description:
This module calculates flood-risk scores and risk levels (Low, Medium, High)
for geographical zones in the UrbanVerse Mangalore pilot area.

The simulation combines:
1. Rainfall input (rainfall_mm).
2. Physical zone factors:
   - Elevation (meters): lower elevation increases accumulation.
   - Proximity to water bodies (meters): closer proximity increases overflow risk.
   - Drainage capacity (1 to 5 scale): poorer drainage exacerbates waterlogging.

Note for Team:
This is a rule-based simulation prototype designed for the 24-hour hackathon MVP.
It is clearly labelled as simulation_only: True.
"""

from typing import List, Dict, Any, Optional

# Baseline default geographical parameters used safely if GIS data omits them
DEFAULT_ELEVATION_M: float = 15.0
DEFAULT_DISTANCE_TO_WATER_M: float = 500.0
DEFAULT_DRAINAGE_CAPACITY: float = 3.0  # Scale 1.0 (very poor) to 5.0 (excellent)

# Representative sample zones for the Mangalore pilot area.
# These sample zones are used when Member 3's real GeoJSON is not yet connected.
# Physical attributes are calibrated to match realistic topographic conditions.
SAMPLE_PILOT_ZONES: List[Dict[str, Any]] = [
    {
        "zone_id": "zone-a",
        "name": "Bunder / Riverfront Sector",
        "elevation_m": 3.0,          # Very low elevation
        "distance_to_water_m": 60.0,  # Near Gurupura River estuary
        "drainage_capacity": 1.2,    # Heavy siltation / low capacity
    },
    {
        "zone_id": "zone-b",
        "name": "Hampankatta Central Commercial",
        "elevation_m": 15.0,         # Moderate elevation
        "distance_to_water_m": 500.0, # Moderate distance to water
        "drainage_capacity": 3.2,    # Standard urban municipal drains
    },
    {
        "zone_id": "zone-c",
        "name": "Kadri Hills Residential",
        "elevation_m": 32.0,         # Elevated ridge / high ground
        "distance_to_water_m": 1100.0,# Far from major water bodies
        "drainage_capacity": 4.5,    # Good natural slope and drainage
    },
    {
        "zone_id": "zone-d",
        "name": "Kottara Chowki Junction",
        "elevation_m": 4.0,          # Low-lying junction / underpass
        "distance_to_water_m": 150.0, # Near stormwater canal
        "drainage_capacity": 2.0,    # Frequent stormwater bottleneck
    },
]


def classify_risk_level(risk_score: int) -> str:
    """
    Classify a 0-100 risk score into Low, Medium, or High.

    Thresholds:
    - Low:    0 <= score < 40
    - Medium: 40 <= score < 70
    - High:   70 <= score <= 100
    """
    if risk_score >= 70:
        return "High"
    elif risk_score >= 40:
        return "Medium"
    else:
        return "Low"


def compute_zone_susceptibility(zone: Dict[str, Any]) -> float:
    """
    Compute intrinsic physical flood susceptibility (0 to 100) based on:
    - Elevation: lower ground = higher risk.
    - Proximity to water: closer = higher risk.
    - Drainage capacity: lower capacity = higher risk.

    Handles missing zone values safely using baseline defaults.
    """
    # Safely extract elevation (meters)
    elev = float(zone.get("elevation_m") if zone.get("elevation_m") is not None else DEFAULT_ELEVATION_M)
    # Safely extract distance to water (meters)
    dist = float(zone.get("distance_to_water_m") if zone.get("distance_to_water_m") is not None else DEFAULT_DISTANCE_TO_WATER_M)
    # Safely extract drainage rating (1.0 to 5.0)
    drain = float(zone.get("drainage_capacity") if zone.get("drainage_capacity") is not None else DEFAULT_DRAINAGE_CAPACITY)

    # 1. Elevation vulnerability (sea level ~2m is max vulnerability, >35m is minimal)
    e_risk = max(0.0, min(100.0, (35.0 - elev) / 33.0 * 100.0))

    # 2. Water proximity vulnerability (<=50m is max vulnerability, >=1000m is minimal)
    w_risk = max(0.0, min(100.0, (1000.0 - dist) / 950.0 * 100.0))

    # 3. Drainage deficit vulnerability (1.0 is max vulnerability, 5.0 is minimal)
    d_risk = max(0.0, min(100.0, (5.0 - drain) / 4.0 * 100.0))

    # Weighted susceptibility index (weights sum to 1.0)
    susceptibility = (0.40 * e_risk) + (0.35 * w_risk) + (0.25 * d_risk)
    return max(0.0, min(100.0, susceptibility))


def generate_recommendations(max_risk_level: str, affected_zones: List[str], rainfall_mm: float) -> List[str]:
    """
    Generate practical, cautious urban emergency response recommendations.
    """
    recs: List[str] = []

    if max_risk_level == "High":
        recs.append("Prioritise checks near low-lying roads and watercourses")
        recs.append("Deploy portable de-watering pumps to high-risk zones")
        if affected_zones:
            zone_list_str = ", ".join(affected_zones)
            recs.append(f"Issue precautionary flood advisory for zones: {zone_list_str}")
        recs.append("Alert ward disaster response units and monitor underpasses")
    elif max_risk_level == "Medium":
        recs.append("Inspect and clear primary storm drains and culverts")
        recs.append("Monitor stormwater accumulation in low-lying commercial sectors")
        recs.append("Keep municipal emergency standby teams on alert")
    else:
        # Low risk
        if rainfall_mm > 0:
            recs.append("Normal municipal monitoring; standard culvert maintenance advised")
            recs.append("No active emergency traffic or drainage diversion required")
        else:
            recs.append("No rainfall simulated; conditions normal")

    return recs


def simulate_flood(
    rainfall_mm: float,
    area_id: str = "pilot-area-01",
    zones: Optional[List[Dict[str, Any]]] = None
) -> Dict[str, Any]:
    """
    Main flood simulation function.

    Parameters:
    - rainfall_mm: Simulated rainfall amount in millimeters (e.g. 20, 80, 160).
    - area_id: Geographical pilot area identifier (default: "pilot-area-01").
    - zones: Optional list of zone dictionaries. If None or empty, SAMPLE_PILOT_ZONES is used.

    Returns:
    - Dictionary matching the UrbanVerse shared API contract:
      {
        "area_id": "pilot-area-01",
        "rainfall_mm": 80.0,
        "zones": [
          {"zone_id": "zone-a", "risk_score": 82, "risk_level": "High"},
          ...
        ],
        "affected_zones": ["zone-a"],
        "recommendations": [...],
        "simulation_only": True
      }
    """
    # Guard against negative rainfall
    safe_rainfall = max(0.0, float(rainfall_mm))

    # Use sample pilot zones if no zones provided
    zone_list = zones if zones and len(zones) > 0 else SAMPLE_PILOT_ZONES

    # Non-linear rainfall scaling factor
    # 0 mm -> 0.0 multiplier
    # 100 mm -> 1.0 multiplier
    # Clamped at 1.3 for extreme monsoon rainfall events
    if safe_rainfall > 0.0:
        rainfall_factor = min(1.3, (safe_rainfall / 100.0) ** 0.75)
    else:
        rainfall_factor = 0.0

    zone_results: List[Dict[str, Any]] = []
    affected_zones: List[str] = []
    has_high = False
    has_medium = False

    for zone in zone_list:
        zone_id = str(zone.get("zone_id", "unknown-zone"))
        susceptibility = compute_zone_susceptibility(zone)

        # Final score is susceptibility scaled by rainfall factor
        raw_score = susceptibility * rainfall_factor
        score = int(round(max(0.0, min(100.0, raw_score))))

        level = classify_risk_level(score)

        if level == "High":
            has_high = True
            affected_zones.append(zone_id)
        elif level == "Medium":
            has_medium = True

        zone_results.append({
            "zone_id": zone_id,
            "risk_score": score,
            "risk_level": level,
        })

    # Determine peak risk level for recommendations
    if has_high:
        max_risk = "High"
    elif has_medium:
        max_risk = "Medium"
    else:
        max_risk = "Low"

    recommendations = generate_recommendations(max_risk, affected_zones, safe_rainfall)

    return {
        "area_id": area_id,
        "rainfall_mm": safe_rainfall,
        "zones": zone_results,
        "affected_zones": affected_zones,
        "recommendations": recommendations,
        "simulation_only": True,
    }


# Convenient alias so Member 1 can import either function name seamlessly
calculate_flood_risk = simulate_flood


if __name__ == "__main__":
    import json

    print("=" * 60)
    print("URBANVERSE FLOOD SIMULATION - STANDALONE MANUAL TEST")
    print("=" * 60)

    for test_rf in [20.0, 80.0, 160.0]:
        print(f"\n--- Running Simulation for {test_rf} mm Rainfall ---")
        result = simulate_flood(rainfall_mm=test_rf)
        print(json.dumps(result, indent=2))
