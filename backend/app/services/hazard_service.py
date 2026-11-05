"""Multi-Hazard Assessment Engine for UrbanVerse.

Evaluates 4 urban hazards:
1. Urban Flooding (elevation, drainage capacity, rainfall mm)
2. Heatwave & Urban Heat Island (ambient temperature, impervious surface, canopy)
3. Air Pollution (particulate matter AQI, industrial/traffic emission dispersion)
4. Landslide (slope gradient, soil saturation, rainfall intensity; applicable only to sloped zones)

Note: All calculations are deterministic heuristic models designed for prototype demonstration.
"""

from typing import Dict, Any, List


# Catalog of supported hazards with scientific/methodological metadata
HAZARD_CATALOG = [
    {
        "hazard_id": "flood",
        "name": "Urban Flooding & Surface Waterlogging",
        "category": "Hydrometeorological",
        "unit": "mm (simulated precipitation)",
        "input_parameter": "rainfall_mm",
        "default_value": 80.0,
        "normal_range": "0 - 40 mm",
        "severe_threshold": "75+ mm",
        "applicable_zones": ["UV001", "UV002", "UV003", "UV004"],
        "methodology": "Elevation-weighted runoff accumulation model",
        "data_status": "modelled",
        "description": "Simulates stormwater accumulation based on terrain elevation, drainage discharge capacity, and impervious surface ratio.",
    },
    {
        "hazard_id": "heatwave",
        "name": "Urban Heat Island & Thermal Stress",
        "category": "Climatological",
        "unit": "°C (ambient dry-bulb temperature)",
        "input_parameter": "temperature_c",
        "default_value": 36.5,
        "normal_range": "28 - 33 °C",
        "severe_threshold": "38+ °C",
        "applicable_zones": ["UV001", "UV002", "UV003", "UV004"],
        "methodology": "Impervious surface thermal emissivity heuristic",
        "data_status": "estimated",
        "description": "Estimates localized microclimate thermal anomalies resulting from high concrete mass, building geometry, and sparse vegetation.",
    },
    {
        "hazard_id": "air_pollution",
        "name": "Atmospheric Pollution & Particulate Exposure",
        "category": "Environmental",
        "unit": "AQI (Air Quality Index 0-500)",
        "input_parameter": "aqi",
        "default_value": 165.0,
        "normal_range": "0 - 100 AQI",
        "severe_threshold": "201+ AQI",
        "applicable_zones": ["UV001", "UV002", "UV003", "UV004"],
        "methodology": "Emission source proximity and marine dispersion heuristic",
        "data_status": "estimated",
        "description": "Quantifies air pollutant exposure based on vehicular traffic corridors, port logistics emissions, and coastal wind dispersion.",
    },
    {
        "hazard_id": "landslide",
        "name": "Slope Failure & Soil Slip Hazard",
        "category": "Geological / Geomorphological",
        "unit": "Index (0.0 to 1.0 combined saturation factor)",
        "input_parameter": "slope_saturation_index",
        "default_value": 0.55,
        "normal_range": "0.0 - 0.3",
        "severe_threshold": "0.7+",
        "applicable_zones": ["UV001"],  # Only elevated sloped terrain
        "methodology": "Slope gradient saturation instability model",
        "data_status": "estimated",
        "description": "Evaluates slope failure vulnerability along laterite hill cuttings. Geographically constrained to elevated inland sectors.",
    },
]


def assess_flood_hazard(rainfall_mm: float, zone: Dict[str, Any]) -> Dict[str, Any]:
    """Calculate urban flood risk score (0-100) and severity level."""
    elev = zone.get("elevation_m", 15.0)
    ztype = zone.get("zone_type", "urban")

    # Baseline vulnerability derived from terrain elevation and surface type
    # UV004 (4m): 1.30x, UV003 (10m): 1.15x, UV002 (18m): 1.00x, UV001 (24m): 0.45x
    if elev <= 5.0:
        base_factor = 1.30
    elif elev <= 12.0:
        base_factor = 1.15
    elif elev <= 20.0:
        base_factor = 1.00
    else:
        base_factor = 0.45

    # Concrete runoff factor for commercial hub
    if ztype == "commercial" and base_factor < 1.0:
        base_factor += 0.10

    raw_score = (rainfall_mm / 120.0) * 100.0 * base_factor
    score = int(min(100, max(0, round(raw_score))))

    if score < 40:
        level = "Low"
        explanation = f"Rainfall of {rainfall_mm:.1f} mm easily absorbed by terrain ({elev}m elev)."
    elif score < 70:
        level = "Medium"
        explanation = f"Moderate water ponding anticipated; stormwater culverts operating at ~75% capacity in {zone['name']}."
    elif score < 90:
        level = "High"
        explanation = f"Severe flooding alert: Low elevation ({elev}m) leads to critical street inundation and drain backflow."
    else:
        level = "Critical"
        explanation = f"Flash flood emergency: Inundation depths > 0.8m expected across {zone['name']}."

    return {
        "hazard_id": "flood",
        "hazard_name": "Urban Flooding",
        "score": score,
        "level": level,
        "intensity_metric": f"{rainfall_mm:.1f} mm rainfall",
        "explanation": explanation,
    }


