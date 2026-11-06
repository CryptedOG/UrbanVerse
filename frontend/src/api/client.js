/**
 * UrbanVerse API Client
 * Connects to Member 1's FastAPI backend (POST /api/simulate & GET /api/health)
 * and safely expands to support multi-hazard assessment without hitting unconfirmed backend endpoints.
 */

import { calculateMockSimulation, calculateHazardAssessment } from './mockData.js';

export const DEFAULT_API_BASE_URL = 'http://localhost:8000';

/**
 * Check backend health (GET /api/health)
 */
export async function checkBackendHealth(baseUrl = DEFAULT_API_BASE_URL) {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2000);

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
    return { connected: false, data: null, error: `HTTP ${res.status}: ${res.statusText}` };
  } catch (err) {
    return {
      connected: false,
      data: null,
      error: err.name === 'AbortError' ? 'Backend health check timed out (2s)' : 'Backend unreachable'
    };
  }
}

/**
 * Validate that response strictly adheres to the shared integration contract
 */
export function validateContractResponse(data) {
  if (!data || typeof data !== 'object') {
    throw new Error('Simulation response must be a JSON object');
  }

  if (typeof data.area_id !== 'string') {
    throw new Error('Contract violation: area_id must be a string');
  }

  if (typeof data.rainfall_mm !== 'number') {
    throw new Error('Contract violation: rainfall_mm must be a number');
  }

  if (!Array.isArray(data.zones) || data.zones.length === 0) {
    throw new Error('Contract violation: zones must be a non-empty array');
  }

  for (const z of data.zones) {
    if (!z.zone_id || typeof z.zone_id !== 'string') {
      throw new Error('Contract violation: zone.zone_id must be a string');
    }
    if (typeof z.risk_score !== 'number' || z.risk_score < 0 || z.risk_score > 100) {
      throw new Error(`Contract violation: zone.risk_score must be between 0 and 100, got ${z.risk_score}`);
    }
    if (!['Low', 'Medium', 'High'].includes(z.risk_level)) {
      throw new Error(`Contract violation: zone.risk_level must be exactly "Low", "Medium", or "High", got "${z.risk_level}"`);
    }
  }

  if (!Array.isArray(data.affected_zones)) {
    throw new Error('Contract violation: affected_zones must be an array');
  }

  if (!Array.isArray(data.recommendations)) {
    throw new Error('Contract violation: recommendations must be an array');
  }

  if (typeof data.simulation_only !== 'boolean') {
    throw new Error('Contract violation: simulation_only must be a boolean');
  }

  return true;
}

/**
 * Trigger flood simulation (POST /api/simulate) - Preserved exactly as existing
 */
export async function simulateFloodRisk(rainfall_mm, area_id = 'pilot-area-01', options = {}) {
  const { baseUrl = DEFAULT_API_BASE_URL, forceMock = false } = options;

  const requestPayload = {
    rainfall_mm: Number(rainfall_mm),
    area_id: String(area_id)
  };

  if (forceMock) {
    const mock = calculateMockSimulation(requestPayload.rainfall_mm, requestPayload.area_id);
    return { data: mock, source: 'mock', note: 'Local mock simulation (preview mode)' };
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3500);

    const res = await fetch(`${baseUrl}/api/simulate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(requestPayload),
      signal: controller.signal
    });
    clearTimeout(timeoutId);

    if (!res.ok) {
      throw new Error(`Backend error HTTP ${res.status}: ${res.statusText}`);
    }

    const json = await res.json();
    validateContractResponse(json);

    return {
      data: json,
      source: 'live_backend',
      note: 'Live response from Member 1 FastAPI backend'
    };
  } catch (err) {
    const mockFallback = calculateMockSimulation(requestPayload.rainfall_mm, requestPayload.area_id);
    return {
      data: mockFallback,
      source: 'mock_fallback',
      warning: `FastAPI backend unavailable (${err.message}). Showing contract-compliant mock data.`,
      note: 'Contract Mock Fallback'
    };
  }
}

/**
 * Multi-Hazard Assessment Dispatcher (Phase 1A)
 * Safely routes Flood to POST /api/simulate, and other hazards to local demonstration models
 */
export async function assessHazard(hazardType = 'flood', paramValue, area_id = 'pilot-area-01', options = {}) {
  if (hazardType === 'flood') {
    return simulateFloodRisk(paramValue, area_id, options);
  }

  // Other hazards run via local demonstration model until Phase 2 backend integration
  const demoResult = calculateHazardAssessment(hazardType, paramValue, area_id);
  validateContractResponse(demoResult);

  return {
    data: demoResult,
    source: 'local_demo',
    note: `Local Demonstration Model (${hazardType.toUpperCase()} - Backend integration pending Phase 2)`
  };
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    DEFAULT_API_BASE_URL,
    checkBackendHealth,
    validateContractResponse,
    simulateFloodRisk,
    assessHazard
  };
}
