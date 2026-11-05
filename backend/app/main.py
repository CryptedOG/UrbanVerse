from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import CORS_ORIGINS, SERVICE_NAME, SERVICE_VERSION, DISCLAIMER_TEXT

# Route imports
from app.routes.health import router as health_router
from app.routes.zones import router as zones_router
from app.routes.simulate import router as simulate_router
from app.routes.hazards import router as hazards_router
from app.routes.priorities import router as priorities_router
from app.routes.assess import router as assess_router
from app.routes.data_sources import router as data_sources_router

app = FastAPI(
    title=SERVICE_NAME,
    description=(
        "UrbanVerse Backend API — City-Scale Digital Twin for Multi-Hazard Prediction "
        "and Urban Resilience Planning (Mangalore Pilot Area). Provides GIS spatial data, "
        "multi-hazard assessments (Flood, Heatwave, Air Pollution, Landslide), and "
        "P1–P4 resilience prioritization."
    ),
    version=SERVICE_VERSION,
)

# Enable CORS for local frontend development (React, Vite, Next.js, etc.)
app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register all API routes
app.include_router(health_router)
app.include_router(zones_router)
app.include_router(simulate_router)
app.include_router(hazards_router)
app.include_router(priorities_router)
app.include_router(assess_router)
app.include_router(data_sources_router)


@app.get("/", tags=["Root"])
def root():
    """Welcome endpoint providing quick navigation links to all API endpoints and docs."""
    return {
        "project": "UrbanVerse",
        "service": SERVICE_NAME,
        "version": SERVICE_VERSION,
        "docs_url": "/docs",
        "endpoints": {
            "health": "/api/health",
            "zones": "/api/zones",
            "simulate": "/api/simulate",
            "hazards": "/api/hazards",
            "priorities": "/api/priorities",
            "assess": "/api/assess",
            "zone_assets_example": "/api/zones/UV001/assets",
            "data_sources": "/api/data-sources/status",
        },
        "simulation_only": True,
        "disclaimer": DISCLAIMER_TEXT,
    }
