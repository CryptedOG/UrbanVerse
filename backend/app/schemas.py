from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field


# -------------------------------------------------------------
# System & Health
# -------------------------------------------------------------
class HealthResponse(BaseModel):
    status: str = Field(default="ok", example="ok")
    service: str = Field(default="UrbanVerse Multi-Hazard Resilience Backend API")
    version: str = Field(default="2.0.0")
    simulation_only: bool = Field(default=True)


# -------------------------------------------------------------
# GIS & Zones
# -------------------------------------------------------------
class ZoneCoordinates(BaseModel):
    latitude: float
    longitude: float


class ZoneDetail(BaseModel):
    zone_id: str = Field(..., description="Unique stable zone identifier (UV001 - UV004)")
    name: str = Field(..., description="Human-readable urban area name")
    zone_name: Optional[str] = Field(None, description="Alias matching GeoJSON properties")
    zone_type: Optional[str] = Field("urban", description="residential, commercial, industrial, riverside")
    elevation_m: float = Field(..., description="Average elevation in metres")
    description: str = Field(..., description="Terrain and urban context")
    data_type: Optional[str] = Field("synthetic", description="Provenance marker")
    bbox: Optional[List[float]] = Field(None, description="[minLon, minLat, maxLon, maxLat]")
    center: ZoneCoordinates
    polygon: List[List[float]] = Field(
        ...,
        description="GeoJSON-compatible exterior ring [ [longitude, latitude], ... ]"
    )


class ZonesResponse(BaseModel):
    area_id: str = Field(default="urbanverse-pilot")
    area_name: str = Field(default="UrbanVerse Pilot Zone (Mangalore)")
    count: int
    zones: List[ZoneDetail]
    simulation_only: bool = True
    disclaimer: str = "Simulation only; not a live emergency warning."


# -------------------------------------------------------------
# Flood Simulation (Backward Compatible)
# -------------------------------------------------------------
class SimulateRequest(BaseModel):
    rainfall_mm: float = Field(..., ge=0, le=1000, description="Simulated rainfall in millimetres")
    area_id: Optional[str] = Field(default="urbanverse-pilot", description="Pilot area identifier")


class ZoneRiskResult(BaseModel):
    zone_id: str
    zone_name: str
    risk_score: int = Field(..., ge=0, le=100)
    risk_level: str = Field(..., description="Low, Medium, High, or Critical")
    explanation: str


class SimulateResponse(BaseModel):
    area_id: str
    rainfall_mm: float
    zones: List[ZoneRiskResult]
    affected_zones: List[str]
    recommendations: List[str]
    simulation_only: bool = True
    disclaimer: str = "Simulation only; not a live emergency warning."


# -------------------------------------------------------------
# Hazard Catalog
# -------------------------------------------------------------
class HazardItem(BaseModel):
    hazard_id: str
    name: str
    category: str
    unit: str
    input_parameter: str
    default_value: float
    normal_range: str
    severe_threshold: str
    applicable_zones: List[str]
    methodology: str
    data_status: str
    description: str


class HazardsResponse(BaseModel):
    count: int
    hazards: List[HazardItem]
    simulation_only: bool = True
    disclaimer: str = "Simulation only; not a live emergency warning."


# -------------------------------------------------------------
# Priorities & Sub-Priority Ranking
# -------------------------------------------------------------
class PriorityExposure(BaseModel):
    population_density_km2: int
    population_exposure_score: int
    infrastructure_exposure_score: int
    combined_exposure_score: int
    critical_asset_count: int


class PriorityVulnerability(BaseModel):
    vulnerability_score: int
    elevation_m: float
    terrain_risk_factor: float


class ZonePrioritySummary(BaseModel):
    zone_id: str
    zone_name: str
    zone_type: str
    elevation_m: float
    priority: str = Field(..., description="P1, P2, P3, or P4")
    priority_label: str = Field(..., description="e.g. P1 — Critical")
    composite_risk_score: int = Field(..., ge=0, le=100)
    overall_rank: int = Field(..., ge=1, le=4, description="City-wide priority ranking (1=most critical)")
    sub_priority_rank: int = Field(..., ge=1, description="Rank within this priority tier")
    sub_priority_label: str = Field(..., description="e.g. P1 Rank #1")
    hazard_intensity_score: int = Field(..., ge=0, le=100)
    primary_hazard: str
    primary_hazard_id: str
    primary_hazard_score: int
    hazards: Optional[Dict[str, Any]] = None
    exposure: PriorityExposure
    vulnerability: PriorityVulnerability
    action_required: str


class PrioritiesResponse(BaseModel):
    area_id: str = "urbanverse-pilot"
    timestamp: str
    zone_count: int
    priorities: List[ZonePrioritySummary]
    summary: Dict[str, Any]
    simulation_only: bool = True
    disclaimer: str = "Simulation only; not a live emergency warning."


# -------------------------------------------------------------
# Multi-Hazard Assessment
# -------------------------------------------------------------
class AssessRequest(BaseModel):
    rainfall_mm: Optional[float] = Field(default=80.0, ge=0, le=1000)
    temperature_c: Optional[float] = Field(default=36.5, ge=15, le=55)
    aqi: Optional[float] = Field(default=165.0, ge=0, le=500)
    slope_saturation_index: Optional[float] = Field(default=0.55, ge=0.0, le=1.0)
    area_id: Optional[str] = Field(default="urbanverse-pilot")


class DataReliability(BaseModel):
    data_source: str
    data_freshness: str
    method: str
    confidence_score: float
    simulation_only: bool = True
    disclaimer: str = "Simulation only; not a live emergency warning."


class AssessResponse(BaseModel):
    assessment_id: str
    timestamp: str
    area_id: str
    inputs: Dict[str, Any]
    zone_assessments: List[ZonePrioritySummary]
    summary: Dict[str, Any]
    data_reliability: DataReliability


# -------------------------------------------------------------
# Critical Assets
# -------------------------------------------------------------
class AssetDetail(BaseModel):
    asset_id: str
    name: str
    asset_type: str
    criticality: str
    coordinates: ZoneCoordinates
    flood_susceptibility: str
    elevation_m: float
    serves_population: int
    status: str


class ZoneAssetsResponse(BaseModel):
    zone_id: str
    zone_name: str
    asset_count: int
    assets: List[AssetDetail]
    simulation_only: bool = True


# -------------------------------------------------------------
# Data Sources Status
# -------------------------------------------------------------
class DataSourceItem(BaseModel):
    source_id: str
    name: str
    category: str
    file_path: Optional[str] = None
    status: str
    format: str
    crs: Optional[str] = None
    data_type: str
    is_live: bool
    reliability: str
    notes: str


class DataSourcesResponse(BaseModel):
    area_id: str = "urbanverse-pilot"
    timestamp: str
    source_count: int
    sources: List[DataSourceItem]
    simulation_only: bool = True
    disclaimer: str = "Simulation only; not a live emergency warning."
