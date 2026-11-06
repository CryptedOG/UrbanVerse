/**
 * UrbanVerse Production Application Bundle
 * Member 2: Frontend + 3D Digital Twin
 * Integrated with data/pilot-area.geojson from origin/gis/data (commit 7bd6305)
 */
(function() {
  'use strict';

  const React = window.React;
  const ReactDOM = window.ReactDOM;

  if (!React || !ReactDOM) {
    console.error('[UrbanVerse] React or ReactDOM missing from global scope.');
    return;
  }

  // ==========================================
  // 1. ACTUAL GIS GEOJSON & PILOT DEFINITIONS
  // ==========================================
  const PILOT_AREA_GEOJSON = {
    "type": "FeatureCollection",
    "name": "UrbanVerse_Pilot_Area_Mangalore_Synthetic",
    "description": "Fictional demonstration map for the UrbanVerse digital twin prototype near Mangalore. Boundaries and properties are synthetic and do not represent actual geographical or municipal features.",
    "bbox": [74.8400, 12.8550, 74.8640, 12.8750],
    "features": [
      {
        "type": "Feature",
        "id": "UV001",
        "bbox": [74.8400, 12.8650, 74.8520, 12.8750],
        "properties": {
          "zone_id": "UV001",
          "zone_name": "Residential Zone",
          "zone_type": "residential",
          "data_type": "synthetic",
          "description": "Fictional residential zone located in the northern inland sector of the Mangalore pilot demonstration area. Boundaries are synthetic demonstration data and do not represent actual geographical features.",
          "pilot_area_id": "pilot-area-01",
          "elevation_m": 24.0
        },
        "geometry": {
          "type": "Polygon",
          "coordinates": [
            [
              [74.8400, 12.8650],
              [74.8520, 12.8650],
              [74.8520, 12.8750],
              [74.8400, 12.8750],
              [74.8400, 12.8650]
            ]
          ]
        }
      },
      {
        "type": "Feature",
        "id": "UV002",
        "bbox": [74.8520, 12.8650, 74.8640, 12.8750],
        "properties": {
          "zone_id": "UV002",
          "zone_name": "Commercial Zone",
          "zone_type": "commercial",
          "data_type": "synthetic",
          "description": "Fictional commercial district located in the northeastern sector of the Mangalore pilot demonstration area. Boundaries are synthetic demonstration data and do not represent actual geographical features.",
          "pilot_area_id": "pilot-area-01",
          "elevation_m": 18.0
        },
        "geometry": {
          "type": "Polygon",
          "coordinates": [
            [
              [74.8520, 12.8650],
              [74.8640, 12.8650],
              [74.8640, 12.8750],
              [74.8520, 12.8750],
              [74.8520, 12.8650]
            ]
          ]
        }
      },
      {
        "type": "Feature",
        "id": "UV003",
        "bbox": [74.8520, 12.8550, 74.8640, 12.8650],
        "properties": {
          "zone_id": "UV003",
          "zone_name": "Industrial Zone",
          "zone_type": "industrial",
          "data_type": "synthetic",
          "description": "Fictional industrial zone located in the southeastern sector of the Mangalore pilot demonstration area. Boundaries are synthetic demonstration data and do not represent actual geographical features.",
          "pilot_area_id": "pilot-area-01",
          "elevation_m": 10.0
        },
        "geometry": {
          "type": "Polygon",
          "coordinates": [
            [
              [74.8520, 12.8550],
              [74.8640, 12.8550],
              [74.8640, 12.8650],
              [74.8520, 12.8650],
              [74.8520, 12.8550]
            ]
          ]
        }
      },
      {
        "type": "Feature",
        "id": "UV004",
        "bbox": [74.8400, 12.8550, 74.8520, 12.8650],
        "properties": {
          "zone_id": "UV004",
          "zone_name": "Riverside Zone",
          "zone_type": "riverside",
          "data_type": "synthetic",
          "description": "Fictional riverside zone located in the southwestern sector of the Mangalore pilot demonstration area adjacent to the synthetic river corridor. Boundaries are synthetic demonstration data and do not represent actual geographical features.",
          "pilot_area_id": "pilot-area-01",
          "elevation_m": 4.0
        },
        "geometry": {
          "type": "Polygon",
          "coordinates": [
            [
              [74.8400, 12.8550],
              [74.8520, 12.8550],
              [74.8520, 12.8650],
              [74.8400, 12.8650],
              [74.8400, 12.8550]
            ]
          ]
        }
      }
    ]
  };

  const PILOT_AREA_METADATA = {
    area_id: 'pilot-area-01',
    name: PILOT_AREA_GEOJSON.name,
    city: 'Mangalore Pilot Demonstration Area, Karnataka, India',
    coordinates: { lat: 12.8650, lng: 74.8520 },
    bbox: PILOT_AREA_GEOJSON.bbox,
    description: PILOT_AREA_GEOJSON.description
  };

  // Convert WGS84 GeoJSON [lng, lat] to 2D SVG canvas (600x420)
  const SVG_MARGIN_X = 80;
  const SVG_MARGIN_Y = 50;
  const SVG_PLOT_W = 440;
  const SVG_PLOT_H = 320;
  const [minLon, minLat, maxLon, maxLat] = PILOT_AREA_METADATA.bbox;

  function projectLngLatToSvg(lng, lat, bounds = [minLon, minLat, maxLon, maxLat]) {
    const [boundsMinLon, boundsMinLat, boundsMaxLon, boundsMaxLat] = bounds;
    const x = SVG_MARGIN_X + ((lng - boundsMinLon) / (boundsMaxLon - boundsMinLon)) * SVG_PLOT_W;
    const y = SVG_MARGIN_Y + ((boundsMaxLat - lat) / (boundsMaxLat - boundsMinLat)) * SVG_PLOT_H;
    return { x: Math.round(x), y: Math.round(y) };
  }

  let MANGALORE_ZONES = PILOT_AREA_GEOJSON.features.map((feature) => {
    const props = feature.properties;
    const coords = feature.geometry.coordinates[0];
    const svgPointPairs = coords.slice(0, -1).map(([lng, lat]) => {
      const pt = projectLngLatToSvg(lng, lat);
      return `${pt.x},${pt.y}`;
    });

    const svg_points = svgPointPairs.join(' ');
    const [fMinLon, fMinLat, fMaxLon, fMaxLat] = feature.bbox;
    const centerPt = projectLngLatToSvg((fMinLon + fMaxLon) / 2, (fMinLat + fMaxLat) / 2);

    let isometric_mesh;
    if (props.zone_id === 'UV001') {
      isometric_mesh = {
        origin: [85, 80],
        width: 135,
        depth: 105,
        elevation_base: Math.round(props.elevation_m * 2.2),
        buildings: [
          { x: 95, y: 90, w: 26, h: 32, d: 24, label: 'Residential Block A' },
          { x: 135, y: 110, w: 32, h: 42, d: 28, label: 'Highland Condos' },
          { x: 175, y: 95, w: 24, h: 28, d: 22, label: 'School & Shelter' }
        ]
      };
    } else if (props.zone_id === 'UV002') {
      isometric_mesh = {
        origin: [240, 80],
        width: 135,
        depth: 105,
        elevation_base: Math.round(props.elevation_m * 2.2),
        buildings: [
          { x: 250, y: 90, w: 34, h: 58, d: 30, label: 'Commerce Tower' },
          { x: 295, y: 105, w: 36, h: 68, d: 34, label: 'Financial Plaza' },
          { x: 335, y: 95, w: 28, h: 48, d: 26, label: 'Transit Hub' }
        ]
      };
    } else if (props.zone_id === 'UV003') {
      isometric_mesh = {
        origin: [240, 205],
        width: 135,
        depth: 105,
        elevation_base: Math.round(props.elevation_m * 2.2),
        buildings: [
          { x: 255, y: 220, w: 38, h: 30, d: 36, label: 'Industrial Logistics' },
          { x: 305, y: 235, w: 42, h: 35, d: 38, label: 'Substation' },
          { x: 270, y: 265, w: 32, h: 26, d: 30, label: 'Warehouses' }
        ]
      };
    } else {
      isometric_mesh = {
        origin: [85, 205],
        width: 135,
        depth: 105,
        elevation_base: Math.round(props.elevation_m * 2.2),
        buildings: [
          { x: 95, y: 215, w: 28, h: 22, d: 24, label: 'Riparian Settlement' },
          { x: 135, y: 240, w: 30, h: 25, d: 28, label: 'Freight Jetty' },
          { x: 175, y: 225, w: 24, h: 20, d: 22, label: 'Drainage Station' }
        ]
      };
    }

    return {
      zone_id: props.zone_id,
      name: props.zone_name,
      type: props.zone_type,
      base_elevation_m: props.elevation_m,
      description: props.description,
      pilot_area_id: props.pilot_area_id,
      bbox: feature.bbox,
      coordinates: coords,
      svg_points,
      center: centerPt,
      isometric_mesh
    };
  });

  const EXPECTED_ZONE_IDS = ['UV001', 'UV002', 'UV003', 'UV004'];

  function getZoneBounds(zones) {
    const coordinates = zones.flatMap((zone) => zone.coordinates);
    const longitudes = coordinates.map((point) => point[0]);
    const latitudes = coordinates.map((point) => point[1]);
    return [
      Math.min(...longitudes),
      Math.min(...latitudes),
      Math.max(...longitudes),
      Math.max(...latitudes)
    ];
  }

  function createZoneCatalog(records) {
    const bounds = getZoneBounds(records);
    if (bounds[0] === bounds[2] || bounds[1] === bounds[3]) {
      throw new Error('GIS zone polygons must cover a non-zero map area');
    }
    return records.map((record) => {
      const template = MANGALORE_ZONES.find((zone) => zone.zone_id === record.zone_id);
      const coords = record.coordinates;
      const [minZoneLon, minZoneLat, maxZoneLon, maxZoneLat] = [
        Math.min(...coords.map((point) => point[0])),
        Math.min(...coords.map((point) => point[1])),
        Math.max(...coords.map((point) => point[0])),
        Math.max(...coords.map((point) => point[1]))
      ];
      return {
        zone_id: record.zone_id,
        name: record.name,
        type: record.type || (template && template.type) || 'unknown',
        base_elevation_m: record.elevation_m,
        description: record.description,
        pilot_area_id: record.pilot_area_id,
        bbox: [minZoneLon, minZoneLat, maxZoneLon, maxZoneLat],
        coordinates: coords,
        svg_points: coords.slice(0, -1).map(([lng, lat]) => {
          const point = projectLngLatToSvg(lng, lat, bounds);
          return `${point.x},${point.y}`;
        }).join(' '),
        center: projectLngLatToSvg(record.center.longitude, record.center.latitude, bounds),
        isometric_mesh: template
          ? {
              ...template.isometric_mesh,
              elevation_base: Math.round(record.elevation_m * 2.2)
            }
          : null
      };
    });
  }

  // ==========================================
  // 2. CONTRACT SIMULATION LOGIC & API CLIENT
  // ==========================================
  const DEFAULT_API_BASE_URL = 'http://127.0.0.1:8000';

  function calculateMockSimulation(rainfall_mm, area_id = 'pilot-area-01') {
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

    const zones = [
      calculateZone('UV001', 24.0, 40, 75),
      calculateZone('UV002', 18.0, 55, 64),
      calculateZone('UV003', 10.0, 60, 45),
      calculateZone('UV004', 4.0,  75, 38)
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
      rainfall_mm: rainfall,
      zones,
      affected_zones,
      recommendations,
      simulation_only: true
    };
  }

  function validateZoneRecords(zones, expectedCount) {
    if (!Array.isArray(zones) || zones.length !== expectedCount) {
      throw new Error(`Expected ${expectedCount} GIS zones`);
    }
    const ids = zones.map((zone) => zone && zone.zone_id);
    if (new Set(ids).size !== ids.length || EXPECTED_ZONE_IDS.some((id) => !ids.includes(id))) {
      throw new Error('Zones must contain the stable IDs UV001, UV002, UV003, and UV004 exactly once');
    }
    return true;
  }

  function validateZonesResponse(data) {
    if (!data || typeof data !== 'object' || Array.isArray(data)) throw new Error('Zones response must be an object');
    if (typeof data.area_id !== 'string' || !Number.isInteger(data.count)) {
      throw new Error('Zones response must include area_id and count');
    }
    validateZoneRecords(data.zones, data.count);
    for (const zone of data.zones) {
      if (
        typeof zone.name !== 'string' ||
        typeof zone.description !== 'string' ||
        typeof zone.elevation_m !== 'number' ||
        !Number.isFinite(zone.elevation_m) ||
        !zone.center ||
        typeof zone.center.latitude !== 'number' ||
        !Number.isFinite(zone.center.latitude) ||
        typeof zone.center.longitude !== 'number' ||
        !Number.isFinite(zone.center.longitude) ||
        !Array.isArray(zone.polygon) ||
        zone.polygon.length < 4 ||
        zone.polygon.some((point) =>
          !Array.isArray(point) ||
          point.length < 2 ||
          !Number.isFinite(point[0]) ||
          !Number.isFinite(point[1])
        )
      ) {
        throw new Error(`Invalid GIS properties for zone ${zone.zone_id}`);
      }
    }
    return true;
  }

  function backendZoneRecords(data) {
    return data.zones.map((zone) => ({
      zone_id: zone.zone_id,
      name: zone.name,
      type: zone.zone_type || 'unknown',
      description: zone.description,
      elevation_m: zone.elevation_m,
      pilot_area_id: data.area_id,
      center: { latitude: zone.center.latitude, longitude: zone.center.longitude },
      coordinates: zone.polygon
    }));
  }

  function validateGeoJSON(data) {
    if (!data || data.type !== 'FeatureCollection' || !Array.isArray(data.features)) {
      throw new Error('GeoJSON fallback must be a FeatureCollection');
    }
    validateZoneRecords(
      data.features.map((feature) => feature && feature.properties),
      EXPECTED_ZONE_IDS.length
    );
    for (const feature of data.features) {
      const properties = feature.properties;
      const ring = feature.geometry && feature.geometry.type === 'Polygon' &&
        feature.geometry.coordinates && feature.geometry.coordinates[0];
      if (
        typeof properties.zone_name !== 'string' ||
        typeof properties.zone_type !== 'string' ||
        typeof properties.description !== 'string' ||
        typeof properties.pilot_area_id !== 'string' ||
        typeof properties.elevation_m !== 'number' ||
        !Number.isFinite(properties.elevation_m) ||
        !Array.isArray(ring) ||
        ring.length < 4 ||
        ring.some((point) =>
          !Array.isArray(point) ||
          point.length < 2 ||
          !Number.isFinite(point[0]) ||
          !Number.isFinite(point[1])
        )
      ) {
        throw new Error(`Invalid GeoJSON feature for zone ${properties.zone_id}`);
      }
    }
    return true;
  }

  function geoJSONZoneRecords(data) {
    return data.features.map((feature) => {
      const properties = feature.properties;
      const coordinates = feature.geometry.coordinates[0];
      const longitudes = coordinates.map((point) => point[0]);
      const latitudes = coordinates.map((point) => point[1]);
      return {
        zone_id: properties.zone_id,
        name: properties.zone_name,
        type: properties.zone_type,
        description: properties.description,
        elevation_m: properties.elevation_m,
        pilot_area_id: properties.pilot_area_id,
        center: {
          longitude: (Math.min(...longitudes) + Math.max(...longitudes)) / 2,
          latitude: (Math.min(...latitudes) + Math.max(...latitudes)) / 2
        },
        coordinates
      };
    });
  }

  async function fetchBackendZones(baseUrl = DEFAULT_API_BASE_URL, fetcher = fetch) {
    let timeoutId;
    try {
      const controller = new AbortController();
      timeoutId = setTimeout(() => controller.abort(), 2000);
      const res = await fetcher(`${baseUrl}/api/zones`, {
        method: 'GET',
        headers: { 'Accept': 'application/json' },
        signal: controller.signal
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      validateZonesResponse(data);
      return { connected: true, data, source: 'live_backend', error: null };
    } catch (err) {
      return { connected: false, data: null, source: 'geojson_fallback', error: err.message || 'Invalid zones response' };
    } finally {
      if (timeoutId) clearTimeout(timeoutId);
    }
  }

  async function loadZoneData(baseUrl = DEFAULT_API_BASE_URL, fetcher = fetch) {
    const backendResult = await fetchBackendZones(baseUrl, fetcher);
    if (backendResult.connected) {
      return {
        zones: createZoneCatalog(backendZoneRecords(backendResult.data)),
        area_id: backendResult.data.area_id,
        source: 'live_backend',
        error: null
      };
    }

    try {
      const response = await fetcher('data/pilot-area.geojson', {
        method: 'GET',
        headers: { 'Accept': 'application/geo+json, application/json' }
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const geoJSON = await response.json();
      validateGeoJSON(geoJSON);
      return {
        zones: createZoneCatalog(geoJSONZoneRecords(geoJSON)),
        area_id: geoJSON.features[0].properties.pilot_area_id || PILOT_AREA_METADATA.area_id,
        source: 'geojson_fallback',
        error: backendResult.error
      };
    } catch (err) {
      return {
        zones: MANGALORE_ZONES,
        area_id: PILOT_AREA_METADATA.area_id,
        source: 'embedded_fallback',
        error: `${backendResult.error}; GeoJSON fallback unavailable: ${err.message || 'invalid GeoJSON'}`
      };
    }
  }

  function validateContractResponse(data) {
    if (!data || typeof data !== 'object' || Array.isArray(data)) throw new Error('Response must be an object');
    if (typeof data.area_id !== 'string') throw new Error('Contract violation: area_id must be a string');
    if (typeof data.rainfall_mm !== 'number') throw new Error('Contract violation: rainfall_mm must be a number');
    if (!Array.isArray(data.zones) || data.zones.length !== EXPECTED_ZONE_IDS.length) throw new Error('Contract violation: zones must contain all four pilot zones');
    const zoneIds = data.zones.map((zone) => zone && zone.zone_id);
    if (new Set(zoneIds).size !== zoneIds.length || EXPECTED_ZONE_IDS.some((id) => !zoneIds.includes(id))) {
      throw new Error('Contract violation: zones must contain UV001 through UV004 exactly once');
    }
    for (const z of data.zones) {
      if (!z.zone_id || typeof z.zone_id !== 'string') throw new Error('Invalid zone_id');
      if (typeof z.risk_score !== 'number' || z.risk_score < 0 || z.risk_score > 100) throw new Error('Invalid risk_score');
      if (!['Low', 'Medium', 'High', 'Critical'].includes(z.risk_level)) throw new Error('Invalid risk_level');
      if (z.explanation !== undefined && typeof z.explanation !== 'string') throw new Error('Invalid zone explanation');
    }
    if (!Array.isArray(data.affected_zones)) throw new Error('Contract violation: affected_zones must be an array');
    if (!Array.isArray(data.recommendations)) throw new Error('Contract violation: recommendations must be an array');
    if (typeof data.simulation_only !== 'boolean') throw new Error('Contract violation: simulation_only must be a boolean');
    if (data.disclaimer !== undefined && typeof data.disclaimer !== 'string') throw new Error('Invalid simulation disclaimer');
    return true;
  }

  function validatePriorityResponse(data) {
    if (!data || typeof data !== 'object' || Array.isArray(data) || typeof data.area_id !== 'string') {
      throw new Error('Priorities response must contain an area_id');
    }
    if (
      data.zone_count !== EXPECTED_ZONE_IDS.length ||
      !Array.isArray(data.priorities) ||
      data.priorities.length !== EXPECTED_ZONE_IDS.length
    ) {
      throw new Error('Priorities response must contain zone_count matching its priorities');
    }
    const ids = data.priorities.map((zone) => zone && zone.zone_id);
    if (new Set(ids).size !== ids.length || EXPECTED_ZONE_IDS.some((id) => !ids.includes(id))) {
      throw new Error('Priorities must contain UV001 through UV004 exactly once');
    }
    for (const zone of data.priorities) {
      if (
        typeof zone.zone_name !== 'string' ||
        !['P1', 'P2', 'P3', 'P4'].includes(zone.priority) ||
        typeof zone.priority_label !== 'string' ||
        !Number.isFinite(zone.composite_risk_score) ||
        zone.composite_risk_score < 0 ||
        zone.composite_risk_score > 100 ||
        typeof zone.primary_hazard !== 'string' ||
        typeof zone.primary_hazard_id !== 'string' ||
        !zone.hazards ||
        typeof zone.hazards !== 'object' ||
        typeof zone.action_required !== 'string'
      ) {
        throw new Error(`Invalid priority data for zone ${zone.zone_id}`);
      }
    }
    if (typeof data.simulation_only !== 'boolean') throw new Error('Priorities response must identify simulation_only');
    if (data.disclaimer !== undefined && typeof data.disclaimer !== 'string') throw new Error('Invalid priorities disclaimer');
    return true;
  }

  function validateAssessmentResponse(data, hazardType) {
    if (!data || typeof data !== 'object' || Array.isArray(data) || typeof data.area_id !== 'string') {
      throw new Error('Assessment response must contain an area_id');
    }
    if (!Array.isArray(data.zone_assessments) || data.zone_assessments.length !== EXPECTED_ZONE_IDS.length) {
      throw new Error('Assessment response must contain all four zone assessments');
    }
    const ids = data.zone_assessments.map((zone) => zone && zone.zone_id);
    if (new Set(ids).size !== ids.length || EXPECTED_ZONE_IDS.some((id) => !ids.includes(id))) {
      throw new Error('Assessment must contain UV001 through UV004 exactly once');
    }
    if (!data.data_reliability || typeof data.data_reliability.simulation_only !== 'boolean') {
      throw new Error('Assessment response must include data reliability and simulation status');
    }
    if (data.data_reliability.disclaimer !== undefined && typeof data.data_reliability.disclaimer !== 'string') {
      throw new Error('Invalid assessment disclaimer');
    }
    for (const zone of data.zone_assessments) {
      if (
        typeof zone.zone_name !== 'string' ||
        !['P1', 'P2', 'P3', 'P4'].includes(zone.priority) ||
        !Number.isFinite(zone.composite_risk_score) ||
        zone.composite_risk_score < 0 ||
        zone.composite_risk_score > 100 ||
        !zone.hazards ||
        typeof zone.hazards !== 'object' ||
        typeof zone.action_required !== 'string'
      ) {
        throw new Error(`Invalid assessment data for zone ${zone.zone_id}`);
      }
      const hazard = zone.hazards[hazardType];
      if (
        !hazard ||
        !Number.isFinite(hazard.score) ||
        hazard.score < 0 ||
        hazard.score > 100 ||
        typeof hazard.level !== 'string' ||
        (hazard.explanation !== undefined && typeof hazard.explanation !== 'string')
      ) {
        throw new Error(`Missing or invalid ${hazardType} assessment for zone ${zone.zone_id}`);
      }
    }
    return true;
  }

  function validateZoneAssetsResponse(data, zoneId) {
    if (!data || typeof data !== 'object' || Array.isArray(data) || data.zone_id !== zoneId) {
      throw new Error(`Assets response does not match selected zone ${zoneId}`);
    }
    if (typeof data.zone_name !== 'string' || !Number.isInteger(data.asset_count) ||
        !Array.isArray(data.assets) || data.asset_count !== data.assets.length) {
      throw new Error('Assets response count does not match its asset list');
    }
    for (const asset of data.assets) {
      if (
        typeof asset.asset_id !== 'string' ||
        typeof asset.name !== 'string' ||
        typeof asset.asset_type !== 'string' ||
        typeof asset.criticality !== 'string' ||
        typeof asset.status !== 'string' ||
        !asset.coordinates ||
        !Number.isFinite(asset.coordinates.latitude) ||
        !Number.isFinite(asset.coordinates.longitude)
      ) {
        throw new Error(`Invalid asset record for zone ${zoneId}`);
      }
    }
    return true;
  }

  function buildAssessmentPayload(hazardValues, area_id) {
    return {
      rainfall_mm: Number(hazardValues.flood),
      temperature_c: Number(hazardValues.heatwave),
      aqi: Number(hazardValues.air_pollution),
      slope_saturation_index: Number(hazardValues.landslide) / 100,
      area_id: String(area_id)
    };
  }

  function normalizeAssessmentResponse(data, hazardType) {
    const zones = data.zone_assessments.map((zone) => {
      const hazard = zone.hazards[hazardType];
      return {
        zone_id: zone.zone_id,
        risk_score: hazard.score,
        risk_level: hazard.level,
        explanation: hazard.explanation,
        is_applicable: hazard.is_applicable !== false
      };
    });
    return {
      area_id: data.area_id,
      zones,
      recommendations: data.zone_assessments.map((zone) => `${zone.zone_name}: ${zone.action_required}`),
      assessment: data,
      simulation_only: Boolean(data.data_reliability.simulation_only),
      disclaimer: data.data_reliability.disclaimer || 'Simulation only; not a live emergency warning.'
    };
  }

  async function fetchPriorities(inputs, options = {}) {
    const { baseUrl = DEFAULT_API_BASE_URL, fetcher = fetch } = options;
    const query = `rainfall_mm=${encodeURIComponent(String(Number(inputs.flood)))}`;
    let timeoutId;
    try {
      const controller = new AbortController();
      timeoutId = setTimeout(() => controller.abort(), 2500);
      const response = await fetcher(`${baseUrl}/api/priorities?${query}`, {
        method: 'GET',
        headers: { 'Accept': 'application/json' },
        signal: controller.signal
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = await response.json();
      validatePriorityResponse(data);
      return { data, source: 'live_backend', error: null };
    } catch (err) {
      return { data: null, source: 'unavailable', error: err.message || 'Priorities request failed' };
    } finally {
      if (timeoutId) clearTimeout(timeoutId);
    }
  }

  async function fetchZoneAssets(zoneId, options = {}) {
    const { baseUrl = DEFAULT_API_BASE_URL, fetcher = fetch } = options;
    let timeoutId;
    try {
      const controller = new AbortController();
      timeoutId = setTimeout(() => controller.abort(), 2500);
      const response = await fetcher(`${baseUrl}/api/zones/${encodeURIComponent(zoneId)}/assets`, {
        method: 'GET',
        headers: { 'Accept': 'application/json' },
        signal: controller.signal
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = await response.json();
      validateZoneAssetsResponse(data, zoneId);
      return { data, status: data.assets.length ? 'loaded' : 'empty', error: null };
    } catch (err) {
      return { data: null, status: 'error', error: err.message || 'Assets request failed' };
    } finally {
      if (timeoutId) clearTimeout(timeoutId);
    }
  }

  async function checkBackendHealth(baseUrl = DEFAULT_API_BASE_URL) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 1500);
      const res = await fetch(`${baseUrl}/api/health`, {
        method: 'GET',
        headers: { 'Accept': 'application/json' },
        signal: controller.signal
      });
      clearTimeout(timeoutId);
      if (res.ok) {
        const data = await res.json().catch(() => ({ status: 'ok' }));
        return { connected: true, data, error: null };
      }
      return { connected: false, data: null, error: `HTTP ${res.status}` };
    } catch (err) {
      return { connected: false, data: null, error: 'FastAPI server not detected on port 8000' };
    }
  }

  async function simulateFloodRisk(rainfall_mm, area_id = 'pilot-area-01', options = {}) {
    const { baseUrl = DEFAULT_API_BASE_URL, forceMock = false } = options;
    const requestPayload = { rainfall_mm: Number(rainfall_mm) };

    if (forceMock) {
      const mock = calculateMockSimulation(requestPayload.rainfall_mm, area_id);
      return { data: mock, source: 'mock', note: 'Local mock simulation (preview mode)' };
    }

    let timeoutId;
    try {
      const controller = new AbortController();
      timeoutId = setTimeout(() => controller.abort(), 2500);
      const res = await fetch(`${baseUrl}/api/simulate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify(requestPayload),
        signal: controller.signal
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      validateContractResponse(json);
      return { data: json, source: 'live_backend', note: 'FastAPI Backend (/api/simulate)' };
    } catch (err) {
      const mockFallback = calculateMockSimulation(requestPayload.rainfall_mm, area_id);
      return {
        data: mockFallback,
        source: 'mock_fallback',
        warning: `Backend unavailable (${err.message}). Showing contract mock.`,
        note: 'Contract Mock Fallback'
      };
    } finally {
      if (timeoutId) clearTimeout(timeoutId);
    }
  }

  // Multi-Hazard Definitions (Phase 1A: Flood, Cyclone, Heatwave, Air Pollution, Landslide)
  const HAZARD_TYPES = {
    flood: {
      id: 'flood',
      name: 'Flood Inundation',
      shortName: 'Flood',
      icon: '🌊',
      color: '#38bdf8',
      unit: 'mm',
      paramName: '24-Hour Precipitation',
      min: 0,
      max: 300,
      step: 5,
      defaultValue: 80,
      scaleLabels: ['0 mm (Dry)', '75 mm', '150 mm', '225 mm', '300 mm (Flood Surge)'],
      presets: [
        { label: 'Light', mm: 25, value: 25, desc: 'Drizzle' },
        { label: 'Benchmark', mm: 80, value: 80, desc: 'Contract Test' },
        { label: 'Heavy', mm: 150, value: 150, desc: 'Monsoon Surge' },
        { label: 'Extreme', mm: 240, value: 240, desc: 'Severe Hazard' }
      ]
    },
    cyclone: {
      id: 'cyclone',
      name: 'Tropical Cyclone',
      shortName: 'Cyclone',
      icon: '🌀',
      color: '#818cf8',
      unit: 'km/h',
      paramName: 'Sustained Wind Speed',
      min: 0,
      max: 250,
      step: 5,
      defaultValue: 120,
      scaleLabels: ['0 km/h (Calm)', '60 km/h (Depression)', '120 km/h (Cat 1)', '180 km/h (Severe)', '250 km/h (Super)'],
      presets: [
        { label: 'Depression', value: 55, desc: 'Gale Winds' },
        { label: 'Cyclonic Storm', value: 90, desc: 'Structural Hazard' },
        { label: 'Severe Cyclone', value: 135, desc: 'Roof/Tree Damage' },
        { label: 'Super Cyclone', value: 220, desc: 'Catastrophic' }
      ]
    },
    heatwave: {
      id: 'heatwave',
      name: 'Urban Heat Island',
      shortName: 'Heatwave',
      icon: '☀️',
      color: '#fb923c',
      unit: '°C',
      paramName: 'Peak Surface Temperature',
      min: 30,
      max: 50,
      step: 1,
      defaultValue: 42,
      scaleLabels: ['30°C (Normal)', '35°C (Warm)', '40°C (Advisory)', '45°C (Severe)', '50°C (Extreme)'],
      presets: [
        { label: 'Baseline', value: 33, desc: 'Normal Summer' },
        { label: 'Advisory', value: 39, desc: 'Caution Required' },
        { label: 'Severe Alert', value: 44, desc: 'Heatstroke Risk' },
        { label: 'Emergency', value: 48, desc: 'Critical Outage' }
      ]
    },
    air_pollution: {
      id: 'air_pollution',
      name: 'Air Pollution Index',
      shortName: 'Air Quality',
      icon: '🌫️',
      color: '#cbd5e1',
      unit: 'AQI',
      paramName: 'Air Quality Index (PM2.5 / PM10)',
      min: 0,
      max: 500,
      step: 10,
      defaultValue: 180,
      scaleLabels: ['0 (Good)', '100 (Moderate)', '200 (Poor)', '300 (Very Poor)', '500 (Severe)'],
      presets: [
        { label: 'Good', value: 45, desc: 'Satisfactory' },
        { label: 'Moderate', value: 120, desc: 'Sensitive Group' },
        { label: 'Poor', value: 230, desc: 'Unhealthy' },
        { label: 'Severe Hazard', value: 410, desc: 'Emergency Level' }
      ]
    },
    landslide: {
      id: 'landslide',
      name: 'Landslide Susceptibility',
      shortName: 'Landslide',
      icon: '⛰️',
      color: '#f472b6',
      unit: '%',
      paramName: 'Soil Moisture Saturation',
      min: 0,
      max: 100,
      step: 5,
      defaultValue: 70,
      scaleLabels: ['0% (Dry Soil)', '25%', '50% (Saturated)', '75% (Unstable)', '100% (Liquefaction)'],
      presets: [
        { label: 'Low Moisture', value: 25, desc: 'Stable' },
        { label: 'High Moisture', value: 55, desc: 'Saturation Warning' },
        { label: 'Critical Saturation', value: 75, desc: 'Slope Failure' },
        { label: 'Liquefaction', value: 95, desc: 'Catastrophic' }
      ]
    }
  };

  const HAZARD_LIST = Object.values(HAZARD_TYPES);

  function calculateHazardAssessment(hazardType = 'flood', paramValue, area_id = 'pilot-area-01') {
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
      const tNorm = Math.max(0, (val - 30) / 20);
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
      rainfall_mm: hazardType === 'flood' ? val : 80,
      intensity_value: val,
      intensity_unit: hazardDef.unit,
      zones,
      affected_zones,
      recommendations,
      simulation_only: true
    };
  }

  async function assessHazard(hazardType = 'flood', paramValue, area_id = 'pilot-area-01', hazardValues = {}, options = {}) {
    const { baseUrl = DEFAULT_API_BASE_URL, forceMock = false } = options;

    if (hazardType === 'flood') {
      return simulateFloodRisk(paramValue, area_id, options);
    }

    if (hazardType === 'cyclone') {
      const demoResult = calculateHazardAssessment(hazardType, paramValue, area_id);
      return {
        data: demoResult,
        source: 'local_demo',
        note: 'Cyclone is a frontend-only demonstration; no backend cyclone model is available.'
      };
    }

    if (!['heatwave', 'air_pollution', 'landslide'].includes(hazardType)) {
      throw new Error(`Unsupported backend assessment hazard: ${hazardType}`);
    }

    const payload = buildAssessmentPayload(hazardValues, area_id);
    if (forceMock) {
      return {
        data: calculateHazardAssessment(hazardType, paramValue, area_id),
        source: 'local_demo',
        note: `Local ${hazardType} demonstration model (forced preview mode).`
      };
    }

    let timeoutId;
    try {
      const controller = new AbortController();
      timeoutId = setTimeout(() => controller.abort(), 2500);
      const response = await fetch(`${baseUrl}/api/assess`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify(payload),
        signal: controller.signal
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = await response.json();
      validateAssessmentResponse(data, hazardType);
      return {
        data: normalizeAssessmentResponse(data, hazardType),
        source: 'live_backend',
        note: 'Backend multi-hazard assessment (simulation only).'
      };
    } catch (err) {
      const demoResult = calculateHazardAssessment(hazardType, paramValue, area_id);
      return {
        data: demoResult,
        source: 'local_demo_fallback',
        warning: `Backend assessment unavailable (${err.message || 'invalid response'}). Showing local demonstration results.`,
        note: `Local ${hazardType} demonstration fallback (not a backend assessment).`
      };
    } finally {
      if (timeoutId) clearTimeout(timeoutId);
    }
  }

  // ==========================================
  // 3. REACT COMPONENTS
  // ==========================================

  // --- Header ---
  function Header({ backendStatus, onRefreshHealth, isMockMode, onToggleMockMode }) {
    const isConnected = backendStatus && backendStatus.connected;

    return React.createElement(
      'header',
      { className: 'uv-header' },
      React.createElement(
        'div',
        { className: 'uv-header-main' },
        React.createElement(
          'div',
          { className: 'uv-brand' },
          React.createElement('div', { className: 'uv-logo-badge' }, 'UV'),
          React.createElement(
            'div',
            null,
            React.createElement('h1', { className: 'uv-title' }, 'UrbanVerse'),
            React.createElement('p', { className: 'uv-subtitle' }, 'Urban Resilience Digital Twin • GIS Layer: pilot-area.geojson')
          )
        ),
        React.createElement(
          'div',
          { className: 'uv-status-group' },
          React.createElement(
            'div',
            {
              className: `uv-health-pill ${isConnected ? 'uv-health-online' : 'uv-health-offline'}`,
              title: backendStatus ? backendStatus.error || 'Connected' : ''
            },
            React.createElement('span', { className: 'uv-pulse-dot' }),
            React.createElement('span', null, isConnected ? 'FastAPI Connected (8000)' : 'Backend Offline (Mock Active)')
          ),
          React.createElement(
            'button',
            { className: 'uv-btn-subtle', onClick: onRefreshHealth, title: 'Recheck connection' },
            '↻ Recheck'
          ),
          React.createElement(
            'button',
            {
              className: `uv-mode-toggle ${isMockMode ? 'uv-mode-active' : ''}`,
              onClick: onToggleMockMode
            },
            isMockMode ? 'Forced Mock' : 'Live / Auto'
          )
        )
      ),
      React.createElement(
        'div',
        { className: 'uv-disclaimer-banner' },
        React.createElement('span', { className: 'uv-warning-icon' }, '⚠️'),
        React.createElement('strong', null, 'Simulation only; not a live emergency warning.'),
        React.createElement('span', { className: 'uv-disclaimer-sub' }, ' All values and boundaries are synthetic demonstration data.')
      )
    );
  }

  // --- Controls ---
  function Controls({
    activeHazard = 'flood',
    onHazardChange,
    currentValue,
    onValueChange,
    rainfall,
    onRainfallChange,
    onRunSimulation,
    loading,
    viewMode,
    onViewModeChange,
    lastRunValue,
    lastRunRainfall
  }) {
    const hazardDef = HAZARD_TYPES[activeHazard] || HAZARD_TYPES.flood;
    const resolvedValue = currentValue !== undefined ? currentValue : (rainfall !== undefined ? rainfall : hazardDef.defaultValue);
    const handleValChange = onValueChange || onRainfallChange;
    const benchmarkRun = lastRunValue !== undefined ? lastRunValue : lastRunRainfall;
    const hasChanged = benchmarkRun !== null && benchmarkRun !== undefined && benchmarkRun !== resolvedValue;

    const presets = hazardDef.presets || [
      { label: 'Light', mm: 25, value: 25 },
      { label: 'Benchmark', mm: 80, value: 80 },
      { label: 'Heavy', mm: 150, value: 150 },
      { label: 'Extreme', mm: 240, value: 240 }
    ];

    return React.createElement(
      'section',
      { className: 'uv-card uv-controls-card' },
      React.createElement(
        'div',
        { className: 'uv-controls-header' },
        React.createElement(
          'div',
          null,
          React.createElement('h2', { className: 'uv-card-title' }, 'Simulation Control Center'),
          React.createElement('p', { className: 'uv-card-desc' }, 'Select an environmental hazard vector and adjust simulation parameters')
        ),
        React.createElement(
          'div',
          { className: 'uv-view-toggle-group' },
          React.createElement(
            'button',
            {
              className: `uv-toggle-btn ${viewMode === '2d' ? 'uv-toggle-active' : ''}`,
              onClick: () => onViewModeChange('2d')
            },
            '🗺️ 2D GIS Map'
          ),
          React.createElement(
            'button',
            {
              className: `uv-toggle-btn ${viewMode === '3d' ? 'uv-toggle-active' : ''}`,
              onClick: () => onViewModeChange('3d')
            },
            '🏙️ 3D Digital Twin'
          )
        )
      ),

      // Multi-Hazard Selection Vector Tabs
      React.createElement(
        'div',
        { className: 'uv-hazard-nav' },
        React.createElement('span', { className: 'uv-hazard-nav-label' }, 'Hazard Vector:'),
        React.createElement(
          'div',
          { className: 'uv-hazard-tabs', role: 'tablist' },
          HAZARD_LIST.map((h) => {
            const isActive = activeHazard === h.id;
            return React.createElement(
              'button',
              {
                key: h.id,
                role: 'tab',
                'aria-selected': isActive,
                className: `uv-hazard-tab ${isActive ? 'uv-hazard-tab-active' : ''}`,
                style: isActive ? { borderColor: h.color, boxShadow: `0 0 12px ${h.color}33` } : {},
                onClick: () => onHazardChange && onHazardChange(h.id)
              },
              React.createElement('span', { className: 'uv-hazard-icon' }, h.icon),
              React.createElement('span', { className: 'uv-hazard-title' }, h.shortName)
            );
          })
        )
      ),

      // Hazard-Specific Dynamic Input Controls
      React.createElement(
        'div',
        { className: 'uv-slider-section', style: { borderLeft: `3px solid ${hazardDef.color}` } },
        React.createElement(
          'div',
          { className: 'uv-slider-label-row' },
          React.createElement(
            'div',
            { className: 'uv-param-label-col' },
            React.createElement('span', { className: 'uv-slider-title' }, `Simulated ${hazardDef.paramName}:`),
            React.createElement(
              'span',
              { className: 'uv-hazard-badge-inline', style: { color: hazardDef.color } },
              `${hazardDef.icon} ${hazardDef.name}`
            )
          ),
          React.createElement(
            'div',
            { className: 'uv-rainfall-metric' },
            React.createElement('span', { className: 'uv-rainfall-value', style: { color: hazardDef.color } }, resolvedValue),
            React.createElement('span', { className: 'uv-rainfall-unit' }, hazardDef.unit)
          )
        ),
        React.createElement('input', {
          type: 'range',
          min: String(hazardDef.min),
          max: String(hazardDef.max),
          step: String(hazardDef.step),
          value: resolvedValue,
          className: 'uv-slider',
          style: { accentColor: hazardDef.color },
          onChange: (e) => handleValChange(Number(e.target.value))
        }),
        React.createElement(
          'div',
          { className: 'uv-slider-scale' },
          hazardDef.scaleLabels.map((lbl, idx) => React.createElement('span', { key: idx }, lbl))
        ),
        React.createElement(
          'div',
          { className: 'uv-presets-row' },
          presets.map((p) => {
            const pVal = p.value !== undefined ? p.value : p.mm;
            const isSelected = resolvedValue === pVal;
            return React.createElement(
              'button',
              {
                key: p.label,
                className: `uv-preset-btn ${isSelected ? 'uv-preset-selected' : ''}`,
                onClick: () => handleValChange(pVal)
              },
              React.createElement('span', { className: 'uv-preset-mm' }, `${pVal} ${hazardDef.unit}`),
              React.createElement('span', { className: 'uv-preset-tag' }, p.label)
            );
          })
        )
      ),

      React.createElement(
        'div',
        { className: 'uv-action-bar' },
        React.createElement(
          'button',
          {
            className: `uv-btn-primary uv-btn-simulate ${loading ? 'uv-loading' : ''}`,
            onClick: onRunSimulation,
            disabled: loading
          },
          loading
            ? React.createElement(
                'span',
                { className: 'uv-btn-content' },
                React.createElement('span', { className: 'uv-spinner' }),
                `Calculating ${hazardDef.shortName} Risk...`
              )
            : React.createElement(
                'span',
                { className: 'uv-btn-content' },
                activeHazard === 'flood'
                  ? '⚡ Run Flood Simulation (POST /api/simulate)'
                  : `⚡ Run ${hazardDef.shortName} Assessment`
              )
        ),
        hasChanged &&
          React.createElement(
            'span',
            { className: 'uv-pending-notice' },
            `● ${hazardDef.shortName} value altered (${resolvedValue} ${hazardDef.unit}). Click button to recompute.`
          )
      )
    );
  }

  // --- 2D GIS Map ---
  function Map2D({ simulationResult, selectedZoneId, onSelectZone, rainfall, zones = MANGALORE_ZONES }) {
    const zoneResults = (simulationResult && simulationResult.zones) || [];
    const affectedZoneIds = (simulationResult && simulationResult.affected_zones) || [];

    function getZoneStatus(zoneId) {
      let found = zoneResults.find((z) => z.zone_id === zoneId);
      if (!found) {
        const aliasMap = { 'UV004': 'zone-a', 'UV003': 'zone-b', 'UV002': 'zone-c', 'UV001': 'zone-d' };
        if (aliasMap[zoneId]) found = zoneResults.find((z) => z.zone_id === aliasMap[zoneId]);
      }
      if (!found) return { score: '--', level: 'Pending', color: '#64748b', fill: 'rgba(100, 116, 139, 0.25)' };
      if (found.risk_level === 'High' || found.risk_level === 'Critical') return { score: found.risk_score, level: found.risk_level, color: '#ef4444', fill: 'rgba(239, 68, 68, 0.65)' };
      if (found.risk_level === 'Medium') return { score: found.risk_score, level: 'Medium', color: '#f59e0b', fill: 'rgba(245, 158, 11, 0.60)' };
      return { score: found.risk_score, level: 'Low', color: '#10b981', fill: 'rgba(16, 185, 129, 0.55)' };
    }

    function isZoneAffected(zoneId) {
      if (affectedZoneIds.includes(zoneId)) return true;
      const aliasMap = { 'UV004': 'zone-a', 'UV003': 'zone-b', 'UV002': 'zone-c', 'UV001': 'zone-d' };
      return Boolean(aliasMap[zoneId] && affectedZoneIds.includes(aliasMap[zoneId]));
    }

    return React.createElement(
      'div',
      { className: 'uv-card uv-map-card' },
      React.createElement(
        'div',
        { className: 'uv-map-header' },
        React.createElement(
          'div',
          null,
          React.createElement('h3', { className: 'uv-card-title' }, 'Mangalore Pilot Area GIS Map'),
          React.createElement(
            'span',
            { className: 'uv-badge uv-badge-neutral' },
            `CRS: EPSG:4326 • Bounds: [${getZoneBounds(zones).join(', ')}]`
          )
        ),
        React.createElement(
          'div',
          { className: 'uv-legend' },
          React.createElement(
            'div',
            { className: 'uv-legend-item' },
            React.createElement('span', { className: 'uv-legend-chip uv-chip-high' }),
            'High Risk (70-100)'
          ),
          React.createElement(
            'div',
            { className: 'uv-legend-item' },
            React.createElement('span', { className: 'uv-legend-chip uv-chip-medium' }),
            'Medium (40-69)'
          ),
          React.createElement(
            'div',
            { className: 'uv-legend-item' },
            React.createElement('span', { className: 'uv-legend-chip uv-chip-low' }),
            'Low (0-39)'
          )
        )
      ),

      React.createElement(
        'div',
        { className: 'uv-svg-container' },
        React.createElement(
          'svg',
          { viewBox: '0 0 600 420', className: 'uv-gis-svg', preserveAspectRatio: 'xMidYMid meet' },
          React.createElement(
            'defs',
            null,
            React.createElement(
              'linearGradient',
              { id: 'waterGrad', x1: '0%', y1: '0%', x2: '100%', y2: '100%' },
              React.createElement('stop', { offset: '0%', stopColor: '#0284c7' }),
              React.createElement('stop', { offset: '100%', stopColor: '#0369a1' })
            ),
            React.createElement(
              'linearGradient',
              { id: 'landGrad', x1: '0%', y1: '0%', x2: '100%', y2: '100%' },
              React.createElement('stop', { offset: '0%', stopColor: '#0b1120' }),
              React.createElement('stop', { offset: '100%', stopColor: '#1e293b' })
            )
          ),
          React.createElement('rect', { width: '600', height: '420', fill: 'url(#landGrad)' }),

          // River corridor
          React.createElement('path', { d: 'M 0,260 Q 50,250 80,270 L 80,370 Q 50,380 0,390 Z', fill: 'url(#waterGrad)', opacity: '0.85' }),
          React.createElement('path', { d: 'M 80,370 Q 180,390 300,385 L 300,420 L 0,420 L 0,390 Z', fill: 'url(#waterGrad)', opacity: '0.9' }),
          React.createElement('text', { x: '25', y: '330', className: 'uv-svg-water-label', transform: 'rotate(-90 25,330)' }, 'RIVER CORRIDOR'),

          // Grid divisions
          React.createElement('line', { x1: '80', y1: '210', x2: '520', y2: '210', stroke: '#334155', strokeWidth: '1', strokeDasharray: '4 4' }),
          React.createElement('line', { x1: '300', y1: '50', x2: '300', y2: '370', stroke: '#334155', strokeWidth: '1', strokeDasharray: '4 4' }),

          // 4 Actual GIS Zones
          zones.map((zone) => {
            const status = getZoneStatus(zone.zone_id);
            const isSelected = selectedZoneId === zone.zone_id;
            const isAffected = isZoneAffected(zone.zone_id);

            return React.createElement(
              'g',
              {
                key: zone.zone_id,
                className: `uv-zone-group ${isSelected ? 'uv-zone-selected' : ''} ${isAffected ? 'uv-zone-affected' : ''}`,
                onClick: () => onSelectZone(zone.zone_id)
              },
              React.createElement('polygon', {
                points: zone.svg_points,
                fill: status.fill,
                stroke: isSelected ? '#ffffff' : status.color,
                strokeWidth: isSelected ? '3.5' : isAffected ? '2.5' : '1.5',
                className: `uv-zone-polygon ${isAffected ? 'uv-polygon-pulse' : ''}`
              }),
              React.createElement('circle', {
                cx: zone.center.x,
                cy: zone.center.y,
                r: '6',
                fill: status.color,
                stroke: '#0f172a',
                strokeWidth: '2'
              }),
              React.createElement(
                'text',
                { x: zone.center.x, y: zone.center.y - 12, className: 'uv-zone-label', textAnchor: 'middle' },
                `${zone.name} (${zone.zone_id})`
              ),
              React.createElement(
                'text',
                { x: zone.center.x, y: zone.center.y + 18, className: 'uv-zone-score-label', textAnchor: 'middle', fill: status.color },
                status.score !== '--' ? `Risk: ${status.score}/100 • ${status.level} (${zone.base_elevation_m}m)` : `Elev: ${zone.base_elevation_m}m`
              )
            );
          }),

          // Junction marker
          React.createElement('circle', { cx: '300', cy: '210', r: '4', fill: '#38bdf8', stroke: '#0f172a', strokeWidth: '1.5' }),
          React.createElement('text', { x: '308', y: '206', fill: '#38bdf8', fontSize: '9', fontFamily: 'monospace' }, 'Junction [74.852°E, 12.865°N]')
        )
      ),

      React.createElement(
        'div',
        { className: 'uv-map-footer' },
        React.createElement('span', { className: 'uv-map-hint' }, '💡 GIS zones UV001–UV004. Click a zone to inspect it.'),
        React.createElement('span', { className: 'uv-map-rainfall-ref' }, `Simulated Rain: ${rainfall} mm`)
      )
    );
  }

  // --- 3D Digital Twin ---
  function DigitalTwin3D({ simulationResult, selectedZoneId, onSelectZone, rainfall, activeHazard = 'flood', currentValue, zones = MANGALORE_ZONES }) {
    const [pitch, setPitch] = React.useState(60);
    const [yaw, setYaw] = React.useState(35);
    const [zoom, setZoom] = React.useState(1.05);

    const zoneResults = (simulationResult && simulationResult.zones) || [];
    const affectedZoneIds = (simulationResult && simulationResult.affected_zones) || [];
    const floodWaterHeight = Math.min(48, (rainfall / 300) * 48);
    const hazardDef = HAZARD_TYPES[activeHazard] || HAZARD_TYPES.flood;

    function getZoneStatus(zoneId) {
      let found = zoneResults.find((z) => z.zone_id === zoneId);
      if (!found) {
        const aliasMap = { 'UV004': 'zone-a', 'UV003': 'zone-b', 'UV002': 'zone-c', 'UV001': 'zone-d' };
        if (aliasMap[zoneId]) found = zoneResults.find((z) => z.zone_id === aliasMap[zoneId]);
      }
      if (!found) return { score: '--', level: 'Pending', color: '#64748b' };
      if (found.risk_level === 'High' || found.risk_level === 'Critical') return { score: found.risk_score, level: found.risk_level, color: '#ef4444' };
      if (found.risk_level === 'Medium') return { score: found.risk_score, level: 'Medium', color: '#f59e0b' };
      return { score: found.risk_score, level: 'Low', color: '#10b981' };
    }

    function isZoneAffected(zoneId) {
      if (affectedZoneIds.includes(zoneId)) return true;
      const aliasMap = { 'UV004': 'zone-a', 'UV003': 'zone-b', 'UV002': 'zone-c', 'UV001': 'zone-d' };
      return Boolean(aliasMap[zoneId] && affectedZoneIds.includes(aliasMap[zoneId]));
    }

    function project(x, y, z) {
      const radYaw = (yaw * Math.PI) / 180;
      const radPitch = (pitch * Math.PI) / 180;
      const cx = x - 235;
      const cy = y - 195;
      const rx = cx * Math.cos(radYaw) - cy * Math.sin(radYaw);
      const ry = cx * Math.sin(radYaw) + cy * Math.cos(radYaw);
      const px = rx * zoom + 300;
      const py = (ry * Math.cos(radPitch) - z * Math.sin(radPitch)) * zoom + 210;
      return { x: px, y: py };
    }

    return React.createElement(
      'div',
      { className: 'uv-card uv-3d-card' },
      React.createElement(
        'div',
        { className: 'uv-3d-header' },
        React.createElement(
          'div',
          null,
          React.createElement('h3', { className: 'uv-card-title' }, '3D Urban Digital Twin Simulation'),
          React.createElement('p', { className: 'uv-card-desc' }, `Topographical elevation & building-scale hazard overlay • ${PILOT_AREA_METADATA.city}`)
        ),
        React.createElement(
          'div',
          { className: 'uv-3d-controls-bar' },
          React.createElement('div', { className: 'uv-control-mini' },
            React.createElement('label', null, `Tilt: ${pitch}°`),
            React.createElement('input', { type: 'range', min: '30', max: '85', value: pitch, onChange: (e) => setPitch(Number(e.target.value)) })
          ),
          React.createElement('div', { className: 'uv-control-mini' },
            React.createElement('label', null, `Rotate: ${yaw}°`),
            React.createElement('input', { type: 'range', min: '-60', max: '90', value: yaw, onChange: (e) => setYaw(Number(e.target.value)) })
          ),
          React.createElement('div', { className: 'uv-control-mini' },
            React.createElement('label', null, `Zoom: ${zoom.toFixed(1)}x`),
            React.createElement('input', { type: 'range', min: '0.8', max: '1.6', step: '0.1', value: zoom, onChange: (e) => setZoom(Number(e.target.value)) })
          ),
          React.createElement('button', { className: 'uv-btn-subtle', onClick: () => { setPitch(60); setYaw(35); setZoom(1.05); } }, 'Reset')
        )
      ),

      React.createElement(
        'div',
        { className: 'uv-3d-viewport' },
        React.createElement(
          'svg',
          { viewBox: '0 0 600 420', className: 'uv-3d-svg', preserveAspectRatio: 'xMidYMid meet' },
          React.createElement('polygon', {
            points: [project(40, 40, 0), project(430, 40, 0), project(430, 360, 0), project(40, 360, 0)].map(p => `${p.x},${p.y}`).join(' '),
            fill: '#090d16',
            stroke: '#1e293b',
            strokeWidth: '1.5'
          }),

          zones.map((zone) => {
            const status = getZoneStatus(zone.zone_id);
            const isSelected = selectedZoneId === zone.zone_id;
            const isAffected = isZoneAffected(zone.zone_id);
            const { origin, width, depth, elevation_base } = zone.isometric_mesh;
            const [ox, oy] = origin;
            const ez = elevation_base;

            const b1 = project(ox + width, oy, 0);
            const b2 = project(ox + width, oy + depth, 0);
            const b3 = project(ox, oy + depth, 0);
            const t0 = project(ox, oy, ez);
            const t1 = project(ox + width, oy, ez);
            const t2 = project(ox + width, oy + depth, ez);
            const t3 = project(ox, oy + depth, ez);

            return React.createElement(
              'g',
              {
                key: zone.zone_id,
                className: `uv-3d-zone-group ${isSelected ? 'uv-3d-zone-selected' : ''}`,
                onClick: () => onSelectZone(zone.zone_id)
              },
              React.createElement('polygon', {
                points: `${t3.x},${t3.y} ${t2.x},${t2.y} ${b2.x},${b2.y} ${b3.x},${b3.y}`,
                fill: '#0f172a',
                stroke: '#334155',
                strokeWidth: '1'
              }),
              React.createElement('polygon', {
                points: `${t2.x},${t2.y} ${t1.x},${t1.y} ${b1.x},${b1.y} ${b2.x},${b2.y}`,
                fill: '#1e293b',
                stroke: '#334155',
                strokeWidth: '1'
              }),
              React.createElement('polygon', {
                points: `${t0.x},${t0.y} ${t1.x},${t1.y} ${t2.x},${t2.y} ${t3.x},${t3.y}`,
                fill: isSelected ? 'rgba(56, 189, 248, 0.35)' : 'rgba(30, 41, 59, 0.9)',
                stroke: isSelected ? '#38bdf8' : status.color,
                strokeWidth: isSelected ? '2.5' : '1.5'
              }),

              zone.isometric_mesh.buildings.map((b, bIdx) => {
                const bz = ez + b.h;
                const pt0 = project(b.x, b.y, bz);
                const pt1 = project(b.x + b.w, b.y, bz);
                const pt2 = project(b.x + b.w, b.y + b.d, bz);
                const pt3 = project(b.x, b.y + b.d, bz);
                const pb2 = project(b.x + b.w, b.y + b.d, ez);
                const pb3 = project(b.x, b.y + b.d, ez);

                return React.createElement(
                  'g',
                  { key: bIdx },
                  React.createElement('polygon', {
                    points: `${pt3.x},${pt3.y} ${pt2.x},${pt2.y} ${pb2.x},${pb2.y} ${pb3.x},${pb3.y}`,
                    fill: isAffected ? '#450a0a' : '#1e293b',
                    stroke: status.color,
                    strokeWidth: '0.8'
                  }),
                  React.createElement('polygon', {
                    points: `${pt0.x},${pt0.y} ${pt1.x},${pt1.y} ${pt2.x},${pt2.y} ${pt3.x},${pt3.y}`,
                    fill: status.color,
                    fillOpacity: '0.85',
                    stroke: '#ffffff',
                    strokeWidth: '0.5'
                  })
                );
              }),

              React.createElement(
                'text',
                { x: t0.x + 15, y: t0.y - 8, className: 'uv-3d-label', fill: status.color },
                `${zone.zone_id}: ${zone.name} (${zone.base_elevation_m}m)`
              )
            );
          }),

          // 1. Flood Inundation Overlay (Preserved)
          floodWaterHeight > 3 &&
            React.createElement('polygon', {
              points: [project(40, 160, floodWaterHeight), project(430, 160, floodWaterHeight), project(430, 360, floodWaterHeight), project(40, 360, floodWaterHeight)].map(p => `${p.x},${p.y}`).join(' '),
              fill: 'rgba(2, 132, 199, 0.65)',
              stroke: '#38bdf8',
              strokeWidth: '2',
              strokeDasharray: '4 2'
            }),

          floodWaterHeight > 3 &&
            React.createElement(
              'text',
              { x: project(50, 240, floodWaterHeight).x, y: project(50, 240, floodWaterHeight).y - 8, className: 'uv-flood-depth-tag' },
              `🌊 Water Level (+${(rainfall * 0.012).toFixed(2)}m surge)`
            ),

          // 2. Cyclone Wind Vectors Overlay (Demonstration)
          activeHazard === 'cyclone' &&
            React.createElement(
              'g',
              { className: 'uv-3d-cyclone-overlay' },
              [100, 180, 260].map((sy, idx) => {
                const pStart = project(40, sy, 35);
                const pEnd = project(430, sy + 40, 35);
                return React.createElement('path', {
                  key: idx,
                  d: `M ${pStart.x},${pStart.y} L ${pEnd.x},${pEnd.y}`,
                  stroke: '#818cf8',
                  strokeWidth: String(Math.max(1.5, ((currentValue || 120) / 250) * 3.5)),
                  strokeDasharray: '12 8',
                  opacity: '0.85'
                });
              }),
              React.createElement(
                'text',
                { x: project(60, 120, 40).x, y: project(60, 120, 40).y, fill: '#818cf8', className: 'uv-hazard-overlay-tag' },
                `🌀 Sustained Wind Stream (${currentValue || 120} km/h • Demonstration overlay)`
              )
            ),

          // 3. Heatwave Thermal Gradient Overlay (Demonstration)
          activeHazard === 'heatwave' &&
            React.createElement(
              'g',
              { className: 'uv-3d-heatwave-overlay' },
              React.createElement('polygon', {
                points: [project(40, 40, 32), project(430, 40, 32), project(430, 360, 32), project(40, 360, 32)].map(p => `${p.x},${p.y}`).join(' '),
                fill: 'rgba(251, 146, 60, 0.22)',
                stroke: '#fb923c',
                strokeWidth: '1.5',
                strokeDasharray: '6 4'
              }),
              React.createElement(
                'text',
                { x: project(60, 100, 36).x, y: project(60, 100, 36).y, fill: '#fb923c', className: 'uv-hazard-overlay-tag' },
                `☀️ Thermal Heat Dome (${currentValue || 42} °C • Demonstration overlay)`
              )
            ),

          // 4. Air Pollution Smog Veil Overlay (Demonstration)
          activeHazard === 'air_pollution' &&
            React.createElement(
              'g',
              { className: 'uv-3d-pollution-overlay' },
              React.createElement('polygon', {
                points: [project(40, 40, 24), project(430, 40, 24), project(430, 360, 24), project(40, 360, 24)].map(p => `${p.x},${p.y}`).join(' '),
                fill: 'rgba(148, 163, 184, 0.28)',
                stroke: '#cbd5e1',
                strokeWidth: '1.5',
                strokeDasharray: '6 4'
              }),
              React.createElement(
                'text',
                { x: project(60, 100, 28).x, y: project(60, 100, 28).y, fill: '#cbd5e1', className: 'uv-hazard-overlay-tag' },
                `🌫️ Particulate Smog Layer (${currentValue || 180} AQI • Demonstration overlay)`
              )
            ),

          // 5. Landslide Slope Shear Stress Overlay (Demonstration)
          activeHazard === 'landslide' &&
            React.createElement(
              'g',
              { className: 'uv-3d-landslide-overlay' },
              React.createElement('polyline', {
                points: [project(85, 185, 24), project(240, 185, 18), project(375, 185, 10)].map(p => `${p.x},${p.y}`).join(' '),
                stroke: '#f472b6',
                strokeWidth: '3.5',
                strokeDasharray: '8 4',
                fill: 'none'
              }),
              React.createElement(
                'text',
                { x: project(85, 165, 28).x, y: project(85, 165, 28).y, fill: '#f472b6', className: 'uv-hazard-overlay-tag' },
                `⛰️ Slope Shear Saturation (${currentValue || 70}% • Demonstration overlay)`
              )
            )
        )
      ),

      React.createElement(
        'div',
        { className: 'uv-3d-footer' },
        activeHazard === 'flood'
          ? React.createElement('span', null, 'Topography Gradient: UV004 Riverside (4m) ➔ UV003 Industrial (10m) ➔ UV002 Commercial (18m) ➔ UV001 Residential (24m)')
          : React.createElement('span', { className: 'uv-3d-demo-warning', style: { color: '#fbbf24' } }, `⚠️ Demonstration visualization: Simulation models for ${hazardDef.shortName} pending Member 4 integration.`),
        activeHazard === 'flood'
          ? React.createElement('span', { className: 'uv-3d-flood-note' }, rainfall > 70 ? '⚠️ UV004 Riverside Zone and UV003 Industrial Zone inundated.' : 'Water level contained.')
          : React.createElement('span', { className: 'uv-3d-flood-note' }, `Topography Exposure: UV001 Plateau (24m) • UV002 Core (18m) • UV003 Industrial (10m) • UV004 Waterfront (4m)`)
      )
    );
  }

  // --- Risk Panel ---
  function RiskPanel({
    simulationResult,
    selectedZoneId,
    onSelectZone,
    activeHazard = 'flood',
    zones = MANGALORE_ZONES,
    prioritiesState = { status: 'loading', data: null, error: null },
    assetsState = { status: 'loading', data: null, error: null }
  }) {
    const currentHazardDef = HAZARD_TYPES[activeHazard] || HAZARD_TYPES.flood;
    const zoneResults = (simulationResult && simulationResult.zones) || [];
    const affectedZones = (simulationResult && simulationResult.affected_zones) || [];
    const selectedZoneMeta = zones.find((z) => z.zone_id === selectedZoneId) || zones[0];

    function getZoneResult(zoneId) {
      let res = zoneResults.find((z) => z.zone_id === zoneId);
      if (!res) {
        const aliasMap = { 'UV004': 'zone-a', 'UV003': 'zone-b', 'UV002': 'zone-c', 'UV001': 'zone-d' };
        if (aliasMap[zoneId]) res = zoneResults.find((z) => z.zone_id === aliasMap[zoneId]);
      }
      return res;
    }

    const selectedZoneScore = selectedZoneMeta ? getZoneResult(selectedZoneMeta.zone_id) : null;

    function getRiskBadgeClass(level) {
      if (level === 'High' || level === 'Critical') return 'uv-badge-high';
      if (level === 'Medium') return 'uv-badge-medium';
      return 'uv-badge-low';
    }

    function getBarColor(score) {
      if (score >= 70) return '#ef4444';
      if (score >= 40) return '#f59e0b';
      return '#10b981';
    }

    function isZoneAffected(zoneId) {
      if (affectedZones.includes(zoneId)) return true;
      const aliasMap = { 'UV004': 'zone-a', 'UV003': 'zone-b', 'UV002': 'zone-c', 'UV001': 'zone-d' };
      return Boolean(aliasMap[zoneId] && affectedZones.includes(aliasMap[zoneId]));
    }

    const maxScore = zoneResults.length > 0 ? Math.max(...zoneResults.map((z) => z.risk_score)) : 0;
    const highRiskCount = zoneResults.filter((z) => z.risk_level === 'High' || z.risk_level === 'Critical').length;
    const assessmentInputKeys = {
      heatwave: 'temperature_c',
      air_pollution: 'aqi',
      landslide: 'slope_saturation_index'
    };
    const assessmentInputKey = assessmentInputKeys[activeHazard];
    const assessmentValue = simulationResult && simulationResult.assessment && assessmentInputKey
      ? simulationResult.assessment.inputs[assessmentInputKey]
      : null;
    const scenarioLabel = assessmentValue !== null && assessmentValue !== undefined
      ? `${activeHazard === 'landslide' ? (assessmentValue * 100).toFixed(0) : assessmentValue} ${currentHazardDef.unit}`
      : simulationResult
        ? `${simulationResult.intensity_value !== undefined ? simulationResult.intensity_value + ' ' + (simulationResult.intensity_unit || currentHazardDef.unit) : simulationResult.rainfall_mm + ' mm'}`
        : 'Awaiting assessment';

    return React.createElement(
      'section',
      { className: 'uv-card uv-risk-card' },
      React.createElement(
        'div',
        { className: 'uv-risk-header' },
        React.createElement(
          'div',
          null,
          React.createElement('h3', { className: 'uv-card-title' }, 'Hazard & Risk Intelligence'),
          React.createElement(
            'span',
            { className: 'uv-risk-sub' },
            simulationResult
              ? `${currentHazardDef.icon} ${currentHazardDef.shortName} • Scenario: ${scenarioLabel}`
              : scenarioLabel
          )
        ),
        React.createElement(
          'span',
          {
            className: 'uv-badge uv-badge-alert',
            style: { color: currentHazardDef.color, borderColor: currentHazardDef.color }
          },
          currentHazardDef.shortName
        )
      ),

      React.createElement(
        'div',
        { className: 'uv-kpi-grid' },
        React.createElement(
          'div',
          { className: 'uv-kpi-item' },
          React.createElement('span', { className: 'uv-kpi-title' }, 'Peak Risk Score'),
          React.createElement('span', { className: 'uv-kpi-val', style: { color: getBarColor(maxScore) } }, zoneResults.length > 0 ? `${maxScore}/100` : '--')
        ),
        React.createElement(
          'div',
          { className: 'uv-kpi-item' },
          React.createElement('span', { className: 'uv-kpi-title' }, 'High-Risk Zones'),
          React.createElement('span', { className: `uv-kpi-val ${highRiskCount > 0 ? 'uv-text-high' : 'uv-text-low'}` }, highRiskCount)
        ),
        React.createElement(
          'div',
          { className: 'uv-kpi-item' },
          React.createElement('span', { className: 'uv-kpi-title' }, 'Affected Area Count'),
          React.createElement('span', { className: 'uv-kpi-val' }, Array.isArray(simulationResult && simulationResult.affected_zones) ? affectedZones.length : '--')
        )
      ),

      React.createElement(
        'section',
        { className: 'uv-priorities-section', 'aria-label': 'Multi-hazard priorities' },
        React.createElement('h4', { className: 'uv-section-subtitle' }, 'Multi-Hazard Priorities (Backend)'),
        prioritiesState.status === 'loading'
          ? React.createElement('p', { className: 'uv-priority-status' }, 'Loading priority rankings…')
          : prioritiesState.status === 'error'
            ? React.createElement('p', { className: 'uv-priority-status uv-asset-error', role: 'status' }, `Priorities unavailable: ${prioritiesState.error}`)
            : prioritiesState.data
              ? React.createElement(
                  React.Fragment,
                  null,
                  prioritiesState.data.priorities.map((priority) =>
                    React.createElement(
                      'div',
                      { key: priority.zone_id, className: 'uv-priority-row' },
                      React.createElement(
                        'div',
                        { className: 'uv-priority-main' },
                        React.createElement('strong', null, `${priority.zone_name} (${priority.zone_id})`),
                        React.createElement('span', null, `${priority.priority_label} • ${priority.primary_hazard}`)
                      ),
                      React.createElement(
                        'span',
                        { className: 'uv-priority-score' },
                        `Composite priority ${priority.composite_risk_score}/100`
                      )
                    )
                  ),
                  React.createElement(
                    'p',
                    { className: 'uv-priority-disclaimer' },
                    prioritiesState.data.disclaimer || 'Simulation only; not a live emergency warning.'
                  )
                )
              : React.createElement('p', { className: 'uv-priority-status' }, 'Priority rankings have not been loaded.')
      ),

      React.createElement(
        'div',
        { className: 'uv-zone-list' },
        React.createElement('h4', { className: 'uv-section-subtitle' }, 'Actual GIS Zones Evaluation:'),
        zones.map((zone) => {
          const res = getZoneResult(zone.zone_id);
          const score = res ? res.risk_score : 0;
          const level = res ? res.risk_level : 'Pending';
          const isSelected = selectedZoneId === zone.zone_id;
          const isAffected = isZoneAffected(zone.zone_id);

          return React.createElement(
            'div',
            {
              key: zone.zone_id,
              className: `uv-zone-row ${isSelected ? 'uv-row-selected' : ''} ${isAffected ? 'uv-row-affected' : ''}`,
              onClick: () => onSelectZone(zone.zone_id)
            },
            React.createElement(
              'div',
              { className: 'uv-zone-info' },
              React.createElement(
                'div',
                { className: 'uv-zone-headline' },
                React.createElement('strong', { className: 'uv-zone-name' }, zone.name),
                React.createElement('span', { className: 'uv-zone-id-tag' }, zone.zone_id)
              ),
              React.createElement('div', { className: 'uv-zone-meta' }, `Type: ${zone.type} • Elev: ${zone.base_elevation_m}m`)
            ),
            React.createElement(
              'div',
              { className: 'uv-zone-score-col' },
              React.createElement(
                'div',
                { className: 'uv-score-badge-row' },
                React.createElement('span', { className: 'uv-score-num' }, res ? `${score}` : '--'),
                React.createElement('span', { className: `uv-badge ${getRiskBadgeClass(level)}` }, level)
              ),
              React.createElement(
                'div',
                { className: 'uv-progress-track' },
                React.createElement('div', {
                  className: 'uv-progress-fill',
                  style: { width: `${res ? score : 0}%`, backgroundColor: getBarColor(score) }
                })
              )
            )
          );
        })
      ),

      selectedZoneMeta &&
        React.createElement(
          'div',
          { className: 'uv-inspector' },
          React.createElement(
            'div',
            { className: 'uv-inspector-header' },
            React.createElement('span', { className: 'uv-inspector-icon' }, '🔍'),
            React.createElement('strong', null, `Zone Inspection: ${selectedZoneMeta.name} (${selectedZoneMeta.zone_id})`),
            React.createElement('span', { className: `uv-badge ${selectedZoneScore ? getRiskBadgeClass(selectedZoneScore.risk_level) : ''}` }, selectedZoneScore ? `${selectedZoneScore.risk_level} Risk` : 'Pending')
          ),
          React.createElement('p', { className: 'uv-inspector-desc' }, selectedZoneMeta.description),
          React.createElement(
            'div',
            { className: 'uv-inspector-stats' },
            React.createElement('div', null, React.createElement('span', null, 'Baseline Elevation: '), `${selectedZoneMeta.base_elevation_m} m AMSL`),
            React.createElement('div', null, React.createElement('span', null, 'Land Use Category: '), selectedZoneMeta.type),
            React.createElement('div', null, React.createElement('span', null, 'Bounding Box: '), `[${selectedZoneMeta.bbox.join(', ')}]`),
            React.createElement('div', null, React.createElement('span', null, 'Topology Position: '), selectedZoneMeta.zone_id === 'UV001' ? 'North-West (Inland)' : selectedZoneMeta.zone_id === 'UV002' ? 'North-East (Commercial)' : selectedZoneMeta.zone_id === 'UV003' ? 'South-East (Industrial)' : 'South-West (Riparian)')
          ),
          React.createElement(
            'div',
            { className: 'uv-inspector-explanation' },
            React.createElement('span', { className: 'uv-explanation-icon' }, '🧠'),
            React.createElement(
              'div',
              null,
              React.createElement('strong', null, 'AI & Topographic Diagnostic: '),
              React.createElement(
                'span',
                null,
                selectedZoneScore && typeof selectedZoneScore.explanation === 'string' && selectedZoneScore.explanation.trim()
                  ? selectedZoneScore.explanation
                  : 'No explanation was provided by the assessment response.'
              )
            )
          ),
          React.createElement(
            'section',
            { className: 'uv-inspector-assets', 'aria-label': 'Critical zone assets' },
            React.createElement('h4', { className: 'uv-section-subtitle' }, `Critical Assets • ${selectedZoneMeta.zone_id}`),
            assetsState.status === 'loading'
              ? React.createElement('p', { className: 'uv-asset-status' }, 'Loading zone assets…')
              : assetsState.status === 'error'
                ? React.createElement('p', { className: 'uv-asset-status uv-asset-error', role: 'status' }, `Assets unavailable: ${assetsState.error}`)
                : assetsState.status === 'empty'
                  ? React.createElement('p', { className: 'uv-asset-status' }, 'No critical assets are listed for this zone.')
                  : (assetsState.data && assetsState.data.assets || []).map((asset) =>
                      React.createElement(
                        'article',
                        { key: asset.asset_id, className: 'uv-asset-row' },
                        React.createElement('strong', null, asset.name),
                        React.createElement('span', null, `${asset.asset_type} • ${asset.criticality} • ${asset.status}`)
                      )
                    )
          )
        )
    );
  }

  // --- Recommendations ---
  function Recommendations({ simulationResult }) {
    const recommendations = (simulationResult && simulationResult.recommendations) || [];
    const affectedZones = (simulationResult && simulationResult.affected_zones) || [];

    return React.createElement(
      'section',
      { className: 'uv-card uv-recommendations-card' },
      React.createElement(
        'div',
        { className: 'uv-recommendations-header' },
        React.createElement('h3', { className: 'uv-card-title' }, 'Emergency Response Directives'),
        React.createElement('span', { className: 'uv-badge uv-badge-alert' }, 'AI Resilience Guidance')
      ),
      React.createElement(
        'div',
        { className: 'uv-affected-strip' },
        React.createElement('span', { className: 'uv-strip-label' }, 'Priority Impact Zones:'),
        affectedZones.length > 0
          ? React.createElement(
              'div',
              { className: 'uv-affected-pills' },
              affectedZones.map((zId) =>
                React.createElement('span', { key: zId, className: 'uv-affected-pill' }, `⚠️ ${zId.toUpperCase()}`)
              )
            )
          : React.createElement('span', { className: 'uv-no-affected' }, 'No zones currently exceed critical hazard thresholds.')
      ),
      React.createElement(
        'div',
        { className: 'uv-recs-list' },
        recommendations.length > 0
          ? recommendations.map((rec, idx) =>
              React.createElement(
                'div',
                { key: idx, className: 'uv-rec-item' },
                React.createElement('div', { className: 'uv-rec-number' }, `0${idx + 1}`),
                React.createElement('p', { className: 'uv-rec-text' }, rec)
              )
            )
          : React.createElement('div', { className: 'uv-recs-empty' }, 'Run a simulation to generate tailored emergency advisories.')
      ),
      React.createElement(
        'div',
        { className: 'uv-protocol-box' },
        React.createElement('strong', null, 'Disaster Protocol Note: '),
        React.createElement('span', null, 'Evacuation staging coordinates default to UV001 Residential Zone (24m elevation plateau) as safe ground.')
      )
    );
  }

  // --- Scenario Lab (independent of dashboard rainfall / simulationResult) ---
  const SCENARIO_ZONE_ORDER = ['UV001', 'UV002', 'UV003', 'UV004'];

  function readScenarioRainfall(raw) {
    const n = Number(raw);
    if (!Number.isFinite(n)) return 0;
    return Math.min(300, Math.max(0, Math.round(n)));
  }

  function scenarioZoneResult(simulation, zoneId) {
    if (!simulation || !Array.isArray(simulation.zones)) return null;
    return simulation.zones.find((z) => z.zone_id === zoneId) || null;
  }

  function scenarioLevelBadgeClass(level) {
    if (level === 'High') return 'uv-badge uv-badge-high';
    if (level === 'Medium') return 'uv-badge uv-badge-medium';
    if (level === 'Low') return 'uv-badge uv-badge-low';
    return 'uv-badge uv-badge-neutral';
  }

  function scenarioChangeFor(baselineScore, alternativeScore) {
    const delta = alternativeScore - baselineScore;
    if (delta > 0) return { delta, label: 'Increased', className: 'uv-delta-up' };
    if (delta < 0) return { delta, label: 'Decreased', className: 'uv-delta-down' };
    return { delta: 0, label: 'Unchanged', className: 'uv-delta-flat' };
  }

  function formatScenarioDelta(delta) {
    if (delta > 0) return `+${delta}`;
    return String(delta);
  }

  function ScenarioLab({ zones = MANGALORE_ZONES }) {
    const [baselineMm, setBaselineMm] = React.useState(80);
    const [alternativeMm, setAlternativeMm] = React.useState(150);
    const [baselineResult, setBaselineResult] = React.useState(null);
    const [alternativeResult, setAlternativeResult] = React.useState(null);
    const [loading, setLoading] = React.useState(false);
    const [error, setError] = React.useState(null);

    const scenarioZones = SCENARIO_ZONE_ORDER.map((id) => zones.find((z) => z.zone_id === id)).filter(Boolean);
    const inputsDiffer = Boolean(
      baselineResult &&
      alternativeResult &&
      (baselineResult.rainfall_mm !== baselineMm || alternativeResult.rainfall_mm !== alternativeMm)
    );

    async function handleCompare() {
      setLoading(true);
      setError(null);
      try {
        const [baselineRun, alternativeRun] = await Promise.all([
          simulateFloodRisk(baselineMm, 'pilot-area-01', { forceMock: true }),
          simulateFloodRisk(alternativeMm, 'pilot-area-01', { forceMock: true })
        ]);
        setBaselineResult(baselineRun.data);
        setAlternativeResult(alternativeRun.data);
      } catch (err) {
        setError(err.message || 'Comparison failed');
      } finally {
        setLoading(false);
      }
    }

    function handleReset() {
      setBaselineMm(80);
      setAlternativeMm(150);
      setBaselineResult(null);
      setAlternativeResult(null);
      setError(null);
    }

    function renderControl(title, hint, value, onChange) {
      return React.createElement(
        'div',
        { className: 'uv-scenario-control' },
        React.createElement('h3', { className: 'uv-scenario-control-title' }, title),
        React.createElement('p', { className: 'uv-card-desc' }, hint),
        React.createElement(
          'label',
          { className: 'uv-scenario-value-row' },
          React.createElement('span', { className: 'uv-slider-title' }, 'Rainfall'),
          React.createElement('input', {
            type: 'number',
            min: '0',
            max: '300',
            step: '1',
            value: value,
            className: 'uv-scenario-number',
            'aria-label': `${title} rainfall in millimetres`,
            onChange: (e) => onChange(readScenarioRainfall(e.target.value))
          }),
          React.createElement('span', { className: 'uv-rainfall-unit' }, 'mm')
        ),
        React.createElement('input', {
          type: 'range',
          min: '0',
          max: '300',
          step: '1',
          value: value,
          className: 'uv-slider',
          'aria-label': `${title} rainfall slider`,
          onChange: (e) => onChange(readScenarioRainfall(e.target.value))
        }),
        React.createElement(
          'div',
          { className: 'uv-slider-scale' },
          React.createElement('span', null, '0 mm'),
          React.createElement('span', null, '150 mm'),
          React.createElement('span', null, '300 mm')
        )
      );
    }

    function renderScore(result) {
      if (!result) return React.createElement('span', { className: 'uv-scenario-missing' }, '—');
      return React.createElement(
        'div',
        { className: 'uv-scenario-score' },
        React.createElement('strong', null, String(result.risk_score)),
        React.createElement('span', { className: scenarioLevelBadgeClass(result.risk_level) }, result.risk_level)
      );
    }

    const hasComparison = Boolean(baselineResult && alternativeResult);

    return React.createElement(
      'section',
      { id: 'scenario-lab', className: 'uv-card uv-scenario-lab', 'aria-label': 'Scenario Lab' },
      React.createElement(
        'div',
        { className: 'uv-scenario-header' },
        React.createElement(
          'div',
          null,
          React.createElement('h2', { className: 'uv-card-title' }, 'Scenario Lab'),
          React.createElement(
            'p',
            { className: 'uv-card-desc' },
            'Compare a baseline flood rainfall scenario with an alternative. Dashboard rainfall, the map, and the digital twin stay on their own simulation.'
          )
        ),
        React.createElement('span', { className: 'uv-badge uv-badge-alert' }, 'Demonstration simulation')
      ),
      React.createElement(
        'p',
        { className: 'uv-scenario-demo-note' },
        'Demonstration simulation. Scores come from the local flood model and are not a live prediction or official warning.'
      ),
      React.createElement(
        'div',
        { className: 'uv-scenario-pair' },
        renderControl('Baseline Scenario', 'Reference rainfall for the comparison.', baselineMm, setBaselineMm),
        renderControl('Alternative Scenario', 'Rainfall to compare against the baseline.', alternativeMm, setAlternativeMm)
      ),
      React.createElement(
        'div',
        { className: 'uv-scenario-actions' },
        React.createElement(
          'button',
          {
            type: 'button',
            className: `uv-btn-primary uv-btn-simulate ${loading ? 'uv-loading' : ''}`,
            onClick: handleCompare,
            disabled: loading
          },
          loading
            ? React.createElement(
                'span',
                { className: 'uv-btn-content' },
                React.createElement('span', { className: 'uv-spinner' }),
                'Comparing scenarios...'
              )
            : React.createElement('span', { className: 'uv-btn-content' }, 'Compare Scenarios')
        ),
        React.createElement(
          'button',
          {
            type: 'button',
            className: 'uv-btn-secondary',
            onClick: handleReset,
            disabled: loading
          },
          'Reset'
        )
      ),
      error &&
        React.createElement('div', { className: 'uv-error-banner' }, `Comparison error: ${error}`),
      inputsDiffer &&
        React.createElement(
          'p',
          { className: 'uv-pending-notice' },
          'Rainfall changed since the last comparison. Compare again to refresh the table.'
        ),
      hasComparison
        ? React.createElement(
            'div',
            { className: 'uv-scenario-results' },
            React.createElement(
              'p',
              { className: 'uv-scenario-results-label' },
              `Demonstration simulation • Baseline ${baselineResult.rainfall_mm} mm • Alternative ${alternativeResult.rainfall_mm} mm • Difference = alternative − baseline`
            ),
            React.createElement(
              'div',
              { className: 'uv-scenario-table-wrap' },
              React.createElement(
                'table',
                { className: 'uv-scenario-table' },
                React.createElement(
                  'thead',
                  null,
                  React.createElement(
                    'tr',
                    null,
                    React.createElement('th', null, 'Zone'),
                    React.createElement('th', null, `Baseline ${baselineResult.rainfall_mm} mm`),
                    React.createElement('th', null, `Alternative ${alternativeResult.rainfall_mm} mm`),
                    React.createElement('th', null, 'Difference'),
                    React.createElement('th', null, 'Change')
                  )
                ),
                React.createElement(
                  'tbody',
                  null,
                  scenarioZones.map((zone) => {
                    const base = scenarioZoneResult(baselineResult, zone.zone_id);
                    const alt = scenarioZoneResult(alternativeResult, zone.zone_id);
                    const comparable = base && alt && typeof base.risk_score === 'number' && typeof alt.risk_score === 'number';
                    const change = comparable ? scenarioChangeFor(base.risk_score, alt.risk_score) : null;
                    return React.createElement(
                      'tr',
                      { key: zone.zone_id },
                      React.createElement(
                        'th',
                        { scope: 'row' },
                        React.createElement('span', { className: 'uv-scenario-zone-name' }, zone.name),
                        React.createElement('span', { className: 'uv-zone-id-tag' }, zone.zone_id)
                      ),
                      React.createElement('td', null, renderScore(base)),
                      React.createElement('td', null, renderScore(alt)),
                      React.createElement(
                        'td',
                        { className: change ? change.className : '' },
                        change ? formatScenarioDelta(change.delta) : '—'
                      ),
                      React.createElement(
                        'td',
                        null,
                        change
                          ? React.createElement('span', { className: `uv-scenario-change ${change.className}` }, change.label)
                          : '—'
                      )
                    );
                  })
                )
              )
            )
          )
        : React.createElement(
            'p',
            { className: 'uv-scenario-empty' },
            'Run Compare Scenarios to see zone scores, levels, and the change from baseline to alternative.'
          )
    );
  }

  // --- Main App Root ---
  function App() {
    // Phase 1A: Multi-Hazard Safe State Management (Flood is default)
    const [activeHazard, setActiveHazard] = React.useState('flood');

    // Independent parameters per hazard: switching hazards never overwrites flood settings
    const [hazardValues, setHazardValues] = React.useState({
      flood: 80, // Preserved 80 mm benchmark test
      cyclone: 120,
      heatwave: 42,
      air_pollution: 180,
      landslide: 70
    });

    const [lastRunValues, setLastRunValues] = React.useState({
      flood: null,
      cyclone: null,
      heatwave: null,
      air_pollution: null,
      landslide: null
    });

    const [simulationResult, setSimulationResult] = React.useState(null);
    const [loading, setLoading] = React.useState(false);
    const [error, setError] = React.useState(null);
    const [viewMode, setViewMode] = React.useState('2d');
    const [selectedZoneId, setSelectedZoneId] = React.useState('UV004');
    const [backendStatus, setBackendStatus] = React.useState({ connected: false, error: 'Checking...' });
    const [isMockMode, setIsMockMode] = React.useState(false);
    const [apiSourceNote, setApiSourceNote] = React.useState('');
    const [apiWarning, setApiWarning] = React.useState(null);
    const [prioritiesState, setPrioritiesState] = React.useState({ status: 'loading', data: null, error: null });
    const prioritiesRequestRef = React.useRef(0);
    const [assetsState, setAssetsState] = React.useState({ status: 'loading', data: null, error: null });
    const [zoneData, setZoneData] = React.useState({
      zones: MANGALORE_ZONES,
      area_id: PILOT_AREA_METADATA.area_id,
      source: 'embedded_fallback',
      error: null
    });

    React.useEffect(() => {
      async function init() {
        const health = await checkBackendHealth();
        setBackendStatus(health);
        const zoneResult = await loadZoneData();
        setZoneData(zoneResult);
        await executeAssessment('flood', 80, isMockMode, zoneResult.area_id);
      }
      init();
    }, []);

    React.useEffect(() => {
      let isCurrent = true;
      setAssetsState({ status: 'loading', data: null, error: null });
      fetchZoneAssets(selectedZoneId).then((result) => {
        if (isCurrent) setAssetsState(result);
      });
      return () => {
        isCurrent = false;
      };
    }, [selectedZoneId]);

    async function checkHealth() {
      const health = await checkBackendHealth();
      setBackendStatus(health);
    }

    async function refreshPriorities(values, forceMock) {
      const requestId = prioritiesRequestRef.current + 1;
      prioritiesRequestRef.current = requestId;
      if (forceMock) {
        setPrioritiesState({
          status: 'error',
          data: null,
          error: 'Backend priorities are disabled in forced local-demo mode.'
        });
        return;
      }
      setPrioritiesState({ status: 'loading', data: prioritiesState.data, error: null });
      const result = await fetchPriorities(values);
      if (requestId !== prioritiesRequestRef.current) return;
      setPrioritiesState(result.data
        ? { status: 'loaded', data: result.data, error: null }
        : { status: 'error', data: null, error: result.error });
    }

    async function executeAssessment(hazardType, paramVal, forceMock, areaId = zoneData.area_id, values = hazardValues) {
      setLoading(true);
      setError(null);
      setApiWarning(null);
      refreshPriorities(values, forceMock);
      try {
        const result = await assessHazard(hazardType, paramVal, areaId, values, { forceMock });
        setSimulationResult(result.data);
        setLastRunValues((prev) => ({ ...prev, [hazardType]: paramVal }));
        setApiSourceNote(result.note || (result.source === 'live_backend' ? 'Backend response (simulation only)' : 'Local demonstration'));
        setApiWarning(result.warning || null);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    function handleHazardChange(newHazard) {
      setActiveHazard(newHazard);
      const targetVal = hazardValues[newHazard] !== undefined ? hazardValues[newHazard] : (HAZARD_TYPES[newHazard] ? HAZARD_TYPES[newHazard].defaultValue : 80);
      executeAssessment(newHazard, targetVal, isMockMode);
    }

    function handleValueChange(newVal) {
      setHazardValues((prev) => ({
        ...prev,
        [activeHazard]: newVal
      }));
    }

    function handleRunSimulation() {
      executeAssessment(activeHazard, hazardValues[activeHazard], isMockMode);
    }

    function handleToggleMockMode() {
      const nextMock = !isMockMode;
      setIsMockMode(nextMock);
      executeAssessment(activeHazard, hazardValues[activeHazard], nextMock);
    }

    const currentVal = hazardValues[activeHazard];
    const lastVal = lastRunValues[activeHazard];
    const currentHazardDef = HAZARD_TYPES[activeHazard] || HAZARD_TYPES.flood;

    // displayRainfall for 2D map & 3D digital twin is strictly preserved from flood parameters
    const displayRainfall = lastRunValues.flood !== null ? lastRunValues.flood : hazardValues.flood;

    return React.createElement(
      'div',
      { className: 'uv-app-container' },
      React.createElement(Header, {
        backendStatus,
        onRefreshHealth: checkHealth,
        isMockMode,
        onToggleMockMode: handleToggleMockMode
      }),

      error &&
        React.createElement(
          'div',
          { className: 'uv-error-banner' },
          React.createElement('span', null, '❌ Assessment Error: '),
          error
        ),
      apiWarning &&
        React.createElement('div', { className: 'uv-integration-warning', role: 'status' }, apiWarning),

      React.createElement(
        'div',
        { className: 'uv-source-bar' },
        React.createElement(
          'span',
          { className: 'uv-source-tag' },
          `Active Vector: ${currentHazardDef.icon} ${currentHazardDef.name} • Data Engine: ${apiSourceNote || 'Initializing...'}`
        ),
        simulationResult &&
          React.createElement(
            'span',
            { className: 'uv-source-details' },
            `Area: ${simulationResult.area_id} • Input: ${currentVal} ${currentHazardDef.unit} • Zones: ${simulationResult.zones.map(z => z.zone_id).join(', ')}`
          ),
        simulationResult && simulationResult.disclaimer &&
          React.createElement('span', { className: 'uv-source-details' }, simulationResult.disclaimer),
        React.createElement(
          'span',
          {
            className: `uv-zone-source-note ${zoneData.source === 'live_backend' ? '' : 'uv-zone-source-warning'}`,
            role: 'status'
          },
          `Zone data: ${zoneData.source === 'live_backend' ? 'Backend API' : zoneData.source === 'geojson_fallback' ? 'GeoJSON fallback' : 'Embedded fallback'}` +
            (zoneData.error ? ` — ${zoneData.error}` : '')
        )
      ),

      React.createElement(Controls, {
        activeHazard,
        onHazardChange: handleHazardChange,
        currentValue: currentVal,
        onValueChange: handleValueChange,
        rainfall: hazardValues.flood,
        onRainfallChange: (v) => setHazardValues((prev) => ({ ...prev, flood: v })),
        onRunSimulation: handleRunSimulation,
        loading,
        viewMode,
        onViewModeChange: setViewMode,
        lastRunValue: lastVal,
        lastRunRainfall: lastRunValues.flood
      }),

      React.createElement(
        'main',
        { className: 'uv-main-grid' },
        React.createElement(
          'div',
          { className: 'uv-viewport-col' },
          viewMode === '2d'
            ? React.createElement(Map2D, {
                simulationResult,
                selectedZoneId,
                onSelectZone: setSelectedZoneId,
                rainfall: displayRainfall,
                zones: zoneData.zones
              })
            : React.createElement(DigitalTwin3D, {
                simulationResult,
                selectedZoneId,
                onSelectZone: setSelectedZoneId,
                rainfall: displayRainfall,
                activeHazard,
                currentValue: currentVal,
                zones: zoneData.zones
              })
        ),
        React.createElement(
          'div',
          { className: 'uv-sidebar-col' },
          React.createElement(RiskPanel, {
            simulationResult,
            selectedZoneId,
            onSelectZone: setSelectedZoneId,
            activeHazard,
            zones: zoneData.zones,
            prioritiesState,
            assetsState
          }),
          React.createElement(Recommendations, {
            simulationResult
          })
        )
      ),

      React.createElement(ScenarioLab, { zones: zoneData.zones }),

      React.createElement(
        'footer',
        { className: 'uv-footer' },
        React.createElement(
          'p',
          null,
          'UrbanVerse • Multi-Hazard Urban Resilience Digital Twin (Flood, Cyclone, Heatwave, Air Quality, Landslide) • Mangalore Pilot Area'
        )
      )
    );
  }

  // Window bridge for inspection & headless testing
  if (typeof window !== 'undefined') {
    window.UrbanVerse = {
      HAZARD_TYPES,
      HAZARD_LIST,
      calculateMockSimulation,
      calculateHazardAssessment,
      assessHazard,
      validateZonesResponse,
      fetchBackendZones,
      loadZoneData,
      validateGeoJSON,
      validateContractResponse,
      validatePriorityResponse,
      validateAssessmentResponse,
      validateZoneAssetsResponse,
      buildAssessmentPayload,
      normalizeAssessmentResponse,
      fetchPriorities,
      fetchZoneAssets,
      Map2D,
      DigitalTwin3D,
      RiskPanel,
      ScenarioLab,
      App,
      MANGALORE_ZONES,
      PILOT_AREA_METADATA
    };
  }

  // Mount to DOM
  const rootElement = document.getElementById('root');
  if (rootElement) {
    const root = ReactDOM.createRoot(rootElement);
    root.render(React.createElement(App));
  }
})();
