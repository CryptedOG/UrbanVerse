from fastapi import APIRouter
from app.schemas import ZonesResponse
from app.zones_data import SAMPLE_ZONES, DEFAULT_AREA_ID

router = APIRouter(prefix="/api", tags=["GIS & Zones"])


@router.get("/zones", response_model=ZonesResponse)
def get_zones() -> ZonesResponse:
    """Return 4 official urban zones in the UrbanVerse pilot area with provisional coordinates."""
    return ZonesResponse(
        area_id=DEFAULT_AREA_ID,
        area_name="UrbanVerse Pilot Zone",
        count=len(SAMPLE_ZONES),
        zones=SAMPLE_ZONES,
        simulation_only=True,
        disclaimer="Simulation only; not a live emergency warning.",
    )
