"""
UrbanVerse - Test Suite for Flood Risk Simulation
Role: Member 4 (Flood Simulation + Risk Logic)

Tests verify:
1. Low rainfall scenario (20 mm).
2. Moderate rainfall scenario (80 mm) matching Team Integration Guide values.
3. Heavy rainfall scenario (160 mm).
4. Zero rainfall edge case.
5. Safe handling of missing geographical parameters.
6. Custom zones passed by Member 1 or Member 3.
7. Strict adherence to the shared API contract.
"""

import unittest
from simulation.risk_model import (
    simulate_flood,
    calculate_flood_risk,
    classify_risk_level,
    compute_zone_susceptibility,
    SAMPLE_PILOT_ZONES,
)


class TestFloodSimulation(unittest.TestCase):

    def test_shared_api_contract_structure(self):
        """Verify the output dictionary strictly matches the shared API contract."""
        res = simulate_flood(rainfall_mm=80.0, area_id="pilot-area-01")

        # 1. Required top-level keys
        self.assertIn("area_id", res)
        self.assertIn("rainfall_mm", res)
        self.assertIn("zones", res)
        self.assertIn("affected_zones", res)
        self.assertIn("recommendations", res)
        self.assertIn("simulation_only", res)

        # 2. Key values and types
        self.assertEqual(res["area_id"], "pilot-area-01")
        self.assertEqual(res["rainfall_mm"], 80.0)
        self.assertIs(res["simulation_only"], True)
        self.assertIsInstance(res["zones"], list)
        self.assertIsInstance(res["affected_zones"], list)
        self.assertIsInstance(res["recommendations"], list)
        self.assertGreater(len(res["recommendations"]), 0)

        # 3. Zone object structure
        for zone in res["zones"]:
            self.assertIn("zone_id", zone)
            self.assertIn("risk_score", zone)
            self.assertIn("risk_level", zone)
            self.assertIsInstance(zone["risk_score"], int)
            self.assertTrue(0 <= zone["risk_score"] <= 100)
            self.assertIn(zone["risk_level"], ["Low", "Medium", "High"])

    def test_moderate_rainfall_contract_example(self):
        """
        Verify that 80 mm rainfall produces exact results matching
        the example in 00_Team_Integration_Guide.pdf:
        zone-a: risk_score 82, High
        zone-b: risk_score 46, Medium
        affected_zones: includes zone-a
        """
        res = simulate_flood(rainfall_mm=80.0)
        zone_map = {z["zone_id"]: z for z in res["zones"]}

        # Check zone-a
        self.assertIn("zone-a", zone_map)
        self.assertEqual(zone_map["zone-a"]["risk_score"], 82)
        self.assertEqual(zone_map["zone-a"]["risk_level"], "High")

        # Check zone-b
        self.assertIn("zone-b", zone_map)
        self.assertEqual(zone_map["zone-b"]["risk_score"], 46)
        self.assertEqual(zone_map["zone-b"]["risk_level"], "Medium")

        # Check affected zones
        self.assertIn("zone-a", res["affected_zones"])

    def test_low_rainfall_scenario(self):
        """Scenario 1: Low simulated rainfall (20 mm)."""
        res = simulate_flood(rainfall_mm=20.0)
        zone_map = {z["zone_id"]: z for z in res["zones"]}

        # Under low rainfall, all zones should have manageable/low risk
        for z in res["zones"]:
            self.assertLess(z["risk_score"], 40, f"Zone {z['zone_id']} exceeded Low threshold under 20mm rain")
            self.assertEqual(z["risk_level"], "Low")

        self.assertEqual(len(res["affected_zones"]), 0)
        self.assertTrue(any("monitoring" in r.lower() or "normal" in r.lower() for r in res["recommendations"]))

    def test_heavy_rainfall_scenario(self):
        """Scenario 3: Heavy simulated rainfall (160 mm)."""
        res = simulate_flood(rainfall_mm=160.0)
        zone_map = {z["zone_id"]: z for z in res["zones"]}

        # Under heavy rainfall, low-lying zones must be High risk
        self.assertEqual(zone_map["zone-a"]["risk_level"], "High")
        self.assertEqual(zone_map["zone-a"]["risk_score"], 100)
        self.assertEqual(zone_map["zone-d"]["risk_level"], "High")

        # Zone-a must be listed under affected zones
        self.assertIn("zone-a", res["affected_zones"])
        self.assertIn("zone-d", res["affected_zones"])

        # Check urgent recommendations
        self.assertTrue(any("pump" in r.lower() or "prioritise" in r.lower() for r in res["recommendations"]))

    def test_rainfall_monotonicity(self):
        """Verify that higher rainfall produces equal or higher risk scores."""
        res_low = simulate_flood(rainfall_mm=20.0)
        res_mod = simulate_flood(rainfall_mm=80.0)
        res_hvy = simulate_flood(rainfall_mm=160.0)

        map_low = {z["zone_id"]: z["risk_score"] for z in res_low["zones"]}
        map_mod = {z["zone_id"]: z["risk_score"] for z in res_mod["zones"]}
        map_hvy = {z["zone_id"]: z["risk_score"] for z in res_hvy["zones"]}

        for zid in map_low:
            self.assertLessEqual(map_low[zid], map_mod[zid])
            self.assertLessEqual(map_mod[zid], map_hvy[zid])

    def test_zero_rainfall(self):
        """Test zero rainfall edge case."""
        res = simulate_flood(rainfall_mm=0.0)
        for z in res["zones"]:
            self.assertEqual(z["risk_score"], 0)
            self.assertEqual(z["risk_level"], "Low")
        self.assertEqual(len(res["affected_zones"]), 0)

    def test_missing_geographical_attributes(self):
        """Verify that zones with missing properties do not crash and use safe defaults."""
        incomplete_zones = [
            {"zone_id": "test-zone-no-elevation", "distance_to_water_m": 200.0},
            {"zone_id": "test-zone-empty"},
        ]
        # Should not raise exception
        res = simulate_flood(rainfall_mm=80.0, zones=incomplete_zones)
        self.assertEqual(len(res["zones"]), 2)
        for z in res["zones"]:
            self.assertTrue(0 <= z["risk_score"] <= 100)
            self.assertIn(z["risk_level"], ["Low", "Medium", "High"])

    def test_custom_zones_from_member3(self):
        """Verify simulation accepts custom zones passed from GIS data."""
        custom_zones = [
            {"zone_id": "mangalore-ward-01", "elevation_m": 5.0, "distance_to_water_m": 100.0, "drainage_capacity": 2.0},
            {"zone_id": "mangalore-ward-02", "elevation_m": 40.0, "distance_to_water_m": 1500.0, "drainage_capacity": 5.0},
        ]
        res = simulate_flood(rainfall_mm=100.0, area_id="mangalore-custom", zones=custom_zones)
        self.assertEqual(res["area_id"], "mangalore-custom")
        self.assertEqual(len(res["zones"]), 2)
        self.assertEqual(res["zones"][0]["zone_id"], "mangalore-ward-01")
        self.assertEqual(res["zones"][1]["zone_id"], "mangalore-ward-02")
        # Ward 1 (low-lying) should have strictly higher risk than Ward 2 (high ridge)
        self.assertGreater(res["zones"][0]["risk_score"], res["zones"][1]["risk_score"])

    def test_function_alias(self):
        """Verify calculate_flood_risk alias works identically to simulate_flood."""
        res1 = simulate_flood(rainfall_mm=50.0)
        res2 = calculate_flood_risk(rainfall_mm=50.0)
        self.assertEqual(res1, res2)


if __name__ == "__main__":
    unittest.main()
