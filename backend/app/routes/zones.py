import os
import json
from fastapi import APIRouter, HTTPException
from app.schemas import ZonesResponse, ZoneDetail, ZoneCoordinates, ZoneAssetsResponse, AssetDetail
from app.services.gis_service import gis_service
from app.services.asset_service import get_assets_by_zone
from app.config import DEFAULT_AREA_ID, DISCLAIMER_TEXT

router = APIRouter(prefix="/api", tags=["GIS & Zones"])


@router.get("/zones", response_model=ZonesResponse)
def get_zones() -> ZonesResponse:
    """Return all 4 official UrbanVerse pilot zones loaded from data/pilot-area.geojson."""
    raw_zones = gis_service.get_all_zones()

    zone_details = []
    for z in raw_zones:
        zone_details.append(
            ZoneDetail(
                zone_id=z["zone_id"],
                name=z["name"],
                zone_name=z.get("zone_name", z["name"]),
                zone_type=z.get("zone_type", "urban"),
                elevation_m=z["elevation_m"],
                description=z.get("description", ""),
                data_type=z.get("data_type", "synthetic"),
                bbox=z.get("bbox"),
                center=ZoneCoordinates(**z["center"]),
                polygon=z["polygon"],
            )
        )

    return ZonesResponse(
        area_id=DEFAULT_AREA_ID,
        area_name="UrbanVerse Pilot Zone (Mangalore)",
        count=len(zone_details),
        zones=zone_details,
        simulation_only=True,
        disclaimer=DISCLAIMER_TEXT,
    )


@router.get("/zones/{zone_id}/assets", response_model=ZoneAssetsResponse)
def get_zone_assets(zone_id: str) -> ZoneAssetsResponse:
    """Return monitored critical urban infrastructure assets mapped to a specific zone."""
    zone = gis_service.get_zone_by_id(zone_id.upper())
    if not zone:
        raise HTTPException(status_code=404, detail=f"Zone '{zone_id}' not found in pilot area.")

    assets_raw = get_assets_by_zone(zone_id.upper())
    assets_parsed = [
        AssetDetail(
            asset_id=a["asset_id"],
            name=a["name"],
            asset_type=a["asset_type"],
            criticality=a["criticality"],
            coordinates=ZoneCoordinates(**a["coordinates"]),
            flood_susceptibility=a["flood_susceptibility"],
            elevation_m=a["elevation_m"],
            serves_population=a["serves_population"],
            status=a["status"],
        )
        for a in assets_raw
    ]

    return ZoneAssetsResponse(
        zone_id=zone["zone_id"],
        zone_name=zone["name"],
        asset_count=len(assets_parsed),
        assets=assets_parsed,
        simulation_only=True,
    )


DATA_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "..", "data"))


@router.get("/buildings/{area}", tags=["GIS & Zones"])
def get_area_buildings(area: str):
    """Return real-world OpenStreetMap building footprints for a specific hotspot (pumpwell, nanthoor, surathkal)."""
    area_clean = area.lower().strip()
    if area_clean not in ["pumpwell", "nanthoor", "surathkal"]:
        raise HTTPException(status_code=404, detail=f"Hotspot area '{area}' not found. Supported: pumpwell, nanthoor, surathkal.")

    file_path = os.path.join(DATA_DIR, area_clean, "buildings.geojson")
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail=f"Building layer for '{area}' not found on disk.")

    with open(file_path, "r", encoding="utf-8") as f:
        return json.load(f)

