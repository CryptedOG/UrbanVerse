from datetime import datetime, timezone
from fastapi import APIRouter
from app.schemas import DataSourcesResponse, DataSourceItem
from app.config import DEFAULT_AREA_ID, GEOJSON_PATH, DISCLAIMER_TEXT

router = APIRouter(prefix="/api", tags=["Data Governance & Provenance"])

DATA_SOURCES_CATALOG = [
    {
        "source_id": "SRC-GIS-01",
        "name": "UrbanVerse Pilot Area Boundaries & Polygons",
        "category": "Geospatial Boundary Layer",
        "file_path": str(GEOJSON_PATH),
        "status": "Active (Local File Loaded)",
        "format": "GeoJSON (RFC 7946)",
        "crs": "WGS 84 (EPSG:4326)",
        "data_type": "synthetic",
        "is_live": False,
        "reliability": "Verified Synthetic (Zero Topology Gaps, CCW Rings)",
        "notes": "Authored by Member 3 (GIS). Boundaries are synthetic demonstration data for Mangalore pilot area.",
    },
    {
        "source_id": "SRC-RAIN-02",
        "name": "Simulated Precipitation Engine",
        "category": "Hydrometeorological Input",
        "file_path": None,
        "status": "Active (User-Controlled Slider / API)",
        "format": "Millimetres (mm)",
        "crs": None,
        "data_type": "simulated",
        "is_live": False,
        "reliability": "Illustrative Scenario Simulator",
        "notes": "Accepts user-specified rainfall scenarios (0-150mm) to model localized drainage exceedance.",
    },
    {
        "source_id": "SRC-TEMP-03",
        "name": "Urban Heat Island Microclimate Heuristic",
        "category": "Thermal & Climatological",
        "file_path": None,
        "status": "Active (Computed)",
        "format": "Degrees Celsius (°C)",
        "crs": None,
        "data_type": "estimated",
        "is_live": False,
        "reliability": "Heuristic Microclimate Approximation",
        "notes": "Accounts for asphalt/concrete thermal mass in commercial sectors and evaporative cooling near rivers.",
    },
    {
        "source_id": "SRC-AQI-04",
        "name": "Coastal Air Quality Dispersion Index",
        "category": "Environmental Exposure",
        "file_path": None,
        "status": "Active (Computed)",
        "format": "Standard India AQI (0-500)",
        "crs": None,
        "data_type": "estimated",
        "is_live": False,
        "reliability": "Heuristic Dispersion Model",
        "notes": "Incorporates coastal maritime wind dilution and freight logistics emissions.",
    },
    {
        "source_id": "SRC-ASSET-05",
        "name": "Urban Critical Infrastructure Inventory",
        "category": "Vulnerability & Asset Exposure",
        "file_path": "backend/app/services/asset_service.py",
        "status": "Active (Curated In-Memory DB)",
        "format": "JSON Object Catalog",
        "crs": "WGS 84 (EPSG:4326)",
        "data_type": "synthetic",
        "is_live": False,
        "reliability": "Representative Urban Asset Baseline",
        "notes": "Catalogs hospitals, power substations, fire stations, and emergency shelters across all 4 zones.",
    },
]


@router.get("/data-sources/status", response_model=DataSourcesResponse)
def get_data_sources_status() -> DataSourcesResponse:
    """Return operational status, provenance, and reliability metadata for all platform data sources."""
    items = [DataSourceItem(**src) for src in DATA_SOURCES_CATALOG]
    return DataSourcesResponse(
        area_id=DEFAULT_AREA_ID,
        timestamp=datetime.now(timezone.utc).isoformat(),
        source_count=len(items),
        sources=items,
        simulation_only=True,
        disclaimer=DISCLAIMER_TEXT,
    )
