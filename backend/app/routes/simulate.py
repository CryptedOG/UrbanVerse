from fastapi import APIRouter, HTTPException
from app.schemas import SimulateRequest, SimulateResponse, ZoneRiskResult
from app.services.gis_service import gis_service
from app.services.hazard_service import assess_flood_hazard
from app.config import DEFAULT_AREA_ID, DISCLAIMER_TEXT

router = APIRouter(prefix="/api", tags=["Simulation"])


@router.post("/simulate", response_model=SimulateResponse)
def simulate_flood_risk(request: SimulateRequest) -> SimulateResponse:
    """Simulate flood risk scores across urban zones based on rainfall in millimetres.

    Adheres strictly to the shared contract defined in 00_Team_Integration_Guide.pdf.
    """
    if request.rainfall_mm < 0:
        raise HTTPException(status_code=400, detail="Rainfall cannot be negative.")

    area_id = request.area_id if request.area_id else DEFAULT_AREA_ID
    zones = gis_service.get_all_zones()

    zone_results = []
    affected_zones = []

    for z in zones:
        assessment = assess_flood_hazard(request.rainfall_mm, z)
        score = assessment["score"]
        level = assessment["level"]

        if score >= 40:
            affected_zones.append(z["zone_id"])

        zone_results.append(
            ZoneRiskResult(
                zone_id=z["zone_id"],
                zone_name=z["name"],
                risk_score=score,
                risk_level=level,
                explanation=assessment["explanation"],
            )
        )

    # Dynamic resilience recommendations based on rainfall severity
    recommendations = []
    if request.rainfall_mm < 35:
        recommendations.append("Normal city operations. Routine monitoring of arterial drain outfalls.")
    elif request.rainfall_mm < 75:
        recommendations.append("Prioritise checks near low-lying roads in Riverside Zone (UV004) and Commercial Zone (UV002).")
        recommendations.append("Pre-position mobile dewatering pumps near Commercial Zone (UV002).")
        recommendations.append("Issue traffic advisories to divert non-essential vehicles toward Residential Zone (UV001).")
    else:
        recommendations.append("URGENT: Activate flood-resilience response protocol for Riverside Zone (UV004) and Industrial Zone (UV003).")
        recommendations.append("Deploy high-capacity mobile pumps to Riverside Zone (UV004) and Industrial Zone (UV003).")
        recommendations.append("Divert arterial traffic away from Commercial Zone (UV002) into elevated Residential Zone (UV001) corridors.")
        recommendations.append("Alert emergency response teams along Riverside Zone (UV004) riverbank settlements.")

    return SimulateResponse(
        area_id=area_id,
        rainfall_mm=request.rainfall_mm,
        zones=zone_results,
        affected_zones=affected_zones,
        recommendations=recommendations,
        simulation_only=True,
        disclaimer=DISCLAIMER_TEXT,
    )
