"""Automated verification tests for UrbanVerse Backend API.

Tests the official UrbanVerse zone IDs (UV001-UV004) and contract rules
defined in 00_Team_Integration_Guide.pdf and Member 1 guidelines.
"""

import sys
import os

# Ensure backend directory is in Python path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.routes.health import get_health
from app.routes.zones import get_zones
from app.routes.simulate import simulate_flood_risk
from app.schemas import SimulateRequest, HealthResponse, ZonesResponse, SimulateResponse
from app.zones_data import DEFAULT_AREA_ID
from app.main import root
from fastapi import HTTPException


def test_health_endpoint():
    """Verify GET /api/health returns 200 and expected status."""
    res = get_health()
    assert isinstance(res, HealthResponse)
    assert res.status == "ok"
    assert res.simulation_only is True
    assert "UrbanVerse" in res.service
    print("  [PASS] GET /api/health -> status: 'ok', simulation_only: True")


def test_zones_endpoint():
    """Verify GET /api/zones returns exactly 4 official UrbanVerse zones with IDs UV001-UV004."""
    res = get_zones()
    assert isinstance(res, ZonesResponse)
    assert res.area_id == "urbanverse-pilot"
    assert res.count == 4
    assert len(res.zones) == 4

    zone_map = {z.zone_id: z for z in res.zones}
    expected_zones = {
        "UV001": "Residential Zone",
        "UV002": "Commercial Zone",
        "UV003": "Industrial Zone",
        "UV004": "Riverside Zone",
    }

    for zid, expected_name in expected_zones.items():
        assert zid in zone_map, f"Missing zone ID: {zid}"
        assert zone_map[zid].name == expected_name, f"Incorrect name for {zid}: {zone_map[zid].name}"
        assert zone_map[zid].elevation_m > 0
        assert zone_map[zid].center.latitude
        assert zone_map[zid].center.longitude
        assert len(zone_map[zid].polygon) >= 4
        assert zone_map[zid].polygon[0] == zone_map[zid].polygon[-1]  # Closed polygon boundary

    print("  [PASS] GET /api/zones -> 4 official zones (UV001-UV004) with provisional coordinates")


def test_simulate_rainfall_30mm_acceptance():
    """Acceptance test: 30 mm rainfall returns low risk scores across all zones."""
    req = SimulateRequest(rainfall_mm=30.0, area_id="urbanverse-pilot")
    res = simulate_flood_risk(req)
    assert isinstance(res, SimulateResponse)

    assert res.area_id == "urbanverse-pilot"
    assert res.rainfall_mm == 30.0
    assert res.simulation_only is True
    assert len(res.zones) == 4

    for z in res.zones:
        assert 0 <= z.risk_score <= 100
        assert z.risk_level in ["Low", "Medium", "High"]
        assert len(z.explanation) > 10

    # At 30mm, all zones including Riverside Zone (UV004) are within Low risk (<40)
    riverside = next(z for z in res.zones if z.zone_id == "UV004")
    assert riverside.risk_level == "Low"
    assert riverside.risk_score < 40
    print("  [PASS] POST /api/simulate (30mm rainfall) -> Low risk across all zones (UV001-UV004)")


def test_simulate_rainfall_80mm():
    """Verify 80 mm rainfall differentiates high, medium and low zones."""
    req = SimulateRequest(rainfall_mm=80.0, area_id="urbanverse-pilot")
    res = simulate_flood_risk(req)

    res_zone = next(z for z in res.zones if z.zone_id == "UV001")
    comm_zone = next(z for z in res.zones if z.zone_id == "UV002")
    ind_zone = next(z for z in res.zones if z.zone_id == "UV003")
    river_zone = next(z for z in res.zones if z.zone_id == "UV004")

    # Riverside Zone (UV004) is high risk at 80mm
    assert river_zone.risk_level == "High"
    # Industrial Zone (UV003) is high risk at 80mm
    assert ind_zone.risk_level == "High"
    # Commercial Zone (UV002) is medium risk at 80mm
    assert comm_zone.risk_level == "Medium"
    # Elevated Residential Zone (UV001) remains low risk
    assert res_zone.risk_level == "Low"

    assert "UV004" in res.affected_zones
    assert "UV002" in res.affected_zones
    assert len(res.recommendations) >= 2
    assert "Simulation only" in res.disclaimer
    print("  [PASS] POST /api/simulate (80mm rainfall) -> UV004: High, UV002: Medium, UV001: Low")


def test_simulate_rainfall_100mm_acceptance():
    """Acceptance test: 100 mm rainfall triggers elevated scores and emergency recommendations."""
    req = SimulateRequest(rainfall_mm=100.0, area_id="urbanverse-pilot")
    res = simulate_flood_risk(req)

    for z in res.zones:
        assert 0 <= z.risk_score <= 100

    river_zone = next(z for z in res.zones if z.zone_id == "UV004")
    comm_zone = next(z for z in res.zones if z.zone_id == "UV002")
    assert river_zone.risk_level == "High"
    assert comm_zone.risk_level == "High"

    assert len(res.affected_zones) >= 2
    assert any("pump" in r.lower() or "divert" in r.lower() for r in res.recommendations)
    print("  [PASS] POST /api/simulate (100mm rainfall) -> High risk & emergency recommendations")


def test_simulate_default_area_id():
    """Verify default area_id is 'urbanverse-pilot' when omitted."""
    req = SimulateRequest(rainfall_mm=50.0)
    res = simulate_flood_risk(req)
    assert res.area_id == "urbanverse-pilot"
    print("  [PASS] Default area_id is 'urbanverse-pilot'")


def test_simulate_invalid_negative_rainfall():
    """Verify negative rainfall triggers validation error."""
    try:
        SimulateRequest(rainfall_mm=-10.0)
        assert False, "Should have raised validation error for negative rainfall"
    except Exception:
        pass

    try:
        req = SimulateRequest.model_construct(rainfall_mm=-10.0, area_id="urbanverse-pilot")
        simulate_flood_risk(req)
        assert False, "Should have raised HTTPException"
    except HTTPException as e:
        assert e.status_code == 400
    print("  [PASS] Validation blocks negative rainfall inputs")


def test_root_endpoint():
    """Verify root / endpoint returns welcome payload and API docs link."""
    res = root()
    assert res["project"] == "UrbanVerse"
    assert res["docs_url"] == "/docs"
    assert res["simulation_only"] is True
    print("  [PASS] GET / -> Welcome metadata and navigation links")


if __name__ == "__main__":
    print("\nRunning UrbanVerse Backend Verification Suite (Official UV001-UV004 Zones):")
    print("=" * 70)
    test_health_endpoint()
    test_zones_endpoint()
    test_simulate_rainfall_30mm_acceptance()
    test_simulate_rainfall_80mm()
    test_simulate_rainfall_100mm_acceptance()
    test_simulate_default_area_id()
    test_simulate_invalid_negative_rainfall()
    test_root_endpoint()
    print("=" * 70)
    print("ALL 8 VERIFICATION TESTS PASSED SUCCESSFULLY!\n")
