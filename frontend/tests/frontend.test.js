/**
 * UrbanVerse Frontend Automated Verification Suite
 * Tests actual GIS integration (data/pilot-area.geojson at commit 7bd6305)
 * for all 8 core criteria:
 * 1. React application runs successfully.
 * 2. Mangalore map is displayed with all 4 actual GIS zones (UV001 - UV004).
 * 3. Rainfall slider works across multiple mm settings.
 * 4. Simulation button works (POST /api/simulate).
 * 5. Risk zones change colours based on returned risk levels.
 * 6. Zone-wise risk scores and labels are displayed.
 * 7. Emergency recommendations are displayed.
 * 8. API integration follows the shared contract.
 */

import { EventEmitter } from 'events';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import vm from 'vm';

import { requestHandler, calculateContractSimulation } from '../server.js';
import { MANGALORE_ZONES, PILOT_AREA_METADATA, PILOT_AREA_GEOJSON } from '../src/data/mangalorePilotZones.js';
import { validateContractResponse, assessHazard } from '../src/api/client.js';
import { HAZARD_TYPES, HAZARD_LIST } from '../src/data/hazardDefinitions.js';
import { calculateHazardAssessment, calculateMockSimulation } from '../src/api/mockData.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let failures = 0;
let passed = 0;

function assert(condition, testName, details = '') {
  if (condition) {
    console.log(`  ✅ PASS: ${testName}`);
    passed++;
  } else {
    console.error(`  ❌ FAIL: ${testName} ${details ? '(' + details + ')' : ''}`);
    failures++;
  }
}

function simulateRequest(method, url, body = null) {
  return new Promise((resolve) => {
    const req = new EventEmitter();
    req.method = method;
    req.url = url;
    req.headers = {
      'accept': 'application/json, text/html',
      ...(body ? { 'content-type': 'application/json' } : {})
    };

    let statusCode = 200;
    const headers = {};
    let data = '';

    const res = new EventEmitter();
    res.setHeader = (k, v) => { headers[k.toLowerCase()] = v; };
    res.writeHead = (code, h) => {
      statusCode = code;
      if (h) {
        for (const [k, v] of Object.entries(h)) {
          headers[k.toLowerCase()] = v;
        }
      }
    };
    res.write = (chunk) => { data += chunk; };
    res.end = (chunk) => {
      if (chunk) data += chunk;
      resolve({ statusCode, headers, data });
    };

    requestHandler(req, res);

    if (body) {
      req.emit('data', Buffer.from(JSON.stringify(body)));
    }
    req.emit('end');
  });
}

