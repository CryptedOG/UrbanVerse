from fastapi import APIRouter
from app.schemas import HazardsResponse, HazardItem
from app.services.hazard_service import HAZARD_CATALOG
from app.config import DISCLAIMER_TEXT

router = APIRouter(prefix="/api", tags=["Multi-Hazard Catalog"])


@router.get("/hazards", response_model=HazardsResponse)
def get_hazard_catalog() -> HazardsResponse:
    """Return the catalog of supported hazards (Flood, Heatwave, Air Pollution, Landslide)."""
    items = [HazardItem(**h) for h in HAZARD_CATALOG]
    return HazardsResponse(
        count=len(items),
        hazards=items,
        simulation_only=True,
        disclaimer=DISCLAIMER_TEXT,
    )
