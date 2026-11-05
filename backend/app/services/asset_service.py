"""Asset Service: manages critical urban infrastructure assets mapped to GIS zones."""

from typing import Dict, Any, List, Optional

# Inventory of critical assets mapped across the 4 pilot zones
CRITICAL_ASSETS: Dict[str, List[Dict[str, Any]]] = {
    "UV001": [
        {
            "asset_id": "AST-UV001-01",
            "name": "Kadri Primary Healthcare Center",
            "asset_type": "Healthcare",
            "criticality": "Critical",
            "coordinates": {"latitude": 12.8710, "longitude": 74.8480},
            "flood_susceptibility": "Low",
            "elevation_m": 24.5,
            "serves_population": 15000,
            "status": "Operational",
        },
        {
            "asset_id": "AST-UV001-02",
            "name": "Government Model School & Emergency Shelter",
            "asset_type": "Education & Shelter",
            "criticality": "High",
            "coordinates": {"latitude": 12.8730, "longitude": 74.8450},
            "flood_susceptibility": "Low",
            "elevation_m": 25.0,
            "serves_population": 4500,
            "status": "Operational",
        },
        {
            "asset_id": "AST-UV001-03",
            "name": "Residential Water Booster Reservoir",
            "asset_type": "Water Utility",
            "criticality": "High",
            "coordinates": {"latitude": 12.8690, "longitude": 74.8510},
            "flood_susceptibility": "Low",
            "elevation_m": 26.0,
            "serves_population": 22000,
            "status": "Operational",
        },
        {
            "asset_id": "AST-UV001-04",
            "name": "33kV Residential Electrical Substation",
            "asset_type": "Power & Energy",
            "criticality": "Critical",
            "coordinates": {"latitude": 12.8670, "longitude": 74.8430},
            "flood_susceptibility": "Moderate",
            "elevation_m": 22.0,
            "serves_population": 30000,
            "status": "Operational",
        },
    ],
    "UV002": [
        {
            "asset_id": "AST-UV002-01",
            "name": "Hampankatta Central Commercial Hub",
            "asset_type": "Commercial Corridor",
            "criticality": "High",
            "coordinates": {"latitude": 12.8700, "longitude": 74.8580},
            "flood_susceptibility": "High",
            "elevation_m": 18.0,
            "serves_population": 35000,
            "status": "Operational",
        },
        {
            "asset_id": "AST-UV002-02",
            "name": "District Power Distribution Substation",
            "asset_type": "Power & Energy",
            "criticality": "Critical",
            "coordinates": {"latitude": 12.8680, "longitude": 74.8600},
            "flood_susceptibility": "High",
            "elevation_m": 17.5,
            "serves_population": 60000,
            "status": "Operational",
        },
        {
            "asset_id": "AST-UV002-03",
            "name": "Central Transit Bus Terminal",
            "asset_type": "Transportation",
            "criticality": "Critical",
            "coordinates": {"latitude": 12.8720, "longitude": 74.8560},
            "flood_susceptibility": "High",
            "elevation_m": 18.2,
            "serves_population": 50000,
            "status": "Operational",
        },
        {
            "asset_id": "AST-UV002-04",
            "name": "District Fire & Rescue Dispatch Post",
            "asset_type": "Emergency Services",
            "criticality": "Critical",
            "coordinates": {"latitude": 12.8690, "longitude": 74.8620},
            "flood_susceptibility": "Moderate",
            "elevation_m": 19.0,
            "serves_population": 80000,
            "status": "Operational",
        },
    ],
    "UV003": [
        {
            "asset_id": "AST-UV003-01",
            "name": "Coastal Freight & Logistics Hub",
            "asset_type": "Transportation",
            "criticality": "Critical",
            "coordinates": {"latitude": 12.8610, "longitude": 74.8590},
            "flood_susceptibility": "High",
            "elevation_m": 9.5,
            "serves_population": 15000,
            "status": "Operational",
        },
        {
            "asset_id": "AST-UV003-02",
            "name": "Industrial Effluent & Drainage Canal Station",
            "asset_type": "Water & Sanitation",
            "criticality": "Critical",
            "coordinates": {"latitude": 12.8580, "longitude": 74.8620},
            "flood_susceptibility": "Critical",
            "elevation_m": 8.0,
            "serves_population": 25000,
            "status": "Operational",
        },
        {
            "asset_id": "AST-UV003-03",
            "name": "Petroleum & Chemical Storage Terminal",
            "asset_type": "Hazardous Materials",
            "criticality": "Critical",
            "coordinates": {"latitude": 12.8630, "longitude": 74.8550},
            "flood_susceptibility": "High",
            "elevation_m": 10.5,
            "serves_population": 10000,
            "status": "Operational",
        },
    ],
    "UV004": [
        {
            "asset_id": "AST-UV004-01",
            "name": "Gurupura Flood Dewatering Pump Station",
            "asset_type": "Flood Mitigation Utility",
            "criticality": "Critical",
            "coordinates": {"latitude": 12.8610, "longitude": 74.8450},
            "flood_susceptibility": "Critical",
            "elevation_m": 3.8,
            "serves_population": 40000,
            "status": "Operational",
        },
        {
            "asset_id": "AST-UV004-02",
            "name": "River Passenger Ferry Terminal",
            "asset_type": "Transportation",
            "criticality": "High",
            "coordinates": {"latitude": 12.8590, "longitude": 74.8480},
            "flood_susceptibility": "Critical",
            "elevation_m": 3.2,
            "serves_population": 12000,
            "status": "Operational",
        },
        {
            "asset_id": "AST-UV004-03",
            "name": "Riverside Settlement Cyclone & Flood Shelter",
            "asset_type": "Emergency Shelter",
            "criticality": "Critical",
            "coordinates": {"latitude": 12.8630, "longitude": 74.8420},
            "flood_susceptibility": "High",
            "elevation_m": 4.5,
            "serves_population": 8000,
            "status": "Operational",
        },
    ],
}


def get_assets_by_zone(zone_id: str) -> List[Dict[str, Any]]:
    """Return list of assets located in the given zone."""
    return CRITICAL_ASSETS.get(zone_id, [])


def get_all_assets_count() -> int:
    """Return total count of monitored critical assets."""
    return sum(len(v) for v in CRITICAL_ASSETS.values())