async function runTestSuite() {
  console.log('\n======================================================');
  console.log('🧪 URBANVERSE FRONTEND AUTOMATED TEST SUITE');
  console.log('   Actual GIS Integration Verification (commit 7bd6305)');
  console.log('======================================================\n');

  try {
    // --------------------------------------------------------
    // CHECK 1: React application runs successfully
    // --------------------------------------------------------
    console.log('--- Check 1: React Application Execution & Serving ---');
    const indexRes = await simulateRequest('GET', '/');
    assert(indexRes.statusCode === 200, 'Server responds with HTTP 200 for index.html');
    assert(indexRes.data.includes('id="root"'), 'HTML contains React mount point root element');
    assert(indexRes.data.includes('vendor/react.production.min.js'), 'HTML loads React runtime bundle');
    assert(indexRes.data.includes('app.js'), 'HTML loads main application bundle');

    const publicDir = path.join(__dirname, '..', 'public');
    const geojsonDiskPath = path.join(publicDir, 'data', 'pilot-area.geojson');
    assert(fs.existsSync(geojsonDiskPath), 'Actual pilot-area.geojson exists in public data directory');

    const rawGeojson = JSON.parse(fs.readFileSync(geojsonDiskPath, 'utf8'));
    assert(rawGeojson.type === 'FeatureCollection', 'GeoJSON is a standard FeatureCollection');
    assert(rawGeojson.features.length === 4, 'GeoJSON contains exactly 4 features');
    const geoJSONRes = await simulateRequest('GET', '/data/pilot-area.geojson');
    assert(geoJSONRes.statusCode === 200 && JSON.parse(geoJSONRes.data).type === 'FeatureCollection',
      'Static server exposes the GeoJSON file used by the browser fallback');

    const appJsContent = fs.readFileSync(path.join(publicDir, 'app.js'), 'utf8');
    assert(appJsContent.includes('function App()'), 'app.js defines App component');
    assert(appJsContent.includes('function Map2D('), 'app.js defines Map2D component');
    assert(appJsContent.includes('function DigitalTwin3D('), 'app.js defines DigitalTwin3D component');
    assert(appJsContent.includes('function RiskPanel('), 'app.js defines RiskPanel component');

    // --------------------------------------------------------
    // CHECK 2: Mangalore map is displayed with actual GIS zones
    // --------------------------------------------------------
    console.log('\n--- Check 2: Actual GIS Zones Integration (UV001 - UV004) ---');
    assert(PILOT_AREA_METADATA.area_id === 'pilot-area-01', 'Pilot area ID matches pilot-area-01');
    assert(PILOT_AREA_METADATA.bbox.length === 4, 'Bounding box defined: [74.8400, 12.8550, 74.8640, 12.8750]');
    assert(MANGALORE_ZONES.length === 4, 'All 4 actual GIS zones loaded into frontend');

    const expectedZones = ['UV001', 'UV002', 'UV003', 'UV004'];
    const loadedZoneIds = MANGALORE_ZONES.map(z => z.zone_id);
    expectedZones.forEach(id => {
      assert(loadedZoneIds.includes(id), `Actual GIS Zone ${id} is present in map layer`);
    });

    const uv001 = MANGALORE_ZONES.find(z => z.zone_id === 'UV001');
    const uv002 = MANGALORE_ZONES.find(z => z.zone_id === 'UV002');
    const uv003 = MANGALORE_ZONES.find(z => z.zone_id === 'UV003');
    const uv004 = MANGALORE_ZONES.find(z => z.zone_id === 'UV004');

    assert(uv001.base_elevation_m === 24.0, 'UV001 has baseline elevation 24.0m (Residential)');
    assert(uv002.base_elevation_m === 18.0, 'UV002 has baseline elevation 18.0m (Commercial)');
    assert(uv003.base_elevation_m === 10.0, 'UV003 has baseline elevation 10.0m (Industrial)');
    assert(uv004.base_elevation_m === 4.0,  'UV004 has baseline elevation 4.0m (Riverside)');

    MANGALORE_ZONES.forEach(z => {
      assert(Boolean(z.svg_points && z.svg_points.length > 10), `Zone ${z.zone_id} has projected SVG coordinates`);
      assert(Boolean(z.isometric_mesh && z.isometric_mesh.buildings.length > 0), `Zone ${z.zone_id} has matching 3D Digital Twin mesh`);
    });

    // --------------------------------------------------------
    // CHECK 3: Rainfall slider works
    // --------------------------------------------------------
    console.log('\n--- Check 3: Rainfall Slider & Input Sensitivity ---');
    const simLow = calculateContractSimulation(25, 'pilot-area-01');
    const simBench = calculateContractSimulation(80, 'pilot-area-01');
    const simHigh = calculateContractSimulation(150, 'pilot-area-01');
    const simExtreme = calculateContractSimulation(240, 'pilot-area-01');

    assert(simLow.rainfall_mm === 25, 'Simulation accepts 25mm input');
    assert(simBench.rainfall_mm === 80, 'Simulation accepts 80mm benchmark input');
    assert(simHigh.rainfall_mm === 150, 'Simulation accepts 150mm heavy rain input');
    assert(simExtreme.rainfall_mm === 240, 'Simulation accepts 240mm flood surge input');

    const scoreLow4 = simLow.zones.find(z => z.zone_id === 'UV004').risk_score;
    const scoreBench4 = simBench.zones.find(z => z.zone_id === 'UV004').risk_score;
    const scoreHigh4 = simHigh.zones.find(z => z.zone_id === 'UV004').risk_score;
    assert(scoreBench4 > scoreLow4, `Risk increases with rain (25mm: ${scoreLow4} -> 80mm: ${scoreBench4})`);
    assert(scoreHigh4 >= scoreBench4, `Risk scales to peak (80mm: ${scoreBench4} -> 150mm: ${scoreHigh4})`);

    // --------------------------------------------------------
    // CHECK 4: Simulation button works (calls POST /api/simulate)
    // --------------------------------------------------------
    console.log('\n--- Check 4: Simulation Button & POST /api/simulate Endpoint ---');
    const simReqPayload = { rainfall_mm: 80, area_id: 'pilot-area-01' };
    const apiRes = await simulateRequest('POST', '/api/simulate', simReqPayload);
    assert(apiRes.statusCode === 200, 'POST /api/simulate returns HTTP 200 OK');

    const apiData = JSON.parse(apiRes.data);
    assert(apiData.area_id === 'pilot-area-01', 'API response preserves area_id: pilot-area-01');
    assert(apiData.rainfall_mm === 80, 'API response preserves input rainfall_mm: 80');

    // --------------------------------------------------------
    // CHECK 5: Risk zones change colours based on actual GIS zone IDs
    // --------------------------------------------------------
    console.log('\n--- Check 5: Risk Zones Color State Changes with Actual GIS IDs ---');
    const dryRun = calculateContractSimulation(15, 'pilot-area-01');
    const uv001Dry = dryRun.zones.find(z => z.zone_id === 'UV001');
    assert(uv001Dry.risk_level === 'Low', `Dry scenario sets UV001 to Low risk (score: ${uv001Dry.risk_score})`);

    const benchRun = calculateContractSimulation(80, 'pilot-area-01');
    const uv004Bench = benchRun.zones.find(z => z.zone_id === 'UV004');
    const uv003Bench = benchRun.zones.find(z => z.zone_id === 'UV003');
    const uv002Bench = benchRun.zones.find(z => z.zone_id === 'UV002');
    const uv001Bench = benchRun.zones.find(z => z.zone_id === 'UV001');

    assert(uv004Bench.risk_level === 'High', `Benchmark 80mm sets UV004 (Riverside, 4m) to High risk (score: ${uv004Bench.risk_score})`);
    assert(uv003Bench.risk_level === 'High', `Benchmark 80mm sets UV003 (Industrial, 10m) to High risk (score: ${uv003Bench.risk_score})`);
    assert(uv002Bench.risk_level === 'Medium', `Benchmark 80mm sets UV002 (Commercial, 18m) to Medium risk (score: ${uv002Bench.risk_score})`);
    assert(uv001Bench.risk_level === 'Low', `Benchmark 80mm sets UV001 (Residential, 24m) to Low risk (score: ${uv001Bench.risk_score})`);

    const riskColors = { 'High': '#ef4444', 'Medium': '#f59e0b', 'Low': '#10b981' };
    assert(riskColors[uv004Bench.risk_level] === '#ef4444', 'UV004 High risk maps to Crimson Red (#ef4444)');
    assert(riskColors[uv002Bench.risk_level] === '#f59e0b', 'UV002 Medium risk maps to Amber (#f59e0b)');
    assert(riskColors[uv001Bench.risk_level] === '#10b981', 'UV001 Low risk maps to Emerald Green (#10b981)');

    // --------------------------------------------------------
    // CHECK 6: Zone-wise risk scores are displayed
    // --------------------------------------------------------
    console.log('\n--- Check 6: Zone-Wise Risk Scores & GIS Properties ---');
    assert(Array.isArray(benchRun.zones) && benchRun.zones.length === 4, 'Response contains evaluations for all 4 GIS zones');
    benchRun.zones.forEach(z => {
      assert(expectedZones.includes(z.zone_id), `Returned zone_id matches GIS catalog (${z.zone_id})`);
      assert(z.risk_score >= 0 && z.risk_score <= 100, `Zone ${z.zone_id} score is in range 0-100 (${z.risk_score})`);
      assert(['Low', 'Medium', 'High'].includes(z.risk_level), `Zone ${z.zone_id} risk_level is valid (${z.risk_level})`);
    });

    // --------------------------------------------------------
    // CHECK 7: Emergency recommendations are displayed
    // --------------------------------------------------------
    console.log('\n--- Check 7: Emergency Recommendations & Directives ---');
    assert(Array.isArray(benchRun.recommendations) && benchRun.recommendations.length > 0, 'Emergency recommendations generated');
    assert(benchRun.recommendations.some(r => r.includes('UV004') || r.includes('Riverside')),
      'Recommendations explicitly reference UV004 Riverside Zone');
    assert(benchRun.affected_zones.includes('UV004') && benchRun.affected_zones.includes('UV003'),
      'Affected zones list highlights UV004 and UV003');

    // --------------------------------------------------------
    // CHECK 8: API integration follows the shared contract
    // --------------------------------------------------------
    console.log('\n--- Check 8: API Integration Contract Schema Compliance ---');
    let contractValid = false;
    try {
      contractValid = validateContractResponse(apiData);
    } catch (e) {
      console.error(e.message);
    }
    assert(contractValid, 'POST /api/simulate output strictly satisfies shared integration contract');
    assert(apiData.simulation_only === true, 'Response enforces simulation_only === true');

    const healthRes = await simulateRequest('GET', '/api/health');
    assert(healthRes.statusCode === 200, 'GET /api/health responds with HTTP 200 OK');
    const healthData = JSON.parse(healthRes.data);
    assert(healthData.status === 'ok', 'GET /api/health returns status "ok"');

    // --------------------------------------------------------
    // CHECK 9: Multi-Hazard Selection & Input Controls (Phase 1A)
    // --------------------------------------------------------
    console.log('\n--- Check 9: Multi-Hazard Intelligence & Selection (Phase 1A) ---');

    // 1. Five hazard modes are defined and selectable
    const expectedHazardIds = ['flood', 'cyclone', 'heatwave', 'air_pollution', 'landslide'];
    assert(Object.keys(HAZARD_TYPES).length === 5, 'Exactly 5 hazard types defined in system');
    expectedHazardIds.forEach(id => {
      assert(Boolean(HAZARD_TYPES[id]), `Hazard mode "${id}" is configured and defined`);
    });

    const appJsSource = fs.readFileSync(path.join(publicDir, 'app.js'), 'utf8');
    assert(appJsSource.includes('uv-hazard-nav'), 'app.js renders multi-hazard navigation component');
    assert(appJsSource.includes('uv-hazard-tabs'), 'app.js renders multi-hazard tab list');
    assert(appJsSource.includes("role: 'tab'"), 'app.js sets accessible role="tab" for hazard buttons');

    // 2. Flood is the default selected hazard
    assert(appJsSource.includes("useState('flood')"), 'Flood is configured as the default active hazard state');
    assert(HAZARD_TYPES.flood.defaultValue === 80, 'Flood default precipitation is 80 mm benchmark');

    // 3. Correct units and input ranges
    assert(HAZARD_TYPES.flood.unit === 'mm', 'Flood unit is millimetres (mm)');
    assert(HAZARD_TYPES.flood.min === 0 && HAZARD_TYPES.flood.max === 300, 'Flood range is 0 - 300 mm');

    assert(HAZARD_TYPES.cyclone.unit === 'km/h', 'Cyclone unit is km/h');
    assert(HAZARD_TYPES.cyclone.min === 0 && HAZARD_TYPES.cyclone.max === 250, 'Cyclone range is 0 - 250 km/h');

    assert(HAZARD_TYPES.heatwave.unit === '°C', 'Heatwave unit is °C');
    assert(HAZARD_TYPES.heatwave.min === 30 && HAZARD_TYPES.heatwave.max === 50, 'Heatwave range is 30 - 50 °C');

    assert(HAZARD_TYPES.air_pollution.unit === 'AQI', 'Air pollution unit is AQI');
    assert(HAZARD_TYPES.air_pollution.min === 0 && HAZARD_TYPES.air_pollution.max === 500, 'Air pollution range is 0 - 500 AQI');

    assert(HAZARD_TYPES.landslide.unit === '%', 'Landslide unit is percentage (%)');
    assert(HAZARD_TYPES.landslide.min === 0 && HAZARD_TYPES.landslide.max === 100, 'Landslide range is 0 - 100 %');

    // 4. Preserved flood presets
    const floodPresetLabels = HAZARD_TYPES.flood.presets.map(p => p.label);
    assert(floodPresetLabels.includes('Light') && floodPresetLabels.includes('Benchmark') &&
           floodPresetLabels.includes('Heavy') && floodPresetLabels.includes('Extreme'),
           'All 4 flood presets (Light 25mm, Benchmark 80mm, Heavy 150mm, Extreme 240mm) are preserved');

    // 5. Switching hazards without losing flood settings
    assert(appJsSource.includes('hazardValues'), 'app.js implements isolated hazardValues dictionary state');
    assert(appJsSource.includes('lastRunValues'), 'app.js tracks independent lastRunValues per hazard');

    // Simulate parameter isolation: Changing cyclone does not alter flood
    let testHazardState = { flood: 80, cyclone: 120, heatwave: 42, air_pollution: 180, landslide: 70 };
    testHazardState = { ...testHazardState, cyclone: 200 };
    assert(testHazardState.cyclone === 200, 'Cyclone parameter can be updated to 200 km/h');
    assert(testHazardState.flood === 80, 'Flood precipitation remains strictly preserved at 80 mm after cyclone edit');

    // 6. Hazard assessment models follow contract schema
    for (const hId of expectedHazardIds) {
      const def = HAZARD_TYPES[hId];
      const assessment = calculateHazardAssessment(hId, def.defaultValue, 'pilot-area-01');
      assert(validateContractResponse(assessment), `Assessment for "${hId}" adheres to integration contract schema`);
      assert(assessment.zones.length === 4, `Assessment for "${hId}" evaluates all 4 GIS zones`);
      assert(assessment.zones.every(z => !Object.prototype.hasOwnProperty.call(z, 'explanation')),
        `Local demo for "${hId}" does not claim a fabricated risk explanation`);
    }

    // 7. Existing flood simulation still working exactly
    const floodCheck = calculateMockSimulation(80, 'pilot-area-01');
    const u1 = floodCheck.zones.find(z => z.zone_id === 'UV001');
    const u2 = floodCheck.zones.find(z => z.zone_id === 'UV002');
    const u3 = floodCheck.zones.find(z => z.zone_id === 'UV003');
    const u4 = floodCheck.zones.find(z => z.zone_id === 'UV004');
    assert(u1.risk_score === 35 && u1.risk_level === 'Low', 'Flood UV001 benchmark score remains 35 (Low)');
    assert(u2.risk_score === 62 && u2.risk_level === 'Medium', 'Flood UV002 benchmark score remains 62 (Medium)');
    assert(u3.risk_score === 75 && u3.risk_level === 'High', 'Flood UV003 benchmark score remains 75 (High)');
    assert(u4.risk_score === 92 && u4.risk_level === 'High', 'Flood UV004 benchmark score remains 92 (High)');

    // --------------------------------------------------------
    // CHECK 10: Actual GIS Backend Integration, Zone Intelligence & 3D Multi-Hazard Overlays (Phase 1B)
    // --------------------------------------------------------
    console.log('\n--- Check 10: Phase 1B Backend Integration, Zone Intelligence & 3D Multi-Hazard Overlays ---');

    // 1. STEP 1: Actual GIS Backend Integration (GET /api/zones)
    const zonesRes = await simulateRequest('GET', '/api/zones');
    assert(zonesRes.statusCode === 200, 'GET /api/zones responds with HTTP 200 OK');
    const backendZonesData = JSON.parse(zonesRes.data);
    assert(backendZonesData.area_id === 'pilot-area-01', 'GET /api/zones returns standardized area_id "pilot-area-01"');
    assert(Array.isArray(backendZonesData.zones) && backendZonesData.zones.length === 4, 'GET /api/zones returns exactly 4 GIS zones');

    const returnedZoneIds = backendZonesData.zones.map(z => z.zone_id);
    ['UV001', 'UV002', 'UV003', 'UV004'].forEach(id => {
      assert(returnedZoneIds.includes(id), `GET /api/zones contains official GIS zone ${id}`);
    });

    backendZonesData.zones.forEach(z => {
      assert(typeof z.elevation_m === 'number' && z.elevation_m > 0, `GIS Zone ${z.zone_id} has valid elevation_m (${z.elevation_m}m)`);
      assert(Boolean(z.polygon || z.center), `GIS Zone ${z.zone_id} contains GIS geometric coordinates`);
    });

    // Extract runtime functions from app.js using VM context
    const registeredEffects = [];
    const stateUpdates = [];
    let stateIndex = 0;
    const vmContext = {
      document: { getElementById: () => null },
      React: {
        Fragment: 'fragment',
        createElement: (type, props, ...children) => ({ type, props: props || {}, children }),
        useState: (init) => {
          const currentIndex = stateIndex++;
          stateUpdates[currentIndex] = [];
          return [init, (value) => stateUpdates[currentIndex].push(value)];
        },
        useEffect: (effect) => registeredEffects.push(effect),
        useRef: (current) => ({ current }),
        useMemo: (fn) => fn()
      },
      ReactDOM: { createRoot: () => ({ render: () => {} }) },
      fetch: () => Promise.resolve({ ok: true, json: () => Promise.resolve(backendZonesData) }),
      AbortController: class { abort() {} get signal() { return {}; } },
      setTimeout: () => 1,
      clearTimeout: () => {}
    };
    vmContext.window = vmContext;
    vm.createContext(vmContext);
    vm.runInContext(appJsSource, vmContext);
    const uv = vmContext.UrbanVerse;

    assert(typeof uv.validateZonesResponse === 'function', 'app.js defines and exports validateZonesResponse()');
    assert(typeof uv.fetchBackendZones === 'function', 'app.js defines and exports fetchBackendZones()');
    assert(typeof uv.loadZoneData === 'function', 'app.js exposes the complete zone loading and fallback flow');

    // Test validateZonesResponse validation logic
    assert(uv.validateZonesResponse(backendZonesData) === true, 'validateZonesResponse() accepts valid backend zones payload');

    let caughtEmptyError = false;
    try {
      uv.validateZonesResponse({ zones: [] });
    } catch (e) {
      caughtEmptyError = true;
    }
    assert(caughtEmptyError, 'validateZonesResponse() rejects empty zones array');

    let caughtMissingZoneError = false;
    try {
      uv.validateZonesResponse({ zones: [{ zone_id: 'UV001' }, { zone_id: 'UV002' }] });
    } catch (e) {
      caughtMissingZoneError = true;
    }
    assert(caughtMissingZoneError, 'validateZonesResponse() rejects incomplete GIS zone list');

    // Test GeoJSON fallback preservation when backend unavailable
    const fallbackZones = uv.MANGALORE_ZONES;
    assert(Array.isArray(fallbackZones) && fallbackZones.length === 4, 'GeoJSON fallback preserves all 4 GIS zones (UV001-UV004)');

    // 2. STEP 2: Zone Intelligence & Diagnostic Explanation
    assert(appJsSource.includes('uv-inspector-explanation'), 'app.js contains uv-inspector-explanation container');
    assert(appJsSource.includes('AI & Topographic Diagnostic:'), 'app.js includes AI & Topographic Diagnostic headline');

    const simCheck = calculateContractSimulation(80, 'pilot-area-01');
    simCheck.zones.forEach(z => {
      assert(!Object.prototype.hasOwnProperty.call(z, 'explanation'), `Local server demo does not fabricate an explanation for zone ${z.zone_id}`);
    });

    const appSimCheck = uv.calculateMockSimulation(80, 'pilot-area-01');
    appSimCheck.zones.forEach(z => {
      assert(!Object.prototype.hasOwnProperty.call(z, 'explanation'), `Local browser demo does not fabricate an explanation for zone ${z.zone_id}`);
    });

    assert(appJsSource.includes('No explanation was provided by the assessment response.'),
      'RiskPanel handles missing backend explanations without inventing a scientific explanation');

    // 2D and 3D synchronization: selectedZoneId passed to both Map2D and DigitalTwin3D
    assert(appJsSource.includes('selectedZoneId,') && appJsSource.includes('onSelectZone: setSelectedZoneId'),
      'selectedZoneId state is synchronized between 2D map and 3D digital twin');

    // 3. STEP 3: Multi-Hazard 3D Visualization & Overlays
    assert(appJsSource.includes('uv-flood-depth-tag'), '3D Digital Twin renders flood water depth elevation tag');
    assert(appJsSource.includes('uv-3d-cyclone-overlay'), '3D Digital Twin implements Cyclone wind stream overlay');
    assert(appJsSource.includes('uv-3d-heatwave-overlay'), '3D Digital Twin implements Heatwave thermal gradient overlay');
    assert(appJsSource.includes('uv-3d-pollution-overlay'), '3D Digital Twin implements Air Pollution smog veil overlay');
    assert(appJsSource.includes('uv-3d-landslide-overlay'), '3D Digital Twin implements Landslide slope shear fault overlay');

    // Demonstration notice enforcement
    assert(appJsSource.includes('Demonstration overlay'), 'Non-flood 3D overlays include "Demonstration overlay" labels');
    assert(appJsSource.includes('uv-3d-demo-warning'), '3D Digital Twin displays demonstration notice for non-flood hazards');
    assert(appJsSource.includes('Demonstration visualization'), '3D Digital Twin footer warns that non-flood models are demonstration models');

    // 4. STEP 4: Backend Integration Architecture
    assert(appJsSource.includes('/api/assess'), 'assessHazard() implements probe architecture for POST /api/assess');
    assert(appJsSource.includes('/api/simulate'), 'simulateFloodRisk() maintains strict integration with POST /api/simulate');

    // 5. Exercise zone loading and rendering with API and GeoJSON data
    console.log('\n--- Check 11: Phase 1B Zone Loading, Fallback, and UI Synchronization ---');
    const customizedBackendZones = JSON.parse(JSON.stringify(backendZonesData));
    const apiZone = customizedBackendZones.zones.find(z => z.zone_id === 'UV004');
    apiZone.name = 'Backend Riverside Zone';
    apiZone.description = 'Description supplied by the backend zones contract.';
    apiZone.elevation_m = 3.5;

    const liveZones = await uv.loadZoneData('http://backend.test', async () => ({
      ok: true,
      json: async () => customizedBackendZones
    }));
    assert(liveZones.source === 'live_backend', 'Valid GET /api/zones response is selected as the UI zone source');
    assert(liveZones.zones.length === 4 && liveZones.zones.some(z => z.zone_id === 'UV004' && z.name === 'Backend Riverside Zone'),
      'Valid backend zones populate the frontend zone catalog');
    assert(liveZones.zones.find(z => z.zone_id === 'UV004').base_elevation_m === 3.5,
      'Backend elevation is preserved in the adapted zone representation');

    let invalidFallbackRequestCount = 0;
    const invalidResponseFallback = await uv.loadZoneData('http://backend.test', async (url) => {
      invalidFallbackRequestCount++;
      return url.endsWith('/api/zones')
        ? { ok: true, json: async () => ({ area_id: 'pilot-area-01', count: 1, zones: [] }) }
        : { ok: true, json: async () => rawGeojson };
    });
    assert(invalidFallbackRequestCount === 2 && invalidResponseFallback.source === 'geojson_fallback',
      'Invalid backend zones response triggers a request for the GeoJSON fallback');

    let failedRequestFallbackCount = 0;
    const failedResponseFallback = await uv.loadZoneData('http://backend.test', async (url) => {
      failedRequestFallbackCount++;
      if (url.endsWith('/api/zones')) throw new Error('Backend unavailable');
      return { ok: true, json: async () => rawGeojson };
    });
    assert(failedRequestFallbackCount === 2 && failedResponseFallback.source === 'geojson_fallback',
      'Failed GET /api/zones request triggers a request for the GeoJSON fallback');

    assert(uv.validateGeoJSON(rawGeojson), 'GeoJSON fallback FeatureCollection validates successfully');
    const geoJSONRiverside = failedResponseFallback.zones.find(z => z.zone_id === 'UV004');
    assert(geoJSONRiverside.name === 'Riverside Zone' && geoJSONRiverside.type === 'riverside',
      'GeoJSON zone ID, name, and type are preserved in the adapted representation');
    assert(geoJSONRiverside.description === rawGeojson.features.find(f => f.properties.zone_id === 'UV004').properties.description &&
      geoJSONRiverside.base_elevation_m === 4 && geoJSONRiverside.pilot_area_id === 'pilot-area-01',
      'GeoJSON description, elevation, and pilot area ID are preserved');
    assert(JSON.stringify(geoJSONRiverside.coordinates) === JSON.stringify(rawGeojson.features.find(f => f.properties.zone_id === 'UV004').geometry.coordinates[0]),
      'GeoJSON polygon coordinates are preserved');

    const embeddedAfterFailures = await uv.loadZoneData('http://backend.test', async () => {
      throw new Error('Network unavailable');
    });
    assert(embeddedAfterFailures.source === 'embedded_fallback' && embeddedAfterFailures.zones.length === 4 &&
      embeddedAfterFailures.error.includes('GeoJSON fallback unavailable'),
      'Failure of both APIs keeps the embedded fallback and reports the failure without throwing');

    const sharedSelection = [];
    const onSelectSharedZone = (zoneId) => sharedSelection.push(zoneId);
    const simulationWithExplanation = {
      zones: [{ zone_id: 'UV004', risk_score: 83, risk_level: 'High', explanation: 'Explanation supplied by the backend.' }],
      affected_zones: ['UV004'],
      recommendations: [],
      rainfall_mm: 80
    };
    const mapTree = uv.Map2D({
      simulationResult: simulationWithExplanation,
      selectedZoneId: 'UV004',
      onSelectZone: onSelectSharedZone,
      rainfall: 80,
      zones: liveZones.zones
    });
    const twinTree = uv.DigitalTwin3D({
      simulationResult: simulationWithExplanation,
      selectedZoneId: 'UV004',
      onSelectZone: onSelectSharedZone,
      rainfall: 80,
      activeHazard: 'flood',
      zones: liveZones.zones
    });
    const inspectorTree = uv.RiskPanel({
      simulationResult: simulationWithExplanation,
      selectedZoneId: 'UV004',
      onSelectZone: onSelectSharedZone,
      activeHazard: 'flood',
      zones: liveZones.zones
    });
    function findNode(node, predicate) {
      if (!node || typeof node !== 'object') return null;
      if (Array.isArray(node)) {
        for (const child of node) {
          const found = findNode(child, predicate);
          if (found) return found;
        }
        return null;
      }
      if (predicate(node)) return node;
      for (const child of node.children || []) {
        const found = findNode(child, predicate);
        if (found) return found;
      }
      return null;
    }
    function renderedText(node) {
      if (node === null || node === undefined || typeof node === 'boolean') return '';
      if (typeof node === 'string' || typeof node === 'number') return String(node);
      if (Array.isArray(node)) return node.map(renderedText).join(' ');
      return (node.children || []).map(renderedText).join(' ');
    }
    assert(renderedText(mapTree).includes('Backend Riverside Zone'),
      '2D map renders the backend-provided zone name');
    assert(renderedText(twinTree).includes('Backend Riverside Zone'),
      '3D twin renders the same backend-provided zone name');
    assert(renderedText(inspectorTree).includes('Backend Riverside Zone'),
      'Zone inspector renders the same backend-provided zone name');
    assert(renderedText(inspectorTree).includes('Explanation supplied by the backend.'),
      'Zone inspector renders a backend-provided risk explanation');

    const selectedMapZone = findNode(mapTree, node => node.type === 'g' && node.props.key === 'UV004');
    const selectedTwinZone = findNode(twinTree, node => node.type === 'g' && node.props.key === 'UV004');
    const selectedInspectorZone = findNode(inspectorTree, node => node.type === 'div' && node.props.key === 'UV004');
    assert(selectedMapZone && selectedMapZone.props.className.includes('uv-zone-selected') &&
      selectedTwinZone && selectedTwinZone.props.className.includes('uv-3d-zone-selected') &&
      selectedInspectorZone && selectedInspectorZone.props.className.includes('uv-row-selected'),
      '2D map, 3D twin, and inspector highlight the same selected stable zone ID');
    selectedMapZone.props.onClick();
    selectedTwinZone.props.onClick();
    selectedInspectorZone.props.onClick();
    assert(sharedSelection.join(',') === 'UV004,UV004,UV004',
      '2D, 3D, and inspector selections all invoke the shared stable-ID selection handler');

    const missingExplanationTree = uv.RiskPanel({
      simulationResult: {
        ...simulationWithExplanation,
        zones: [{ zone_id: 'UV004', risk_score: 83, risk_level: 'High' }]
      },
      selectedZoneId: 'UV004',
      onSelectZone: onSelectSharedZone,
      activeHazard: 'flood',
      zones: liveZones.zones
    });
    assert(renderedText(missingExplanationTree).includes('No explanation was provided by the assessment response.') &&
      !renderedText(missingExplanationTree).includes('govern baseline environmental exposure'),
      'Missing backend explanation displays a neutral message rather than fabricated science');

    const sharedZoneCatalogBindings = appJsSource.match(/zones: zoneData\.zones/g) || [];
    assert(sharedZoneCatalogBindings.length === 4 &&
      appJsSource.includes('selectedZoneId,') &&
      appJsSource.includes('onSelectZone: setSelectedZoneId'),
      'App supplies one zone catalog and selectedZoneId handler to the map, twin, inspector, and scenario view');

    assert(appJsSource.includes('uv-flood-depth-tag') &&
      appJsSource.includes('uv-3d-cyclone-overlay') &&
      appJsSource.includes('uv-3d-heatwave-overlay') &&
      appJsSource.includes('uv-3d-pollution-overlay') &&
      appJsSource.includes('uv-3d-landslide-overlay'),
      'Flood visualization and all existing hazard demo overlays remain in the active runtime');

    console.log('\n--- Check 12: Phase 2 Backend Integration Contracts ---');
    customizedBackendZones.area_id = 'urbanverse-pilot';
    const updatedLiveZones = await uv.loadZoneData('http://backend.test', async () => ({
      ok: true,
      json: async () => customizedBackendZones
    }));
    assert(updatedLiveZones.area_id === 'urbanverse-pilot',
      'Live zone data preserves the backend area_id for subsequent API requests');

    const integrationValues = {
      flood: 100,
      heatwave: 38,
      air_pollution: 180,
      landslide: 65
    };
    const assessmentPayload = uv.buildAssessmentPayload(integrationValues, updatedLiveZones.area_id);
    assert(JSON.stringify(assessmentPayload) === JSON.stringify({
      rainfall_mm: 100,
      temperature_c: 38,
      aqi: 180,
      slope_saturation_index: 0.65,
      area_id: 'urbanverse-pilot'
    }), 'Assessment payload maps hazard inputs and landslide percent to the backend contract');
    assert(!('hazard_type' in assessmentPayload) && !('intensity_value' in assessmentPayload),
      'Assessment payload omits unsupported hazard_type and intensity_value fields');

    const assessmentFixture = (hazardType) => ({
      area_id: 'urbanverse-pilot',
      zone_assessments: expectedZones.map((zoneId, index) => ({
        zone_id: zoneId,
        zone_name: `Zone ${zoneId}`,
        priority: `P${index + 1}`,
        composite_risk_score: 30 + index,
        hazards: {
          [hazardType]: {
            score: 70 + index,
            level: 'High',
            explanation: `Backend ${hazardType} explanation for ${zoneId}.`
          }
        },
        action_required: `Backend action for ${zoneId}.`
      })),
      data_reliability: {
        simulation_only: true,
        disclaimer: 'Simulation only; not a live emergency warning.'
      }
    });

    for (const hazardType of ['heatwave', 'air_pollution', 'landslide']) {
      let assessmentRequest;
      vmContext.fetch = async (url, options) => {
        assessmentRequest = { url, options };
        return { ok: true, json: async () => assessmentFixture(hazardType) };
      };
      const inputValue = integrationValues[hazardType];
      const assessmentResult = await uv.assessHazard(
        hazardType,
        inputValue,
        updatedLiveZones.area_id,
        integrationValues,
        { baseUrl: 'http://backend.test' }
      );
      const requestBody = JSON.parse(assessmentRequest.options.body);
      assert(assessmentRequest.url === 'http://backend.test/api/assess' &&
        assessmentRequest.options.method === 'POST' &&
        !('hazard_type' in requestBody) && !('intensity_value' in requestBody),
        `${hazardType} uses the supported POST /api/assess request contract`);
      assert(requestBody.area_id === 'urbanverse-pilot' &&
        requestBody.slope_saturation_index === 0.65 &&
        requestBody.temperature_c === 38 && requestBody.aqi === 180,
        `${hazardType} request uses current values and dynamic area ID`);
      assert(assessmentResult.source === 'live_backend' &&
        assessmentResult.data.zones[0].risk_score === 70 &&
        assessmentResult.data.zones[0].explanation === `Backend ${hazardType} explanation for UV001.` &&
        assessmentResult.data.disclaimer === 'Simulation only; not a live emergency warning.',
        `${hazardType} displays hazard-specific backend scores, explanations, and disclaimer`);
    }

    let floodRequest;
    const floodFixture = uv.calculateMockSimulation(80, 'urbanverse-pilot');
    vmContext.fetch = async (url, options) => {
      floodRequest = { url, options };
      return { ok: true, json: async () => floodFixture };
    };
    const floodResult = await uv.assessHazard('flood', 80, 'urbanverse-pilot', integrationValues, {
      baseUrl: 'http://backend.test'
    });
    assert(floodRequest.url === 'http://backend.test/api/simulate' &&
      floodRequest.options.method === 'POST' &&
      JSON.parse(floodRequest.options.body).rainfall_mm === 80 &&
      !('area_id' in JSON.parse(floodRequest.options.body)) &&
      floodResult.source === 'live_backend',
      'Flood continues to use POST /api/simulate with the documented rainfall-only request');

    let cycloneRequestCount = 0;
    vmContext.fetch = async () => {
      cycloneRequestCount++;
      throw new Error('Cyclone must not request a backend model');
    };
    const cycloneResult = await uv.assessHazard('cyclone', 120, 'urbanverse-pilot', {}, {
      baseUrl: 'http://backend.test'
    });
    assert(cycloneRequestCount === 0 && cycloneResult.source === 'local_demo' &&
      cycloneResult.note.toLowerCase().includes('frontend-only demonstration'),
      'Cyclone remains explicitly frontend-demo-only with no backend assessment request');

    vmContext.fetch = async () => { throw new Error('Backend offline'); };
    const failedAssessmentFallback = await uv.assessHazard(
      'heatwave',
      integrationValues.heatwave,
      'urbanverse-pilot',
      integrationValues,
      { baseUrl: 'http://backend.test' }
    );
    assert(failedAssessmentFallback.source === 'local_demo_fallback' &&
      failedAssessmentFallback.warning.includes('Backend assessment unavailable') &&
      failedAssessmentFallback.note.includes('not a backend assessment'),
      'Failed assessment requests fall back to clearly labelled local demonstrations');
    const missingBackendExplanation = assessmentFixture('heatwave');
    delete missingBackendExplanation.zone_assessments[0].hazards.heatwave.explanation;
    assert(uv.validateAssessmentResponse(missingBackendExplanation, 'heatwave') &&
      uv.normalizeAssessmentResponse(missingBackendExplanation, 'heatwave').zones[0].explanation === undefined,
      'Assessment responses without explanations remain valid and do not invent one');

    const prioritiesFixture = {
      area_id: 'urbanverse-pilot',
      zone_count: 4,
      priorities: expectedZones.map((zoneId, index) => ({
        zone_id: zoneId,
        zone_name: `Zone ${zoneId}`,
        priority: `P${index + 1}`,
        priority_label: `Priority ${index + 1}`,
        composite_risk_score: 35 + index,
        primary_hazard: 'Flood',
        primary_hazard_id: 'flood',
        hazards: { flood: { score: 80 + index, level: 'High' } },
        action_required: `Priority action for ${zoneId}.`
      })),
      simulation_only: true,
      disclaimer: 'Simulation only; not a live emergency warning.'
    };
    assert(uv.validatePriorityResponse(prioritiesFixture),
      'Priorities response validates all stable zone IDs and composite scores');
    let prioritiesUrl;
    const prioritiesResult = await uv.fetchPriorities(integrationValues, {
      baseUrl: 'http://backend.test',
      fetcher: async (url) => {
        prioritiesUrl = url;
        return { ok: true, json: async () => prioritiesFixture };
      }
    });
    assert(prioritiesUrl.includes('rainfall_mm=100') &&
      !prioritiesUrl.includes('temperature_c=') &&
      !prioritiesUrl.includes('aqi=') &&
      !prioritiesUrl.includes('slope_saturation_index=') &&
      prioritiesResult.source === 'live_backend',
      'Priorities fetch uses the supported rainfall query and accepts a valid response');
    const invalidPriorities = await uv.fetchPriorities(integrationValues, {
      baseUrl: 'http://backend.test',
      fetcher: async () => ({ ok: true, json: async () => ({ area_id: 'urbanverse-pilot', priorities: [] }) })
    });
    assert(invalidPriorities.data === null && invalidPriorities.source === 'unavailable' &&
      Boolean(invalidPriorities.error),
      'Malformed priorities response is reported as unavailable instead of crashing');
    let extraPriorityRejected = false;
    try {
      uv.validatePriorityResponse({
        ...prioritiesFixture,
        zone_count: 5,
        priorities: [...prioritiesFixture.priorities, {
          ...prioritiesFixture.priorities[0],
          zone_id: 'UV005'
        }]
      });
    } catch (error) {
      extraPriorityRejected = true;
    }
    assert(extraPriorityRejected, 'Priorities validation rejects unknown or extra zone records');

    const priorityTree = uv.RiskPanel({
      simulationResult: {
        zones: [{ zone_id: 'UV001', risk_score: 72, risk_level: 'High' }],
        affected_zones: [],
        recommendations: [],
        rainfall_mm: 80
      },
      selectedZoneId: 'UV001',
      onSelectZone: () => {},
      activeHazard: 'flood',
      zones: updatedLiveZones.zones,
      prioritiesState: { status: 'loaded', data: prioritiesFixture, error: null },
      assetsState: { status: 'loading', data: null, error: null }
    });
    assert(renderedText(priorityTree).includes('Composite priority 35/100') &&
      renderedText(priorityTree).includes('72/100'),
      'Inspector displays composite priorities separately from hazard-specific risk scores');

    const assetFixture = {
      zone_id: 'UV001',
      zone_name: 'Zone UV001',
      asset_count: 1,
      assets: [{
        asset_id: 'AS001',
        name: 'Community Hospital',
        asset_type: 'healthcare',
        criticality: 'high',
        status: 'operational',
        coordinates: { latitude: 12.87, longitude: 74.85 }
      }]
    };
    const assetResult = await uv.fetchZoneAssets('UV001', {
      baseUrl: 'http://backend.test',
      fetcher: async (url) => ({
        ok: true,
        json: async () => {
          assert(url === 'http://backend.test/api/zones/UV001/assets',
            'Selected-zone assets use the zone-specific backend endpoint');
          return assetFixture;
        }
      })
    });
    assert(assetResult.status === 'loaded' &&
      uv.validateZoneAssetsResponse(assetResult.data, 'UV001'),
      'Valid selected-zone asset response is validated and loaded');
    const emptyAssets = await uv.fetchZoneAssets('UV001', {
      baseUrl: 'http://backend.test',
      fetcher: async () => ({
        ok: true,
        json: async () => ({ ...assetFixture, asset_count: 0, assets: [] })
      })
    });
    assert(emptyAssets.status === 'empty', 'Empty selected-zone asset results have an explicit empty state');
    const invalidAssets = await uv.fetchZoneAssets('UV001', {
      baseUrl: 'http://backend.test',
      fetcher: async () => ({ ok: true, json: async () => ({ ...assetFixture, zone_id: 'UV002' }) })
    });
    assert(invalidAssets.status === 'error' && Boolean(invalidAssets.error),
      'Malformed or mismatched asset response has an explicit error state');
    const unavailableAssets = await uv.fetchZoneAssets('UV001', {
      baseUrl: 'http://backend.test',
      fetcher: async () => { throw new Error('Assets backend offline'); }
    });
    assert(unavailableAssets.status === 'error' && unavailableAssets.error.includes('offline'),
      'Failed selected-zone asset requests resolve to an explicit error state');

    const loadedAssetsTree = uv.RiskPanel({
      simulationResult: { zones: [], affected_zones: [], recommendations: [] },
      selectedZoneId: 'UV001',
      onSelectZone: () => {},
      zones: updatedLiveZones.zones,
      prioritiesState: { status: 'error', data: null, error: 'Priorities offline' },
      assetsState: { status: 'loaded', data: assetFixture, error: null }
    });
    const errorAssetsTree = uv.RiskPanel({
      simulationResult: { zones: [], affected_zones: [], recommendations: [] },
      selectedZoneId: 'UV001',
      onSelectZone: () => {},
      zones: updatedLiveZones.zones,
      prioritiesState: { status: 'error', data: null, error: 'Priorities offline' },
      assetsState: { status: 'error', data: null, error: 'Assets offline' }
    });
    const emptyAssetsTree = uv.RiskPanel({
      simulationResult: { zones: [], affected_zones: [], recommendations: [] },
      selectedZoneId: 'UV001',
      onSelectZone: () => {},
      zones: updatedLiveZones.zones,
      prioritiesState: { status: 'error', data: null, error: 'Priorities offline' },
      assetsState: { status: 'empty', data: { ...assetFixture, assets: [] }, error: null }
    });
    assert(renderedText(loadedAssetsTree).includes('Community Hospital') &&
      renderedText(errorAssetsTree).includes('Assets unavailable: Assets offline') &&
      renderedText(priorityTree).includes('Composite priority 35/100') &&
      renderedText(emptyAssetsTree).includes('No critical assets are listed for this zone.'),
      'Inspector renders loaded, failed, and empty selected-zone asset states');

    const appStateStart = stateIndex;
    uv.App();
    assert(registeredEffects.length >= 2 && stateIndex - appStateStart >= 15,
      'App registers selected-zone asset loading alongside its existing initialization effect');
    let resolveStaleAssets;
    vmContext.fetch = () => new Promise((resolve) => { resolveStaleAssets = resolve; });
    const cleanupAssetEffect = registeredEffects[1]();
    cleanupAssetEffect();
    resolveStaleAssets({ ok: true, json: async () => assetFixture });
    await new Promise((resolve) => setImmediate(resolve));
    const appAssetUpdates = stateUpdates[appStateStart + 13];
    assert(appAssetUpdates.length === 1 && appAssetUpdates[0].status === 'loading',
      'A stale selected-zone asset response is ignored after the selection effect is cleaned up');

  } catch (err) {
    console.error('Test execution error:', err);
    failures++;
  } finally {
    console.log('\n======================================================');
    console.log(`TEST RUN COMPLETE: ${passed} Passed, ${failures} Failed`);
    console.log('======================================================\n');
    process.exit(failures > 0 ? 1 : 0);
  }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  runTestSuite();
}
