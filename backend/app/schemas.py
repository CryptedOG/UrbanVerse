from typing import List, Optional
from pydantic import BaseModel, Field


class HealthResponse(BaseModel):
    status: str = Field(default="ok", example="ok")
    service: str = Field(default="UrbanVerse Backend API", example="UrbanVerse Backend API")
    version: str = Field(default="1.0.0", example="1.0.0")
    simulation_only: bool = Field(default=True, example=True)


class ZoneCoordinates(BaseModel):
    latitude: float
    longitude: float


class ZoneDetail(BaseModel):
    zone_id: str = Field(..., description="Unique stable zone identifier matching GIS data")
    name: str = Field(..., description="Human-readable urban area name")
    description: str = Field(..., description="Brief terrain/urban context of the zone")
    elevation_m: float = Field(..., description="Average elevation in metres")
    center: ZoneCoordinates
    polygon: List[List[float]] = Field(
        ...,
        description="GeoJSON-compatible polygon boundary [ [longitude, latitude], ... ]"
    )


class ZonesResponse(BaseModel):
    area_id: str = Field(default="urbanverse-pilot")
    area_name: str = Field(default="UrbanVerse Pilot Zone")
    count: int
    zones: List[ZoneDetail]
    simulation_only: bool = True
    disclaimer: str = "Simulation only; not a live emergency warning."


class SimulateRequest(BaseModel):
    rainfall_mm: float = Field(..., ge=0, le=1000, description="Simulated rainfall input in millimetres")
    area_id: Optional[str] = Field(default="urbanverse-pilot", description="Pilot area identifier")


class ZoneRiskResult(BaseModel):
    zone_id: str = Field(..., description="Matches zone ID from GIS data")
    zone_name: str = Field(..., description="Display name for the zone")
    risk_score: int = Field(..., ge=0, le=100, description="Risk score from 0 to 100")
    risk_level: str = Field(..., description="Low, Medium, or High")
    explanation: str = Field(..., description="Deterministic reasoning for the calculated score")


class SimulateResponse(BaseModel):
    area_id: str = Field(..., description="Pilot area identifier")
    rainfall_mm: float = Field(..., description="Simulated rainfall received")
    zones: List[ZoneRiskResult] = Field(..., description="Calculated risk per zone")
    affected_zones: List[str] = Field(..., description="Zone IDs with elevated risk (Medium or High)")
    recommendations: List[str] = Field(..., description="Actionable emergency & traffic resilience suggestions")
    simulation_only: bool = Field(default=True, description="Always true for hackathon prototype")
    disclaimer: str = Field(
        default="Simulation only; not a live emergency warning.",
        description="Mandatory disclaimer for prototype demonstration"
    )