def assess_heat_hazard(temperature_c: float, zone: Dict[str, Any]) -> Dict[str, Any]:
    """Calculate urban heat island stress score (0-100)."""
    ztype = zone.get("zone_type", "urban")

    # Microclimate adjustments based on land cover
    if ztype == "commercial":
        microclimate_delta = 3.2  # Heavy asphalt, concrete canyon
    elif ztype == "industrial":
        microclimate_delta = 2.5  # Metal roofs, low tree canopy
    elif ztype == "residential":
        microclimate_delta = 0.8  # Moderate tree cover
    elif ztype == "riverside":
        microclimate_delta = -1.2  # Water body evaporative cooling
    else:
        microclimate_delta = 0.0

    effective_temp = temperature_c + microclimate_delta

    # Mapping: 30°C -> ~15, 36°C -> ~55, 40°C -> ~85, 43°C+ -> 100
    if effective_temp <= 28.0:
        score = 10
    else:
        score = int(min(100, max(0, round(((effective_temp - 28.0) / 14.0) * 100.0))))

    if score < 40:
        level = "Low"
        explanation = f"Comfortable thermal conditions (effective temp {effective_temp:.1f}°C)."
    elif score < 70:
        level = "Medium"
        explanation = f"Moderate heat stress. Thermal anomaly of +{microclimate_delta:+.1f}°C in {zone['name']}."
    elif score < 90:
        level = "High"
        explanation = f"High thermal alert (effective temp {effective_temp:.1f}°C). Vulnerable populations require cooling shelters."
    else:
        level = "Critical"
        explanation = f"Dangerous heatwave index exceeding 42°C equivalent in {zone['name']}."

    return {
        "hazard_id": "heatwave",
        "hazard_name": "Urban Heat Island",
        "score": score,
        "level": level,
        "intensity_metric": f"{temperature_c:.1f}°C ambient ({effective_temp:.1f}°C effective)",
        "explanation": explanation,
    }


def assess_air_pollution_hazard(aqi: float, zone: Dict[str, Any]) -> Dict[str, Any]:
    """Calculate air pollution exposure score (0-100)."""
    ztype = zone.get("zone_type", "urban")

    # Local emission multiplier
    if ztype == "industrial":
        multiplier = 1.25  # Port freight & machinery emissions
    elif ztype == "commercial":
        multiplier = 1.15  # Vehicle stop-and-go idling
    elif ztype == "residential":
        multiplier = 0.90  # Buffer setback
    elif ztype == "riverside":
        multiplier = 0.80  # Coastal wind dispersion
    else:
        multiplier = 1.0

    local_aqi = aqi * multiplier
    score = int(min(100, max(0, round((local_aqi / 350.0) * 100.0))))

    if score < 30:
        level = "Low"
        explanation = f"Good to satisfactory air quality (localized AQI {local_aqi:.0f})."
    elif score < 60:
        level = "Medium"
        explanation = f"Moderate particulate pollution (localized AQI {local_aqi:.0f}). Sensitive groups should limit prolonged exertion."
    elif score < 85:
        level = "High"
        explanation = f"Unhealthy atmospheric pollution (localized AQI {local_aqi:.0f}) concentrated in {zone['name']}."
    else:
        level = "Critical"
        explanation = f"Severe air pollution event (localized AQI {local_aqi:.0f}). Widespread respiratory advisory active."

    return {
        "hazard_id": "air_pollution",
        "hazard_name": "Air Pollution",
        "score": score,
        "level": level,
        "intensity_metric": f"AQI {aqi:.0f} (local {local_aqi:.0f})",
        "explanation": explanation,
    }


def assess_landslide_hazard(rainfall_mm: float, saturation_index: float, zone: Dict[str, Any]) -> Dict[str, Any]:
    """Calculate landslide vulnerability. Geographically restricted to elevated sloped sectors."""
    elev = zone.get("elevation_m", 10.0)
    zid = zone.get("zone_id")

    # Landslide is ONLY geographically applicable to UV001 (elevated hills, 24m)
    if zid != "UV001" or elev < 20.0:
        return {
            "hazard_id": "landslide",
            "hazard_name": "Slope Failure / Landslide",
            "score": 0,
            "level": "Low",
            "intensity_metric": "Not applicable",
            "explanation": f"Flat terrain ({elev}m elevation); zero geomorphological slope failure hazard.",
            "is_applicable": False,
        }

    # For sloped zone UV001:
    # Requires both heavy rainfall and high soil moisture saturation
    rain_term = min(1.0, rainfall_mm / 140.0)
    combined_instability = (rain_term * 0.6) + (saturation_index * 0.4)
    score = int(min(100, max(0, round(combined_instability * 100.0))))

    if score < 35:
        level = "Low"
        explanation = "Stable hillside slope conditions. Pore water pressure within safe thresholds."
    elif score < 65:
        level = "Medium"
        explanation = f"Moderate hillside instability on laterite cutting slopes in {zone['name']}."
    elif score < 85:
        level = "High"
        explanation = f"High slope failure hazard: Sustained rainfall ({rainfall_mm:.1f}mm) saturating cutting slopes."
    else:
        level = "Critical"
        explanation = "Critical landslide danger along hillside retaining perimeters. Evacuate toe-of-slope structures."

    return {
        "hazard_id": "landslide",
        "hazard_name": "Slope Failure / Landslide",
        "score": score,
        "level": level,
        "intensity_metric": f"{rainfall_mm:.0f}mm rain + {saturation_index:.2f} saturation",
        "explanation": explanation,
        "is_applicable": True,
    }
