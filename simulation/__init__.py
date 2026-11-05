"""
UrbanVerse - Simulation Module
Member 4: Flood Simulation + Risk Logic

This module provides rule-based flood-risk calculations for geographical zones
in the Mangalore pilot digital twin based on rainfall, elevation, water proximity,
and drainage capacity.
"""

from .risk_model import (
    simulate_flood,
    calculate_flood_risk,
    SAMPLE_PILOT_ZONES,
)

__all__ = [
    "simulate_flood",
    "calculate_flood_risk",
    "SAMPLE_PILOT_ZONES",
]
