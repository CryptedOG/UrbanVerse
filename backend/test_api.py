"""Comprehensive Verification Test Suite for UrbanVerse Backend API.

Tests all required endpoints:
1. GET /api/health
2. GET /api/zones (GIS GeoJSON RFC 7946 compliance)
3. POST /api/simulate (Backward compatible flood simulation)
4. GET /api/hazards (Multi-hazard catalog: Flood, Heat, Air, Landslide)
5. GET /api/priorities (P1-P4 Priority & sub-priority ranking)
6. POST /api/assess (Full multi-hazard assessment with exposure/vulnerability)
7. GET /api/zones/{id}/assets (Critical infrastructure asset inventory)
8. GET /api/data-sources/status (Data reliability & provenance)
9. GET / (Root navigation)
"""

import sys
import os

# Ensure backend directory is in Python path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.routes.health import get_health
from app.routes.zones import get_zones, get_zone_assets
from app.routes.simulate import simulate_flood_risk
from app.routes.hazards import get_hazard_catalog
from app.routes.priorities import get_priorities
from app.routes.assess import assess_multi_hazard
from app.routes.data_sources import get_data_sources_status
from app.routes.zones import get_zone_assets
from app.main import root
from app.schemas import (
    SimulateRequest,
    AssessRequest,
    HealthResponse,
    ZonesResponse,
    SimulateResponse,
    HazardsResponse,
    PrioritiesResponse,
    AssessResponse,
    ZoneAssetsResponse,
    DataSourcesResponse,
)
from fastapi import HTTPException


def test_health_endpoint():
    """Verify GET /api/health returns 200 and expected status."""
    res = get_health()
    assert isinstance(res, HealthResponse)
    assert res.status == "ok"
    assert res.simulation_only is True
    print("  [PASS] GET /api/health -> Status: 'ok', simulation_only: True")


def test_zones_endpoint():
    """Verify GET /api/zones returns 4 official zones loaded from GeoJSON with coordinates and polygons."""
    res = get_zones()
    assert isinstance(res, ZonesResponse)
    assert res.count == 4
    assert len(res.zones) == 4

    zone_ids = [z.zone_id for z in res.zones]
    for expected_id in ["UV001", "UV002", "UV003", "UV004"]:
        assert expected_id in zone_ids, f"Missing zone {expected_id}"

    for z in res.zones:
        assert z.name
        assert z.elevation_m > 0
        assert z.center.latitude
        assert z.center.longitude
        assert len(z.polygon) >= 5  # Closed RFC 7946 polygon ring
        assert z.polygon[0] == z.polygon[-1]  # Closed polygon boundary

    print("  [PASS] GET /api/zones -> 4 official GIS zones loaded from GeoJSON RFC 7946")


def test_simulate_backward_compatibility():
    """Verify POST /api/simulate satisfies original contract."""
    # Test 30mm: all Low
    req30 = SimulateRequest(rainfall_mm=30.0, area_id="urbanverse-pilot")
    res30 = simulate_flood_risk(req30)
    assert isinstance(res30, SimulateResponse)
    assert len(res30.zones) == 4
    for z in res30.zones:
        assert z.risk_score < 40
        assert z.risk_level == "Low"

    # Test 80mm: Riverside High, Commercial Medium, Residential Low
    req80 = SimulateRequest(rainfall_mm=80.0, area_id="urbanverse-pilot")
    res80 = simulate_flood_risk(req80)
    river = next(z for z in res80.zones if z.zone_id == "UV004")
    comm = next(z for z in res80.zones if z.zone_id == "UV002")
    res_zone = next(z for z in res80.zones if z.zone_id == "UV001")

    assert river.risk_level in ["High", "Critical"]
    assert comm.risk_level in ["Medium", "High"]
    assert res_zone.risk_level == "Low"
    assert "UV004" in res80.affected_zones
    assert len(res80.recommendations) >= 2
    assert res80.simulation_only is True

    print("  [PASS] POST /api/simulate -> Preserved backward compatible contract and flood logic")


def test_hazards_catalog_endpoint():
    """Verify GET /api/hazards returns all 4 multi-hazards with metadata."""
    res = get_hazard_catalog()
    assert isinstance(res, HazardsResponse)
    assert res.count == 4

    hazard_ids = [h.hazard_id for h in res.hazards]
    assert "flood" in hazard_ids
    assert "heatwave" in hazard_ids
    assert "air_pollution" in hazard_ids
    assert "landslide" in hazard_ids

    # Verify landslide is constrained to sloped zones only
    landslide = next(h for h in res.hazards if h.hazard_id == "landslide")
    assert landslide.applicable_zones == ["UV001"]

    print("  [PASS] GET /api/hazards -> 4 hazards catalogued with methodology and applicability")


