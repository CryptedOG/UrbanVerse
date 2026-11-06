/**
 * UrbanVerse Shared API Contract Mock Generator
 * Strictly implements the interface contract defined in 00_Team_Integration_Guide.pdf
 * and expands safely to support multi-hazard assessment (Cyclone, Heatwave, Air Pollution, Landslide).
 */

import { HAZARD_TYPES } from '../data/hazardDefinitions.js';

export function calculateMockSimulation(rainfall_mm, area_id = 'pilot-area-01') {
  const rainfall = Number(rainfall_mm) || 0;

  function calculateZone(zoneId, baseElev, rainWeight, elevWeight) {
    const rainContrib = (rainfall / 100) * rainWeight;
    const elevContrib = Math.max(0, ((25 - baseElev) / 25) * elevWeight);
    const score = Math.min(100, Math.max(0, Math.round(rainContrib + elevContrib)));

    let level = 'Low';
    if (score >= 70) level = 'High';
    else if (score >= 40) level = 'Medium';
    else level = 'Low';

    return { zone_id: zoneId, risk_score: score, risk_level: level };
  }

  // Exact benchmark preserved: 80mm rainfall -> UV004: 92, UV003: 75, UV002: 62, UV001: 35
  const zones = [
    calculateZone('UV001', 24.0, 40, 75), // Score: 35 (Low) at 80mm
    calculateZone('UV002', 18.0, 55, 64), // Score: 62 (Medium) at 80mm
    calculateZone('UV003', 10.0, 60, 45), // Score: 75 (High) at 80mm
    calculateZone('UV004', 4.0,  75, 38)  // Score: 92 (High) at 80mm
  ];

  let affected_zones = zones.filter(z => z.risk_level === 'High').map(z => z.zone_id);
  if (affected_zones.length === 0 && rainfall > 50) {
    affected_zones = zones.filter(z => z.risk_level === 'Medium').map(z => z.zone_id);
  }

  const recommendations = [];
  const maxScore = Math.max(...zones.map(z => z.risk_score));

  if (maxScore >= 75) {
    recommendations.push('Prioritise flood barriers in UV004 Riverside Zone and deploy emergency dewatering pumps.');
    recommendations.push('Inspect stormwater discharge channels in UV003 Industrial Zone to prevent chemical runoff.');
    recommendations.push('Pre-position emergency staging and evacuation shelters in UV001 Residential Zone (24m elevated plateau).');
  } else if (maxScore >= 45) {
    recommendations.push('Alert commercial facilities in UV002 regarding street-level inundation and basement risks.');
    recommendations.push('Clear debris grills along riparian culverts entering UV004 Riverside Zone.');
    recommendations.push('Issue advisory for coastal Mangalore residents regarding potential surface runoff.');
  } else {
    recommendations.push('Normal monsoon readiness: Routine inspection of storm drains and tidal sluice gates.');
    recommendations.push('Maintain automated telemetry monitoring along Netravati and Gurupura river stages.');
  }

  return {
    area_id,
    hazard_type: 'flood',
    rainfall_mm: rainfall,
    intensity_value: rainfall,
    intensity_unit: 'mm',
    zones,
    affected_zones,
    recommendations,
    simulation_only: true
  };
}

/**
 * Multi-Hazard Assessment Engine for Phase 1A local demonstrations
 */
