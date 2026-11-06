/**
 * UrbanVerse Frontend Dev & Preview Server
 * Zero-dependency local static server with contract-compliant API mock fallback
 * Calibrated to actual GIS zones UV001 - UV004 from data/pilot-area.geojson (commit 7bd6305)
 * Usage: node server.js [port]
 */

import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = parseInt(process.env.PORT, 10) || 3000;
const PUBLIC_DIR = path.join(__dirname, 'public');

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.geojson': 'application/geo+json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.ico': 'image/x-icon'
};

// Simulation mock logic matching 00_Team_Integration_Guide.pdf and GIS field guide
export function calculateContractSimulation(rainfall_mm, area_id = 'pilot-area-01') {
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
    calculateZone('UV001', 24.0, 40, 75), // Yields score 35 (Low) at 80mm
    calculateZone('UV002', 18.0, 55, 64), // Yields score 62 (Medium) at 80mm
    calculateZone('UV003', 10.0, 60, 45), // Yields score 75 (High) at 80mm
    calculateZone('UV004', 4.0,  75, 38)  // Yields score 92 (High) at 80mm
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

export function requestHandler(req, res) {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Accept');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  // API Route: GET /api/health
  if (req.url === '/api/health' && req.method === 'GET') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: 'ok', service: 'UrbanVerse Frontend Mock/Gateway', timestamp: new Date().toISOString() }));
    return;
  }

  // API Route: GET /api/zones (Official GIS Zones from data/pilot-area.geojson)
  if (req.url === '/api/zones' && req.method === 'GET') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    const zonesPayload = {
      area_id: 'pilot-area-01',
      area_name: 'UrbanVerse Mangalore Pilot Area',
      count: 4,
      zones: [
        {
          zone_id: 'UV001',
          name: 'Residential Zone',
          description: 'Elevated residential district with natural slope gradients facilitating stormwater runoff.',
          elevation_m: 24.0,
          center: { latitude: 12.8700, longitude: 74.8460 },
          polygon: [[74.8400, 12.8650], [74.8520, 12.8650], [74.8520, 12.8750], [74.8400, 12.8750], [74.8400, 12.8650]]
        },
        {
          zone_id: 'UV002',
          name: 'Commercial Zone',
          description: 'High-density commercial district with extensive impervious concrete cover.',
          elevation_m: 18.0,
          center: { latitude: 12.8700, longitude: 74.8580 },
          polygon: [[74.8520, 12.8650], [74.8640, 12.8650], [74.8640, 12.8750], [74.8520, 12.8750], [74.8520, 12.8650]]
        },
        {
          zone_id: 'UV003',
          name: 'Industrial Zone',
          description: 'Coastal transit and industrial strip with high sensitivity to combined runoff.',
          elevation_m: 10.0,
          center: { latitude: 12.8600, longitude: 74.8580 },
          polygon: [[74.8520, 12.8550], [74.8640, 12.8550], [74.8640, 12.8650], [74.8520, 12.8650], [74.8520, 12.8550]]
        },
        {
          zone_id: 'UV004',
          name: 'Riverside Zone',
          description: 'Low-lying riverfront basin adjacent to estuary waterways; highly susceptible to rapid water accumulation.',
          elevation_m: 4.0,
          center: { latitude: 12.8600, longitude: 74.8460 },
          polygon: [[74.8400, 12.8550], [74.8520, 12.8550], [74.8520, 12.8650], [74.8400, 12.8650], [74.8400, 12.8550]]
        }
      ],
      simulation_only: true,
      disclaimer: 'Simulation only; not a live emergency warning.'
    };
    res.end(JSON.stringify(zonesPayload, null, 2));
    return;
  }

  // API Route: POST /api/simulate
  if (req.url === '/api/simulate' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
      try {
        const payload = JSON.parse(body || '{}');
        const rainfall = Number(payload.rainfall_mm) || 0;
        const areaId = payload.area_id || 'pilot-area-01';
        const result = calculateContractSimulation(rainfall, areaId);

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(result, null, 2));
      } catch (err) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Invalid JSON payload' }));
      }
    });
    return;
  }

  // Static File Serving
  let reqPath = req.url.split('?')[0];
  if (reqPath === '/' || reqPath === '') reqPath = '/index.html';

  const safePath = path.normalize(reqPath).replace(/^(\.\.[\/\\])+/, '');
  const filePath = path.join(PUBLIC_DIR, safePath);

  fs.stat(filePath, (err, stats) => {
    if (err || !stats.isFile()) {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end(`404 Not Found: ${reqPath}`);
      return;
    }

    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';

    res.writeHead(200, { 'Content-Type': contentType });
    fs.createReadStream(filePath).pipe(res);
  });
}

export const server = http.createServer(requestHandler);

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  server.listen(PORT, '127.0.0.1', () => {
    console.log(`[UrbanVerse] Frontend dashboard running locally at: http://localhost:${PORT}`);
    console.log(`[UrbanVerse] Shared Contract Endpoints active:`);
    console.log(`  - GET  http://localhost:${PORT}/api/health`);
    console.log(`  - POST http://localhost:${PORT}/api/simulate`);
  });
}
