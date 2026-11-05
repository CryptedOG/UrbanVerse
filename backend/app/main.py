from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routes.health import router as health_router
from app.routes.zones import router as zones_router
from app.routes.simulate import router as simulate_router

app = FastAPI(
    title="UrbanVerse Backend API",
    description=(
        "Backend API for UrbanVerse — City-Scale Digital Twin for Multi-Hazard "
        "Prediction and Urban Resilience Planning (Mangalore Pilot Area MVP)."
    ),
    version="1.0.0",
)

# Enable CORS for local frontend development (Vite, React, Next.js, etc.)
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:8080",
        "http://127.0.0.1:8080",
        "*",  # Hackathon permissive mode
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register API routes
app.include_router(health_router)
app.include_router(zones_router)
app.include_router(simulate_router)


@app.get("/", tags=["Root"])
def root():
    """Welcome endpoint providing quick links to API documentation."""
    return {
        "project": "UrbanVerse",
        "message": "UrbanVerse Backend API is running.",
        "docs_url": "/docs",
        "health_check": "/api/health",
        "zones_endpoint": "/api/zones",
        "simulate_endpoint": "/api/simulate",
        "simulation_only": True,
        "disclaimer": "Simulation only; not a live emergency warning.",
    }