export function calculateHazardAssessment(hazardType = 'flood', paramValue, area_id = 'pilot-area-01') {
  if (hazardType === 'flood') {
    return calculateMockSimulation(paramValue, area_id);
  }

  const val = Number(paramValue) || 0;
  let zones = [];
  let recommendations = [];

  function scoreToLevel(s) {
    if (s >= 70) return 'High';
    if (s >= 40) return 'Medium';
    return 'Low';
  }

  if (hazardType === 'cyclone') {
    // Wind Speed: 0 - 250 km/h
    // UV004 (Waterfront) & UV002 (Commercial high-rise) face greatest wind load
    const calc = (base, sens) => Math.min(100, Math.max(0, Math.round((val / 250) * 100 * sens + base)));
    zones = [
      { zone_id: 'UV001', risk_score: calc(10, 0.72), risk_level: scoreToLevel(calc(10, 0.72)) },
      { zone_id: 'UV002', risk_score: calc(18, 0.88), risk_level: scoreToLevel(calc(18, 0.88)) },
      { zone_id: 'UV003', risk_score: calc(15, 0.82), risk_level: scoreToLevel(calc(15, 0.82)) },
      { zone_id: 'UV004', risk_score: calc(22, 0.95), risk_level: scoreToLevel(calc(22, 0.95)) }
    ];

    if (val >= 130) {
      recommendations.push('Issue mandatory coastal evacuation advisory for UV004 Riverside Zone wharf and fishing terminals.');
      recommendations.push('Halt construction crane operations and secure loose cladding in UV002 Commercial District.');
      recommendations.push('Activate emergency backup generators at UV001 Residential civil defense shelters.');
    } else if (val >= 60) {
      recommendations.push('Pre-position tree-clearing crews and emergency line repair units along UV002 transit corridors.');
      recommendations.push('Advise small craft to remain docked along UV004 riverbanks.');
    } else {
      recommendations.push('Normal coastal weather monitoring: Keep radio watch on regional cyclone advisories.');
    }
  } else if (hazardType === 'heatwave') {
    // Temperature: 30 - 50 °C
    // UV002 (CBD Urban Heat Island) & UV003 (Industrial waste heat) face highest thermal stress
    const tNorm = Math.max(0, (val - 30) / 20); // 0 at 30°C, 1 at 50°C
    const calc = (sens) => Math.min(100, Math.max(0, Math.round(tNorm * 100 * sens)));
    zones = [
      { zone_id: 'UV001', risk_score: calc(0.70), risk_level: scoreToLevel(calc(0.70)) },
      { zone_id: 'UV002', risk_score: calc(0.96), risk_level: scoreToLevel(calc(0.96)) },
      { zone_id: 'UV003', risk_score: calc(0.88), risk_level: scoreToLevel(calc(0.88)) },
      { zone_id: 'UV004', risk_score: calc(0.60), risk_level: scoreToLevel(calc(0.60)) }
    ];

    if (val >= 44) {
      recommendations.push('Severe heat emergency: Open air-conditioned public cooling centers across UV002 Commercial Hub.');
      recommendations.push('Suspend outdoor labor in UV003 Industrial Zone between 11:00 AM and 4:00 PM.');
      recommendations.push('Deploy municipal water misting trucks along dense transit stations in UV002.');
    } else if (val >= 38) {
      recommendations.push('Issue yellow heat alert: Encourage hydration and shade precautions for vulnerable populations in UV001.');
      recommendations.push('Monitor power grid load for peak air conditioning demand in UV002 and UV001.');
    } else {
      recommendations.push('Normal ambient temperatures: Routine monitoring of meteorological heat index.');
    }
  } else if (hazardType === 'air_pollution') {
    // AQI: 0 - 500
    // UV003 (Industrial emission hub) & UV002 (Vehicular congestion) face highest AQI
    const aqiNorm = Math.min(1, val / 500);
    const calc = (sens) => Math.min(100, Math.max(0, Math.round(aqiNorm * 100 * sens)));
    zones = [
      { zone_id: 'UV001', risk_score: calc(0.65), risk_level: scoreToLevel(calc(0.65)) },
      { zone_id: 'UV002', risk_score: calc(0.85), risk_level: scoreToLevel(calc(0.85)) },
      { zone_id: 'UV003', risk_score: calc(0.98), risk_level: scoreToLevel(calc(0.98)) },
      { zone_id: 'UV004', risk_score: calc(0.55), risk_level: scoreToLevel(calc(0.55)) }
    ];

    if (val >= 300) {
      recommendations.push('Severe Air Quality Hazard: Restrict heavy diesel truck movements through UV003 Industrial Zone.');
      recommendations.push('Recommend N95 masks and indoor air filtering for schools and clinics in UV001 Residential.');
      recommendations.push('Enforce temporary production throttling at high-emission smokestack facilities in UV003.');
    } else if (val >= 150) {
      recommendations.push('Unhealthy for Sensitive Groups: Issue advisory for elderly residents and children in UV001.');
      recommendations.push('Increase dust-suppression street washing along UV002 arterial roads.');
    } else {
      recommendations.push('Air quality within acceptable seasonal thresholds: Automated PM2.5 sensors operational.');
    }
  } else if (hazardType === 'landslide') {
    // Soil Moisture: 0 - 100%
    // UV001 (Steep laterite hills at 24m) & UV002 (Sloped commercial ridge at 18m) face highest slip risk
    const sNorm = val / 100;
    const calc = (sens) => Math.min(100, Math.max(0, Math.round(sNorm * 100 * sens)));
    zones = [
      { zone_id: 'UV001', risk_score: calc(0.96), risk_level: scoreToLevel(calc(0.96)) },
      { zone_id: 'UV002', risk_score: calc(0.72), risk_level: scoreToLevel(calc(0.72)) },
      { zone_id: 'UV003', risk_score: calc(0.35), risk_level: scoreToLevel(calc(0.35)) },
      { zone_id: 'UV004', risk_score: calc(0.25), risk_level: scoreToLevel(calc(0.25)) }
    ];

    if (val >= 75) {
      recommendations.push('Critical Landslide Warning: Inspect high-gradient slope retaining walls in UV001 Residential Zone.');
      recommendations.push('Evacuate cliffside settlements and hillslope dwellings in UV001 to UV003 low-gradient shelters.');
      recommendations.push('Close steep hillside access roads connecting UV001 to UV002 Commercial district.');
    } else if (val >= 50) {
      recommendations.push('Elevated pore pressure advisory: Geotechnical inspection of drainage catchments in UV001.');
      recommendations.push('Clear road drainage gullies along UV002 hillside cuttings to prevent slope saturation.');
    } else {
      recommendations.push('Stable hill slopes: Soil moisture within geotechnical shear tolerance.');
    }
  }

  let affected_zones = zones.filter(z => z.risk_level === 'High').map(z => z.zone_id);
  if (affected_zones.length === 0 && zones.some(z => z.risk_level === 'Medium')) {
    affected_zones = zones.filter(z => z.risk_level === 'Medium').map(z => z.zone_id);
  }

  const hazardDef = HAZARD_TYPES[hazardType] || HAZARD_TYPES.flood;

  return {
    area_id,
    hazard_type: hazardType,
    rainfall_mm: hazardType === 'flood' ? val : 80, // Preserve rainfall_mm contract field
    intensity_value: val,
    intensity_unit: hazardDef.unit,
    zones,
    affected_zones,
    recommendations,
    simulation_only: true
  };
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { calculateMockSimulation, calculateHazardAssessment };
}
