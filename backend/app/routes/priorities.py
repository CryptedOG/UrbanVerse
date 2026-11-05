from datetime import datetime, timezone
from typing import Optional
from fastapi import APIRouter, Query
from app.schemas import PrioritiesResponse, ZonePrioritySummary, PriorityExposure, PriorityVulnerability
from app.services.gis_service import gis_service
from app.services.priority_service import evaluate_all_zones_priorities
from app.config import DEFAULT_AREA_ID, DISCLAIMER_TEXT

router = APIRouter(prefix="/api", tags=["Prioritization"])


@router.get("/priorities", response_model=PrioritiesResponse)
def get_priorities(
    rainfall_mm: float = Query(default=80.0, ge=0, le=1000, description="Simulated rainfall (mm)"),
    temperature_c: float = Query(default=36.5, ge=15, le=55, description="Ambient temperature (°C)"),
    aqi: float = Query(default=165.0, ge=0, le=500, description="Air Quality Index"),
    slope_saturation_index: float = Query(default=0.55, ge=0.0, le=1.0, description="Slope soil saturation index"),
) -> PrioritiesResponse:
    """Return multi-hazard resilience priority rankings (P1–P4) and sub-priority ranks across all zones."""
    # Ensure raw floats if called directly outside FastAPI dependency injection
    rain = float(rainfall_mm) if isinstance(rainfall_mm, (int, float)) else 80.0
    temp = float(temperature_c) if isinstance(temperature_c, (int, float)) else 36.5
    air = float(aqi) if isinstance(aqi, (int, float)) else 165.0
    sat = float(slope_saturation_index) if isinstance(slope_saturation_index, (int, float)) else 0.55

    zones = gis_service.get_all_zones()
    evaluated = evaluate_all_zones_priorities(
        zones,
        rainfall_mm=rain,
        temperature_c=temp,
        aqi=air,
        saturation_index=sat,
    )

    priority_summaries = []
    p_counts = {"P1": 0, "P2": 0, "P3": 0, "P4": 0}

    for item in evaluated:
        p_counts[item["priority"]] = p_counts.get(item["priority"], 0) + 1
        priority_summaries.append(
            ZonePrioritySummary(
                zone_id=item["zone_id"],
                zone_name=item["zone_name"],
                zone_type=item["zone_type"],
                elevation_m=item["elevation_m"],
                priority=item["priority"],
                priority_label=item["priority_label"],
                composite_risk_score=item["composite_risk_score"],
                overall_rank=item["overall_rank"],
                sub_priority_rank=item["sub_priority_rank"],
                sub_priority_label=item["sub_priority_label"],
                hazard_intensity_score=item["hazard_intensity_score"],
                primary_hazard=item["primary_hazard"],
                primary_hazard_id=item["primary_hazard_id"],
                primary_hazard_score=item["primary_hazard_score"],
                hazards=item["hazards"],
                exposure=PriorityExposure(**item["exposure"]),
                vulnerability=PriorityVulnerability(**item["vulnerability"]),
                action_required=item["action_required"],
            )
        )

    top_zone = priority_summaries[0].zone_id if priority_summaries else "UV004"

    return PrioritiesResponse(
        area_id=DEFAULT_AREA_ID,
        timestamp=datetime.now(timezone.utc).isoformat(),
        zone_count=len(priority_summaries),
        priorities=priority_summaries,
        summary={
            "p1_critical_count": p_counts["P1"],
            "p2_high_count": p_counts["P2"],
            "p3_moderate_count": p_counts["P3"],
            "p4_low_count": p_counts["P4"],
            "top_priority_zone": top_zone,
            "simulated_inputs": {
                "rainfall_mm": rainfall_mm,
                "temperature_c": temperature_c,
                "aqi": aqi,
                "slope_saturation_index": slope_saturation_index,
            },
        },
        simulation_only=True,
        disclaimer=DISCLAIMER_TEXT,
    )
