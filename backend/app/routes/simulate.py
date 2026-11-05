from fastapi import APIRouter, HTTPException
from app.schemas import SimulateRequest, SimulateResponse
from app.zones_data import run_deterministic_simulation, DEFAULT_AREA_ID

router = APIRouter(prefix="/api", tags=["Simulation"])


@router.post("/simulate", response_model=SimulateResponse)
def simulate_flood_risk(request: SimulateRequest) -> SimulateResponse:
    """Simulate flood risk scores across urban zones based on rainfall in millimetres.

    Adheres strictly to the shared contract defined in 00_Team_Integration_Guide.pdf.
    """
    if request.rainfall_mm < 0:
        raise HTTPException(status_code=400, detail="Rainfall cannot be negative.")

    area_id = request.area_id if request.area_id else DEFAULT_AREA_ID
    result = run_deterministic_simulation(rainfall_mm=request.rainfall_mm, area_id=area_id)
    return SimulateResponse(**result)
