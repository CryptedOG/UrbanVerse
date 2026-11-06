/**
 * UrbanVerse Root Application Component
 * Phase 1A: Multi-Hazard Urban Intelligence & Civilian Resilience Platform
 * Coordinates state, multi-hazard selection, simulation triggers, map/digital-twin switching.
 */

import { Header } from './components/Header.js';
import { Controls } from './components/Controls.js';
import { Map2D } from './components/Map2D.js';
import { DigitalTwin3D } from './components/DigitalTwin3D.js';
import { RiskPanel } from './components/RiskPanel.js';
import { Recommendations } from './components/Recommendations.js';
import { ScenarioLab } from './components/ScenarioLab.js';
import { checkBackendHealth, assessHazard } from './api/client.js';
import { HAZARD_TYPES } from './data/hazardDefinitions.js';

export function App() {
  // Step 4: Safe State Management (Flood is default active hazard)
  const [activeHazard, setActiveHazard] = React.useState('flood');

  // Independent parameter state per hazard so switching does NOT overwrite rainfall
  const [hazardValues, setHazardValues] = React.useState({
    flood: 80, // Default 80 mm benchmark test preserved
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
  const [viewMode, setViewMode] = React.useState('2d'); // '2d' | '3d'
  const [selectedZoneId, setSelectedZoneId] = React.useState('UV004'); // Focus on low-lying riparian zone
  const [backendStatus, setBackendStatus] = React.useState({ connected: false, error: 'Checking...' });
  const [isMockMode, setIsMockMode] = React.useState(false);
  const [apiSourceNote, setApiSourceNote] = React.useState('');

  // Check health and run initial baseline flood simulation (80 mm) on mount
  React.useEffect(() => {
    async function init() {
      const health = await checkBackendHealth();
      setBackendStatus(health);
      await executeAssessment('flood', 80, isMockMode);
    }
    init();
  }, []);

  async function checkHealth() {
    const health = await checkBackendHealth();
    setBackendStatus(health);
  }

  async function executeAssessment(hazardType, paramVal, forceMock) {
    setLoading(true);
    setError(null);

    try {
      const result = await assessHazard(hazardType, paramVal, 'pilot-area-01', {
        forceMock
      });

      setSimulationResult(result.data);
      setLastRunValues((prev) => ({ ...prev, [hazardType]: paramVal }));
      setApiSourceNote(result.note || (result.source === 'live_backend' ? 'Live FastAPI Backend' : 'Contract Model'));
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

  // Rainfall value for 2D/3D flood rendering is preserved strictly from hazardValues.flood
  const displayRainfall = hazardValues.flood;

  return React.createElement(
    'div',
    { className: 'uv-app-container' },
    // Global Header
    React.createElement(Header, {
      backendStatus,
      onRefreshHealth: checkHealth,
      isMockMode,
      onToggleMockMode: handleToggleMockMode
    }),

    // Error Alert Banner
    error &&
      React.createElement(
        'div',
        { className: 'uv-error-banner' },
        React.createElement('span', null, '❌ Assessment Error: '),
        error
      ),

    // Active Source Feedback Pill
    React.createElement(
      'div',
      { className: 'uv-source-bar' },
      React.createElement(
        'span',
        { className: 'uv-source-tag' },
        `Active Mode: ${currentHazardDef.icon} ${currentHazardDef.name} • Engine: ${apiSourceNote || 'Initializing...'}`
      ),
      simulationResult &&
        React.createElement(
          'span',
          { className: 'uv-source-details' },
          `Area: ${simulationResult.area_id} • Input: ${currentVal} ${currentHazardDef.unit} • Zones Evaluated: ${simulationResult.zones.map(z => z.zone_id).join(', ')}`
        )
    ),

    // Step 2 & 3: Multi-Hazard Controls Section
    React.createElement(Controls, {
      activeHazard,
      onHazardChange: handleHazardChange,
      currentValue: currentVal,
      onValueChange: handleValueChange,
      rainfall: hazardValues.flood, // Backward compatibility prop
      onRainfallChange: (v) => setHazardValues((p) => ({ ...p, flood: v })),
      onRunSimulation: handleRunSimulation,
      loading,
      viewMode,
      onViewModeChange: setViewMode,
      lastRunValue: lastVal,
      lastRunRainfall: lastRunValues.flood
    }),

    // Main Workspace Grid
    React.createElement(
      'main',
      { className: 'uv-main-grid' },
      // Left Viewport (2D GIS Map or 3D Digital Twin)
      React.createElement(
        'div',
        { className: 'uv-viewport-col' },
        viewMode === '2d'
          ? React.createElement(Map2D, {
              simulationResult,
              selectedZoneId,
              onSelectZone: setSelectedZoneId,
              rainfall: displayRainfall
            })
          : React.createElement(DigitalTwin3D, {
              simulationResult,
              selectedZoneId,
              onSelectZone: setSelectedZoneId,
              rainfall: displayRainfall
            })
      ),

      // Right Intelligence Panels
      React.createElement(
        'div',
        { className: 'uv-sidebar-col' },
        React.createElement(RiskPanel, {
          simulationResult,
          selectedZoneId,
          onSelectZone: setSelectedZoneId,
          activeHazard
        }),
        React.createElement(Recommendations, {
          simulationResult
        })
      )
    ),

    React.createElement(ScenarioLab),

    // Footer
    React.createElement(
      'footer',
      { className: 'uv-footer' },
      React.createElement(
        'p',
        null,
        'UrbanVerse • Multi-Hazard Urban Resilience Digital Twin (Flood, Cyclone, Heatwave, Air Quality, Landslide) • Member 2'
      )
    )
  );
}
