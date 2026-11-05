"""Priority & Multi-Hazard Risk Aggregation Service for UrbanVerse.

Implements the 4-tier resilience hierarchy:
- P1 — Critical (Immediate life safety & vital infrastructure danger)
- P2 — High (Significant localized hazard impacting commercial/industrial continuity)
- P3 — Moderate (Standard municipal mitigation protocols sufficient)
- P4 — Low (Routine monitoring)

Features:
- Distinguishes raw Hazard Intensity from Composite Risk.
- Integrates Population Exposure, Infrastructure Exposure, and Terrain Vulnerability.
- Computes Sub-Priority Ranking to break ties within the same priority class.
"""

from typing import Dict, Any, List
from app.services.hazard_service import (
    assess_flood_hazard,
    assess_heat_hazard,
    assess_air_pollution_hazard,
    assess_landslide_hazard,
)

# Zone demographic and exposure profiles for Mangalore pilot area
ZONE_EXPOSURE_PROFILES: Dict[str, Dict[str, Any]] = {
    "UV001": {
        "zone_name": "Residential Zone",
        "population_density_per_km2": 8500,
        "population_exposure_score": 82,
        "infrastructure_exposure_score": 58,
        "critical_asset_count": 6,
        "vulnerability_base": 42,
    },
    "UV002": {
        "zone_name": "Commercial Zone",
        "population_density_per_km2": 6200,
        "population_exposure_score": 68,
        "infrastructure_exposure_score": 88,
        "critical_asset_count": 9,
        "vulnerability_base": 68,
    },
    "UV003": {
        "zone_name": "Industrial Zone",
        "population_density_per_km2": 2800,
        "population_exposure_score": 38,
        "infrastructure_exposure_score": 92,
        "critical_asset_count": 8,
        "vulnerability_base": 78,
    },
    "UV004": {
        "zone_name": "Riverside Zone",
        "population_density_per_km2": 7400,
        "population_exposure_score": 78,
        "infrastructure_exposure_score": 82,
        "critical_asset_count": 7,
        "vulnerability_base": 92,
    },
}


