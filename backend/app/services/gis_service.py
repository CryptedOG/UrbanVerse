"""GIS Service: loads and manages spatial data from data/pilot-area.geojson.

Conforms strictly to GeoJSON RFC 7946 (WGS84 EPSG:4326).
"""

import json
import logging
from typing import Dict, Any, List, Optional
from app.config import GEOJSON_PATH

logger = logging.getLogger("urbanverse.gis")

# Built-in fallback in case pilot-area.geojson is temporarily moved or unavailable
FALLBACK_FEATURES = [
    {
        "zone_id": "UV001",
        "name": "Residential Zone",
        "zone_type": "residential",
        "elevation_m": 24.0,
        "description": "Inland elevated residential sector; lower vulnerability to tidal flooding.",
        "center": {"latitude": 12.8700, "longitude": 74.8460},
        "bbox": [74.8400, 12.8650, 74.8520, 12.8750],
        "polygon": [
            [74.8400, 12.8650],
            [74.8520, 12.8650],
            [74.8520, 12.8750],
            [74.8400, 12.8750],
            [74.8400, 12.8650],
        ],
    },
    {
        "zone_id": "UV002",
        "name": "Commercial Zone",
        "zone_type": "commercial",
        "elevation_m": 18.0,
        "description": "Northeastern urban commercial district; high impervious concrete coverage.",
        "center": {"latitude": 12.8700, "longitude": 74.8580},
        "bbox": [74.8520, 12.8650, 74.8640, 12.8750],
        "polygon": [
            [74.8520, 12.8650],
            [74.8640, 12.8650],
            [74.8640, 12.8750],
            [74.8520, 12.8750],
            [74.8520, 12.8650],
        ],
    },
    {
        "zone_id": "UV003",
        "name": "Industrial Zone",
        "zone_type": "industrial",
        "elevation_m": 10.0,
        "description": "Southeastern mid-elevation industrial and warehousing transport corridor.",
        "center": {"latitude": 12.8600, "longitude": 74.8580},
        "bbox": [74.8520, 12.8550, 74.8640, 12.8650],
        "polygon": [
            [74.8520, 12.8550],
            [74.8640, 12.8550],
            [74.8640, 12.8650],
            [74.8520, 12.8650],
            [74.8520, 12.8550],
        ],
    },
    {
        "zone_id": "UV004",
        "name": "Riverside Zone",
        "zone_type": "riverside",
        "elevation_m": 4.0,
        "description": "Southwestern low-lying riparian basin; high baseline susceptibility to flooding.",
        "center": {"latitude": 12.8600, "longitude": 74.8460},
        "bbox": [74.8400, 12.8550, 74.8520, 12.8650],
        "polygon": [
            [74.8400, 12.8550],
            [74.8520, 12.8550],
            [74.8520, 12.8650],
            [74.8400, 12.8650],
            [74.8400, 12.8550],
        ],
    },
]


class GISService:
    def __init__(self):
        self._raw_geojson: Optional[Dict[str, Any]] = None
        self._zones: List[Dict[str, Any]] = []
        self._zone_map: Dict[str, Dict[str, Any]] = {}
        self.load_spatial_data()

    def load_spatial_data(self) -> None:
        """Load and parse the GeoJSON file from disk."""
        if GEOJSON_PATH.exists():
            try:
                with open(GEOJSON_PATH, "r", encoding="utf-8") as f:
                    data = json.load(f)
                self._raw_geojson = data
                parsed_zones = []

                for feature in data.get("features", []):
                    props = feature.get("properties", {})
                    geom = feature.get("geometry", {})
                    coords = geom.get("coordinates", [[]])[0]
                    bbox = feature.get("bbox", [])

                    # Compute geometric center
                    if len(bbox) >= 4:
                        center_lon = (bbox[0] + bbox[2]) / 2.0
                        center_lat = (bbox[1] + bbox[3]) / 2.0
                    elif coords:
                        center_lon = sum(pt[0] for pt in coords) / len(coords)
                        center_lat = sum(pt[1] for pt in coords) / len(coords)
                    else:
                        center_lon, center_lat = 74.8500, 12.8650

                    zid = props.get("zone_id") or feature.get("id")
                    name = props.get("zone_name") or f"Zone {zid}"
                    zone_dict = {
                        "zone_id": zid,
                        "name": name,
                        "zone_name": name,
                        "zone_type": props.get("zone_type", "urban"),
                        "elevation_m": float(props.get("elevation_m", 15.0)),
                        "description": props.get("description", ""),
                        "data_type": props.get("data_type", "synthetic"),
                        "bbox": bbox,
                        "center": {"latitude": round(center_lat, 6), "longitude": round(center_lon, 6)},
                        "polygon": coords,
                        "geometry": geom,
                    }
                    parsed_zones.append(zone_dict)

                if parsed_zones:
                    self._zones = parsed_zones
                    self._zone_map = {z["zone_id"]: z for z in parsed_zones}
                    logger.info("Successfully loaded %d zones from %s", len(self._zones), GEOJSON_PATH)
                    return
            except Exception as e:
                logger.error("Failed to parse %s: %s. Using fallback.", GEOJSON_PATH, e)

        # Fallback if file load fails
        self._zones = FALLBACK_FEATURES
        self._zone_map = {z["zone_id"]: z for z in FALLBACK_FEATURES}

    def get_all_zones(self) -> List[Dict[str, Any]]:
        """Return all parsed zones."""
        return self._zones

    def get_zone_by_id(self, zone_id: str) -> Optional[Dict[str, Any]]:
        """Return a single zone by ID (UV001 - UV004)."""
        return self._zone_map.get(zone_id)

    def get_raw_geojson(self) -> Dict[str, Any]:
        """Return the raw GeoJSON FeatureCollection."""
        if self._raw_geojson:
            return self._raw_geojson
        # Synthesize from fallback if needed
        features = []
        for z in self._zones:
            features.append({
                "type": "Feature",
                "id": z["zone_id"],
                "bbox": z.get("bbox"),
                "properties": {
                    "zone_id": z["zone_id"],
                    "zone_name": z["name"],
                    "zone_type": z.get("zone_type"),
                    "elevation_m": z["elevation_m"],
                    "description": z["description"],
                    "data_type": "synthetic",
                },
                "geometry": {
                    "type": "Polygon",
                    "coordinates": [z["polygon"]],
                },
            })
        return {
            "type": "FeatureCollection",
            "name": "UrbanVerse_Pilot_Area_Mangalore_Synthetic",
            "bbox": [74.8400, 12.8550, 74.8640, 12.8750],
            "features": features,
        }


# Global singleton instance
gis_service = GISService()