def test_priorities_endpoint():
    """Verify GET /api/priorities computes P1-P4 tiers and intra-tier sub-priority ranks."""
    res = get_priorities(rainfall_mm=85.0, temperature_c=38.0, aqi=190.0)
    assert isinstance(res, PrioritiesResponse)
    assert res.zone_count == 4
    assert len(res.priorities) == 4

    # Verify valid priority assignment
    for p in res.priorities:
        assert p.priority in ["P1", "P2", "P3", "P4"]
        assert 1 <= p.overall_rank <= 4
        assert p.sub_priority_rank >= 1
        assert p.composite_risk_score >= 0
        assert p.exposure.combined_exposure_score > 0
        assert p.vulnerability.vulnerability_score > 0
        assert p.action_required

    # Sub-priority ranking uniqueness within the same priority
    for tier in ["P1", "P2", "P3", "P4"]:
        sub_ranks = [p.sub_priority_rank for p in res.priorities if p.priority == tier]
        assert len(sub_ranks) == len(set(sub_ranks)), f"Duplicate sub-priority rank in {tier}"

    print("  [PASS] GET /api/priorities -> P1-P4 categorization & sub-priority tie-breaking")


def test_assess_endpoint():
    """Verify POST /api/assess executes multi-hazard evaluation under custom conditions."""
    req = AssessRequest(
        rainfall_mm=95.0,
        temperature_c=39.0,
        aqi=210.0,
        slope_saturation_index=0.75,
        area_id="urbanverse-pilot",
    )
    res = assess_multi_hazard(req)
    assert isinstance(res, AssessResponse)
    assert res.assessment_id.startswith("ASSESS-")
    assert len(res.zone_assessments) == 4
    assert res.data_reliability.confidence_score > 0.7
    assert res.data_reliability.simulation_only is True

    # Under 95mm rainfall + 39°C + 210 AQI, Riverside (UV004) must be P1
    river = next(z for z in res.zone_assessments if z.zone_id == "UV004")
    assert river.priority == "P1"
    assert river.hazards["flood"]["score"] >= 80

    # Landslide hazard must be active on UV001 under high saturation
    res_zone = next(z for z in res.zone_assessments if z.zone_id == "UV001")
    assert res_zone.hazards["landslide"]["is_applicable"] is True
    assert res_zone.hazards["landslide"]["score"] > 50

    print("  [PASS] POST /api/assess -> Multi-hazard assessment with exposure/vulnerability")


def test_zone_assets_endpoint():
    """Verify GET /api/zones/{id}/assets returns critical infrastructure assets."""
    for zid in ["UV001", "UV002", "UV003", "UV004"]:
        res = get_zone_assets(zid)
        assert isinstance(res, ZoneAssetsResponse)
        assert res.zone_id == zid
        assert res.asset_count >= 3
        for a in res.assets:
            assert a.name
            assert a.asset_type
            assert a.criticality in ["Critical", "High", "Moderate"]
            assert a.coordinates.latitude
            assert a.coordinates.longitude

    # Test unknown zone returns 404
    try:
        get_zone_assets("UV999")
        assert False, "Should have raised 404 for unknown zone"
    except HTTPException as e:
        assert e.status_code == 404

    print("  [PASS] GET /api/zones/{id}/assets -> Critical infrastructure asset inventory")


def test_data_sources_endpoint():
    """Verify GET /api/data-sources/status returns metadata and provenance of all data sources."""
    res = get_data_sources_status()
    assert isinstance(res, DataSourcesResponse)
    assert res.source_count >= 5
    for s in res.sources:
        assert s.source_id
        assert s.name
        assert s.category
        assert s.status
        assert s.data_type in ["synthetic", "simulated", "estimated", "observed"]

    print("  [PASS] GET /api/data-sources/status -> Complete provenance & data reliability catalog")


def test_root_endpoint():
    """Verify GET / returns quick navigation links to all API endpoints."""
    res = root()
    assert res["project"] == "UrbanVerse"
    assert "endpoints" in res
    assert "/api/hazards" in res["endpoints"]["hazards"]
    assert "/api/priorities" in res["endpoints"]["priorities"]
    assert "/api/assess" in res["endpoints"]["assess"]
    print("  [PASS] GET / -> Welcome metadata and navigation links")


if __name__ == "__main__":
    print("\n" + "=" * 70)
    print("  URBANVERSE BACKEND & INTEGRATION VERIFICATION SUITE")
    print("=" * 70)
    test_health_endpoint()
    test_zones_endpoint()
    test_simulate_backward_compatibility()
    test_hazards_catalog_endpoint()
    test_priorities_endpoint()
    test_assess_endpoint()
    test_zone_assets_endpoint()
    test_data_sources_endpoint()
    test_root_endpoint()
    print("=" * 70)
    print("  ALL 9 INTEGRATION TESTS PASSED SUCCESSFULLY!")
    print("=" * 70 + "\n")
