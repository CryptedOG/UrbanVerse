"""Official UrbanVerse pilot area zones and deterministic simulation logic.

Official UrbanVerse Zone IDs:
- UV001: Residential Zone
- UV002: Commercial Zone
- UV003: Industrial Zone
- UV004: Riverside Zone

Sample coordinates are preserved as provisional demo boundaries until GIS
supplies the final GeoJSON dataset.
"""

from typing import Dict, Any, List

DEFAULT_AREA_ID = "urbanverse-pilot"

# 4 Official UrbanVerse Pilot Zones
SAMPLE_ZONES: List[Dict[str, Any]] = [
    {
        "zone_id": "UV001",
        "name": "Residential Zone",
        "description": "Provisional coordinates for Residential Zone. Elevated residential district with natural slope gradients facilitating stormwater runoff toward drainage valleys.",
        "elevation_m": 38.0,
        "base_vulnerability": 0.45,
        "center": {"latitude": 12.8805, "longitude": 74.8580},
        "polygon": [
            [74.8520, 12.8770],
            [74.8640, 12.8770],
            [74.8630, 12.8850],
            [74.8530, 12.8840],
            [74.8520, 12.8770],
        ],
    },
    {
        "zone_id": "UV002",
        "name": "Commercial Zone",
        "description": "Provisional coordinates for Commercial Zone. High-density commercial district with extensive impervious concrete cover and heavy traffic corridors prone to surface ponding.",
        "elevation_m": 14.0,
        "base_vulnerability": 1.0,
        "center": {"latitude": 12.8682, "longitude": 74.8436},
        "polygon": [
            [74.8400, 12.8650],
            [74.8480, 12.8650],
            [74.8480, 12.8720],
            [74.8410, 12.8720],
            [74.8400, 12.8650],
        ],
    },
    {
        "zone_id": "UV003",
        "name": "Industrial Zone",
        "description": "Provisional coordinates for Industrial Zone. Coastal transit and industrial strip with shallow water table and high sensitivity to combined runoff and tidal surges.",
        "elevation_m": 5.0,
        "base_vulnerability": 1.15,
        "center": {"latitude": 12.9510, "longitude": 74.8090},
        "polygon": [
            [74.8030, 12.9450],
            [74.8150, 12.9450],
            [74.8140, 12.9560],
            [74.8040, 12.9550],
            [74.8030, 12.9450],
        ],
    },
    {
        "zone_id": "UV004",
        "name": "Riverside Zone",
        "description": "Provisional coordinates for Riverside Zone. Low-lying riverfront basin adjacent to estuary waterways; highly susceptible to rapid water accumulation.",
        "elevation_m": 3.5,
        "base_vulnerability": 1.30,
        "center": {"latitude": 12.8732, "longitude": 74.8344},
        "polygon": [
            [74.8300, 12.8700],
            [74.8380, 12.8700],
            [74.8390, 12.8760],
            [74.8320, 12.8770],
            [74.8300, 12.8700],
        ],
    },
]


def run_deterministic_simulation(rainfall_mm: float, area_id: str = DEFAULT_AREA_ID) -> Dict[str, Any]:
    """Calculate deterministic illustrative flood risk scores based on simulated rainfall in mm."""
    zone_results = []
    affected_zones = []

    for z in SAMPLE_ZONES:
        vuln = z["base_vulnerability"]

        # Deterministic formula:
        # At 30mm: UV001 (Residential) ~ 11, UV002 (Commercial) ~ 25, UV003 (Industrial) ~ 29, UV004 (Riverside) ~ 33 (All Low)
        # At 80mm: UV004 (Riverside) ~ 87 (High), UV003 (Industrial) ~ 77 (High), UV002 (Commercial) ~ 67 (Medium), UV001 (Residential) ~ 30 (Low)
        # At 100mm+: High across lowlands
        raw_score = (rainfall_mm / 120.0) * 100.0 * vuln
        score = int(min(100, max(0, round(raw_score))))

        if score < 40:
            level = "Low"
            explanation = (
                f"Rainfall of {rainfall_mm:.1f} mm remains within manageable drainage capacity "
                f"given {z['name']}'s {z['elevation_m']}m elevation."
            )
        elif score < 70:
            level = "Medium"
            affected_zones.append(z["zone_id"])
            explanation = (
                f"Moderate surface accumulation expected in {z['name']}. "
                f"Stormwater channels near capacity; local street ponding likely."
            )
        else:
            level = "High"
            affected_zones.append(z["zone_id"])
            explanation = (
                f"Severe waterlogging hazard for {z['name']} under {rainfall_mm:.1f} mm rainfall. "
                f"Low elevation ({z['elevation_m']}m) and high runoff volume exceed drainage capacity."
            )

        zone_results.append({
            "zone_id": z["zone_id"],
            "zone_name": z["name"],
            "risk_score": score,
            "risk_level": level,
            "explanation": explanation,
        })

    recommendations = []
    if rainfall_mm < 35:
        recommendations.append("Normal city operations. Routine monitoring of arterial drain outfalls.")
    elif rainfall_mm < 75:
        recommendations.append("Prioritise checks near low-lying roads in Riverside Zone (UV004) and Commercial Zone (UV002).")
        recommendations.append("Pre-position dewatering pumps near Commercial Zone (UV002).")
        recommendations.append("Issue traffic advisories to divert non-essential vehicles toward Residential Zone (UV001).")
    else:
        recommendations.append("URGENT: Activate flood-resilience response protocol for Riverside Zone (UV004) and Industrial Zone (UV003).")
        recommendations.append("Deploy high-capacity mobile pumps to Riverside Zone (UV004) and Industrial Zone (UV003).")
        recommendations.append("Divert arterial traffic away from Commercial Zone (UV002) into elevated Residential Zone (UV001) corridors.")
        recommendations.append("Alert emergency response teams along Riverside Zone (UV004) riverbank settlements.")

    return {
        "area_id": area_id,
        "rainfall_mm": rainfall_mm,
        "zones": zone_results,
        "affected_zones": affected_zones,
        "recommendations": recommendations,
        "simulation_only": True,
        "disclaimer": "Simulation only; not a live emergency warning.",
    }
