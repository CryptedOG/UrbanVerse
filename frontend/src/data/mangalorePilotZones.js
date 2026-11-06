/**
 * UrbanVerse Mangalore Pilot Area Zone Definitions
 * Directly integrates data/pilot-area.geojson from origin/gis/data (commit 7bd6305)
 * Area ID: pilot-area-01 | CRS: WGS84 (EPSG:4326)
 */

export const PILOT_AREA_GEOJSON = {
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

export const PILOT_AREA_METADATA = {
  area_id: 'pilot-area-01',
  name: PILOT_AREA_GEOJSON.name,
  city: 'Mangalore Coastal Pilot Demonstration, Karnataka, India',
  coordinates: {
    lat: 12.8650,
    lng: 74.8520
  },
  bounds: {
    west: 74.8400,
    south: 12.8550,
    east: 74.8640,
    north: 12.8750
  },
  bbox: PILOT_AREA_GEOJSON.bbox,
  description: PILOT_AREA_GEOJSON.description
};

/**
 * Coordinate projection helpers to convert WGS84 GeoJSON [lng, lat]
 * directly to 2D SVG canvas (600x420) coordinates
 */
const SVG_MARGIN_X = 80;
const SVG_MARGIN_Y = 50;
const SVG_PLOT_W = 440;
const SVG_PLOT_H = 320;

const [minLon, minLat, maxLon, maxLat] = PILOT_AREA_METADATA.bbox;

export function projectLngLatToSvg(lng, lat) {
  const x = SVG_MARGIN_X + ((lng - minLon) / (maxLon - minLon)) * SVG_PLOT_W;
  const y = SVG_MARGIN_Y + ((maxLat - lat) / (maxLat - minLat)) * SVG_PLOT_H;
  return { x: Math.round(x), y: Math.round(y) };
}

// Convert GeoJSON features into enriched UI zone structures
export const MANGALORE_ZONES = PILOT_AREA_GEOJSON.features.map((feature) => {
  const props = feature.properties;
  const coords = feature.geometry.coordinates[0]; // exterior ring
  
  // Calculate SVG polygon points directly from GeoJSON coordinates
  const svgPointPairs = coords.slice(0, -1).map(([lng, lat]) => {
    const pt = projectLngLatToSvg(lng, lat);
    return `${pt.x},${pt.y}`;
  });
  const svg_points = svgPointPairs.join(' ');

  // Calculate center coordinate
  const [fMinLon, fMinLat, fMaxLon, fMaxLat] = feature.bbox;
  const centerPt = projectLngLatToSvg((fMinLon + fMaxLon) / 2, (fMinLat + fMaxLat) / 2);

  // Configure matching 3D isometric representation based on GIS properties
  let isometric_mesh;
  if (props.zone_id === 'UV001') {
    // North-West (Residential, 24m)
    isometric_mesh = {
      origin: [85, 80],
      width: 135,
      depth: 105,
      elevation_base: Math.round(props.elevation_m * 2.2), // 53
      buildings: [
        { x: 95, y: 90, w: 26, h: 32, d: 24, label: 'Residential Block A' },
        { x: 135, y: 110, w: 32, h: 42, d: 28, label: 'Highland Condos' },
        { x: 175, y: 95, w: 24, h: 28, d: 22, label: 'School & Shelter' }
      ]
    };
  } else if (props.zone_id === 'UV002') {
    // North-East (Commercial, 18m)
    isometric_mesh = {
      origin: [240, 80],
      width: 135,
      depth: 105,
      elevation_base: Math.round(props.elevation_m * 2.2), // 40
      buildings: [
        { x: 250, y: 90, w: 34, h: 58, d: 30, label: 'Central Commerce Tower' },
        { x: 295, y: 105, w: 36, h: 68, d: 34, label: 'Financial Plaza' },
        { x: 335, y: 95, w: 28, h: 48, d: 26, label: 'Transit Hub' }
      ]
    };
  } else if (props.zone_id === 'UV003') {
    // South-East (Industrial, 10m)
    isometric_mesh = {
      origin: [240, 205],
      width: 135,
      depth: 105,
      elevation_base: Math.round(props.elevation_m * 2.2), // 22
      buildings: [
        { x: 255, y: 220, w: 38, h: 30, d: 36, label: 'Industrial Logistics' },
        { x: 305, y: 235, w: 42, h: 35, d: 38, label: 'Power Substation' },
        { x: 270, y: 265, w: 32, h: 26, d: 30, label: 'Material Warehouses' }
      ]
    };
  } else {
    // UV004: South-West (Riverside, 4m - Lowest, riparian corridor)
    isometric_mesh = {
      origin: [85, 205],
      width: 135,
      depth: 105,
      elevation_base: Math.round(props.elevation_m * 2.2), // 9
      buildings: [
        { x: 95, y: 215, w: 28, h: 22, d: 24, label: 'Riverside Settlement' },
        { x: 135, y: 240, w: 30, h: 25, d: 28, label: 'River Freight Jetty' },
        { x: 175, y: 225, w: 24, h: 20, d: 22, label: 'Drainage Culvert Station' }
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

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    PILOT_AREA_GEOJSON,
    PILOT_AREA_METADATA,
    MANGALORE_ZONES,
    projectLngLatToSvg
  };
}