def calculate_zone_multi_hazard(
    zone: Dict[str, Any],
    rainfall_mm: float = 80.0,
    temperature_c: float = 36.5,
    aqi: float = 165.0,
    saturation_index: float = 0.55,
) -> Dict[str, Any]:
    """Assess all 4 hazards for a single zone and compute composite risk + P1-P4 priority."""
    zid = zone["zone_id"]
    profile = ZONE_EXPOSURE_PROFILES.get(zid, {
        "population_exposure_score": 50,
        "infrastructure_exposure_score": 50,
        "critical_asset_count": 4,
        "vulnerability_base": 50,
    })

    # Evaluate individual hazards
    flood = assess_flood_hazard(rainfall_mm, zone)
    heat = assess_heat_hazard(temperature_c, zone)
    air = assess_air_pollution_hazard(aqi, zone)
    landslide = assess_landslide_hazard(rainfall_mm, saturation_index, zone)

    hazards_dict = {
        "flood": flood,
        "heatwave": heat,
        "air_pollution": air,
        "landslide": landslide,
    }

    # Applicable hazard scores
    applicable_scores = [h["score"] for h in hazards_dict.values() if h.get("is_applicable", True)]
    max_hazard_score = max(applicable_scores) if applicable_scores else 0
    avg_hazard_score = sum(applicable_scores) / len(applicable_scores) if applicable_scores else 0

    # Primary hazard is the one with the highest score
    primary_hazard = max(
        (h for h in hazards_dict.values() if h.get("is_applicable", True)),
        key=lambda x: x["score"],
        default=flood,
    )

    # Combined Exposure Score (60% Population + 40% Infrastructure)
    exposure_score = int(round(
        (profile["population_exposure_score"] * 0.6) +
        (profile["infrastructure_exposure_score"] * 0.4)
    ))

    # Vulnerability score (combines terrain elevation factor + baseline vulnerability)
    elev = zone.get("elevation_m", 15.0)
    elev_penalty = max(0, int(round((30.0 - elev) * 1.5)))
    vulnerability_score = min(100, profile["vulnerability_base"] + elev_penalty)

    # Composite Risk Formula (Transparent and explicit weighting):
    # 50% Hazard Intensity + 30% Exposure + 20% Vulnerability
    composite_risk_float = (max_hazard_score * 0.50) + (exposure_score * 0.30) + (vulnerability_score * 0.20)
    composite_risk_score = int(min(100, max(0, round(composite_risk_float))))

    # Priority Classification
    if composite_risk_score >= 75 or max_hazard_score >= 90:
        priority = "P1"
        priority_label = "P1 — Critical"
        action = f"URGENT: Deploy immediate mitigation for {primary_hazard['hazard_name']}. Stand by emergency evacuation."
    elif composite_risk_score >= 55:
        priority = "P2"
        priority_label = "P2 — High"
        action = f"High alert: Pre-position pumps/resources and implement traffic advisories for {zone['name']}."
    elif composite_risk_score >= 35:
        priority = "P3"
        priority_label = "P3 — Moderate"
        action = f"Moderate monitoring: Review drainage and cooling centers in {zone['name']}."
    else:
        priority = "P4"
        priority_label = "P4 — Low"
        action = "Routine operations: Standard municipal monitoring active."

    return {
        "zone_id": zid,
        "zone_name": zone["name"],
        "zone_type": zone.get("zone_type", "urban"),
        "elevation_m": elev,
        "priority": priority,
        "priority_label": priority_label,
        "composite_risk_score": composite_risk_score,
        "_raw_composite": composite_risk_float,  # Used for exact sub-priority sorting
        "hazard_intensity_score": max_hazard_score,
        "primary_hazard": primary_hazard["hazard_name"],
        "primary_hazard_id": primary_hazard["hazard_id"],
        "primary_hazard_score": primary_hazard["score"],
        "hazards": hazards_dict,
        "exposure": {
            "population_density_km2": profile.get("population_density_per_km2", 5000),
            "population_exposure_score": profile["population_exposure_score"],
            "infrastructure_exposure_score": profile["infrastructure_exposure_score"],
            "combined_exposure_score": exposure_score,
            "critical_asset_count": profile["critical_asset_count"],
        },
        "vulnerability": {
            "vulnerability_score": vulnerability_score,
            "elevation_m": elev,
            "terrain_risk_factor": round(vulnerability_score / 50.0, 2),
        },
        "action_required": action,
    }


def evaluate_all_zones_priorities(
    zones: List[Dict[str, Any]],
    rainfall_mm: float = 80.0,
    temperature_c: float = 36.5,
    aqi: float = 165.0,
    saturation_index: float = 0.55,
) -> List[Dict[str, Any]]:
    """Evaluate priorities for all zones and assign intra-category sub-priority ranks."""
    results = []
    for z in zones:
        res = calculate_zone_multi_hazard(
            z,
            rainfall_mm=rainfall_mm,
            temperature_c=temperature_c,
            aqi=aqi,
            saturation_index=saturation_index,
        )
        results.append(res)

    # Sort globally by exact composite risk score descending
    results.sort(key=lambda x: x["_raw_composite"], reverse=True)

    # Assign overall city-wide rank (1 to N)
    for idx, item in enumerate(results, start=1):
        item["overall_rank"] = idx

    # Group by priority and assign sub-priority rank within that tier
    priority_groups: Dict[str, List[Dict[str, Any]]] = {"P1": [], "P2": [], "P3": [], "P4": []}
    for item in results:
        priority_groups[item["priority"]].append(item)

    for p_tier, group in priority_groups.items():
        # Already sorted by score descending
        for sub_rank, item in enumerate(group, start=1):
            item["sub_priority_rank"] = sub_rank
            item["sub_priority_label"] = f"{p_tier} Rank #{sub_rank}"

    # Clean up internal float before return
    for item in results:
        item.pop("_raw_composite", None)

    return results
