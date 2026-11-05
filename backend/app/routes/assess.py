import uuid
from datetime import datetime, timezone
from fastapi import APIRouter
from app.schemas import (
    AssessRequest,
    AssessResponse,
    ZonePrioritySummary,
    PriorityExposure,
    PriorityVulnerability,
    DataReliability,
)
from app.services.gis_service import gis_service
from app.services.priority_service import evaluate_all_zones_priorities
from app.config import DEFAULT_AREA_ID, DISCLAIMER_TEXT

router = APIRouter(prefix="/api", tags=["Multi-Hazard Assessment"])


@router.post("/assess", response_model=AssessResponse)
def assess_multi_hazard(request: AssessRequest) -> AssessResponse:
    """Execute a comprehensive multi-hazard assessment across all zones under custom scenario parameters."""
    area_id = request.area_id if request.area_id else DEFAULT_AREA_ID
    zones = gis_service.get_all_zones()

    evaluated = evaluate_all_zones_priorities(
        zones,
        rainfall_mm=request.rainfall_mm,
        temperature_c=request.temperature_c,
        aqi=request.aqi,
        saturation_index=request.slope_saturation_index,
    )

    zone_assessments = []
    p_counts = {"P1": 0, "P2": 0, "P3": 0, "P4": 0}

    for item in evaluated:
        p_counts[item["priority"]] = p_counts.get(item["priority"], 0) + 1
        zone_assessments.append(
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

    top_zone = zone_assessments[0].zone_id if zone_assessments else "UV004"

    return AssessResponse(
        assessment_id=f"ASSESS-{uuid.uuid4().hex[:8].upper()}",
        timestamp=datetime.now(timezone.utc).isoformat(),
        area_id=area_id,
        inputs={
            "rainfall_mm": request.rainfall_mm,
            "temperature_c": request.temperature_c,
            "aqi": request.aqi,
            "slope_saturation_index": request.slope_saturation_index,
        },
        zone_assessments=zone_assessments,
        summary={
            "p1_critical_count": p_counts["P1"],
            "p2_high_count": p_counts["P2"],
            "p3_moderate_count": p_counts["P3"],
            "p4_low_count": p_counts["P4"],
            "top_priority_zone": top_zone,
        },
        data_reliability=DataReliability(
            data_source="UrbanVerse Pilot GeoJSON (RFC 7946) & Multi-Hazard Heuristic Engine",
            data_freshness="Near real-time scenario simulation",
            method="heuristic_modelling",
            confidence_score=0.88,
            simulation_only=True,
            disclaimer=DISCLAIMER_TEXT,
        ),
    )
