from fastapi import APIRouter
from app.schemas import HealthResponse

router = APIRouter(prefix="/api", tags=["System"])


@router.get("/health", response_model=HealthResponse)
def get_health() -> HealthResponse:
    """Check health and status of the UrbanVerse backend service."""
    return HealthResponse(
        status="ok",
        service="UrbanVerse Backend API",
        version="1.0.0",
        simulation_only=True,
    )
