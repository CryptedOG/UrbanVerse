/**
 * UrbanVerse RiskPanel Component
 * Displays zone-wise risk scores, risk levels, and detailed GIS zone inspection
 * for the 4 actual GIS zones from data/pilot-area.geojson (UV001 - UV004).
 */

import { MANGALORE_ZONES } from '../data/mangalorePilotZones.js';
import { HAZARD_TYPES } from '../data/hazardDefinitions.js';

export function RiskPanel({
  simulationResult,
  selectedZoneId,
  onSelectZone,
  activeHazard = 'flood'
}) {
  const zoneResults = (simulationResult && simulationResult.zones) || [];
  const affectedZones = (simulationResult && simulationResult.affected_zones) || [];

  const selectedZoneMeta = MANGALORE_ZONES.find((z) => z.zone_id === selectedZoneId) || MANGALORE_ZONES[0];
  
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
    if (level === 'High') return 'uv-badge-high';
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
  const highRiskCount = zoneResults.filter((z) => z.risk_level === 'High').length;

  const currentHazardDef = HAZARD_TYPES[activeHazard] || HAZARD_TYPES.flood;
  const scenarioDisplay = simulationResult
    ? (simulationResult.intensity_value !== undefined
        ? `${simulationResult.intensity_value} ${simulationResult.intensity_unit || currentHazardDef.unit}`
        : `${simulationResult.rainfall_mm} mm`)
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
          `${currentHazardDef.icon} ${currentHazardDef.shortName} • Scenario: ${scenarioDisplay}`
        )
      ),
      React.createElement(
        'span',
        { className: 'uv-badge uv-badge-alert', style: { color: currentHazardDef.color, borderColor: currentHazardDef.color } },
        currentHazardDef.shortName
      )
    ),

    // KPI Summary
    React.createElement(
      'div',
      { className: 'uv-kpi-grid' },
      React.createElement(
        'div',
        { className: 'uv-kpi-item' },
        React.createElement('span', { className: 'uv-kpi-title' }, 'Peak Risk Score'),
        React.createElement(
          'span',
          { className: 'uv-kpi-val', style: { color: getBarColor(maxScore) } },
          zoneResults.length > 0 ? `${maxScore}/100` : '--'
        )
      ),
      React.createElement(
        'div',
        { className: 'uv-kpi-item' },
        React.createElement('span', { className: 'uv-kpi-title' }, 'High-Risk Zones'),
        React.createElement(
          'span',
          { className: `uv-kpi-val ${highRiskCount > 0 ? 'uv-text-high' : 'uv-text-low'}` },
          highRiskCount
        )
      ),
      React.createElement(
        'div',
        { className: 'uv-kpi-item' },
        React.createElement('span', { className: 'uv-kpi-title' }, 'Affected Area Count'),
        React.createElement('span', { className: 'uv-kpi-val' }, affectedZones.length)
      )
    ),

    // Zone-Wise Evaluation List
    React.createElement(
      'div',
      { className: 'uv-zone-list' },
      React.createElement('h4', { className: 'uv-section-subtitle' }, 'Actual GIS Zones Evaluation:'),
      MANGALORE_ZONES.map((zone) => {
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
            React.createElement(
              'div',
              { className: 'uv-zone-meta' },
              `Type: ${zone.type} • Elev: ${zone.base_elevation_m}m`
            )
          ),
          React.createElement(
            'div',
            { className: 'uv-zone-score-col' },
            React.createElement(
              'div',
              { className: 'uv-score-badge-row' },
              React.createElement('span', { className: 'uv-score-num' }, res ? `${score}` : '--'),
              React.createElement(
                'span',
                { className: `uv-badge ${getRiskBadgeClass(level)}` },
                level
              )
            ),
            React.createElement(
              'div',
              { className: 'uv-progress-track' },
              React.createElement('div', {
                className: 'uv-progress-fill',
                style: {
                  width: `${res ? score : 0}%`,
                  backgroundColor: getBarColor(score)
                }
              })
            )
          )
        );
      })
    ),

    // Detailed Selected Zone Inspection Card
    selectedZoneMeta &&
      React.createElement(
        'div',
        { className: 'uv-inspector' },
        React.createElement(
          'div',
          { className: 'uv-inspector-header' },
          React.createElement('span', { className: 'uv-inspector-icon' }, '🔍'),
          React.createElement('strong', null, `Zone Inspection: ${selectedZoneMeta.name} (${selectedZoneMeta.zone_id})`),
          React.createElement(
            'span',
            { className: `uv-badge ${selectedZoneScore ? getRiskBadgeClass(selectedZoneScore.risk_level) : ''}` },
            selectedZoneScore ? `${selectedZoneScore.risk_level} Risk` : 'Pending'
          )
        ),
        React.createElement('p', { className: 'uv-inspector-desc' }, selectedZoneMeta.description),
        React.createElement(
          'div',
          { className: 'uv-inspector-stats' },
          React.createElement('div', null, React.createElement('span', null, 'Baseline Elevation: '), `${selectedZoneMeta.base_elevation_m} m AMSL`),
          React.createElement('div', null, React.createElement('span', null, 'Land Use Category: '), selectedZoneMeta.type),
          React.createElement('div', null, React.createElement('span', null, 'Bounding Box: '), `[${selectedZoneMeta.bbox.join(', ')}]`),
          React.createElement('div', null, React.createElement('span', null, 'Topology Position: '), selectedZoneMeta.zone_id === 'UV001' ? 'North-West (Inland)' : selectedZoneMeta.zone_id === 'UV002' ? 'North-East (Commercial)' : selectedZoneMeta.zone_id === 'UV003' ? 'South-East (Industrial)' : 'South-West (Riparian)')
        )
      )
  );
}
