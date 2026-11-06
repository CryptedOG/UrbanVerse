/**
 * UrbanVerse 2D GIS Map Component
 * Visualizes the 4 actual GIS zones from data/pilot-area.geojson (UV001 - UV004)
 * with accurate coordinate projection, topological boundaries, and dynamic risk colors.
 */

import { MANGALORE_ZONES, PILOT_AREA_METADATA } from '../data/mangalorePilotZones.js';

export function Map2D({
  simulationResult,
  selectedZoneId,
  onSelectZone,
  rainfall
}) {
  const zoneResults = (simulationResult && simulationResult.zones) || [];
  const affectedZoneIds = (simulationResult && simulationResult.affected_zones) || [];

  // Helper to get risk data for a zone (with legacy zone-a..d fallback if needed)
  function getZoneStatus(zoneId) {
    let found = zoneResults.find((z) => z.zone_id === zoneId);
    
    // Backwards compatibility with initial prototype zone-a..d aliases
    if (!found) {
      const aliasMap = { 'UV004': 'zone-a', 'UV003': 'zone-b', 'UV002': 'zone-c', 'UV001': 'zone-d' };
      const legacyId = aliasMap[zoneId];
      if (legacyId) {
        found = zoneResults.find((z) => z.zone_id === legacyId);
      }
    }

    if (!found) {
      return { score: '--', level: 'Pending', color: '#64748b', fill: 'rgba(100, 116, 139, 0.25)' };
    }
    if (found.risk_level === 'High') {
      return { score: found.risk_score, level: 'High', color: '#ef4444', fill: 'rgba(239, 68, 68, 0.65)' };
    }
    if (found.risk_level === 'Medium') {
      return { score: found.risk_score, level: 'Medium', color: '#f59e0b', fill: 'rgba(245, 158, 11, 0.60)' };
    }
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
          `CRS: EPSG:4326 • Bounds: [${PILOT_AREA_METADATA.bbox.join(', ')}]`
        )
      ),
      // Legend
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
          'Medium Risk (40-69)'
        ),
        React.createElement(
          'div',
          { className: 'uv-legend-item' },
          React.createElement('span', { className: 'uv-legend-chip uv-chip-low' }),
          'Low Risk (0-39)'
        )
      )
    ),

    React.createElement(
      'div',
      { className: 'uv-svg-container' },
      React.createElement(
        'svg',
        {
          viewBox: '0 0 600 420',
          className: 'uv-gis-svg',
          preserveAspectRatio: 'xMidYMid meet'
        },
        React.createElement(
          'defs',
          null,
          React.createElement(
            'linearGradient',
            { id: 'waterGradient', x1: '0%', y1: '0%', x2: '100%', y2: '100%' },
            React.createElement('stop', { offset: '0%', stopColor: '#0284c7' }),
            React.createElement('stop', { offset: '100%', stopColor: '#0369a1' })
          ),
          React.createElement(
            'linearGradient',
            { id: 'landGradient', x1: '0%', y1: '0%', x2: '100%', y2: '100%' },
            React.createElement('stop', { offset: '0%', stopColor: '#0b1120' }),
            React.createElement('stop', { offset: '100%', stopColor: '#1e293b' })
          )
        ),

        // Base Land Background
        React.createElement('rect', {
          width: '600',
          height: '420',
          fill: 'url(#landGradient)'
        }),

        // River Corridor Adjacent to UV004 Riverside Zone
        React.createElement('path', {
          d: 'M 0,260 Q 50,250 80,270 L 80,370 Q 50,380 0,390 Z',
          fill: 'url(#waterGradient)',
          opacity: '0.85'
        }),
        React.createElement('path', {
          d: 'M 80,370 Q 180,390 300,385 L 300,420 L 0,420 L 0,390 Z',
          fill: 'url(#waterGradient)',
          opacity: '0.9'
        }),

        // Water labels
        React.createElement(
          'text',
          { x: '25', y: '330', className: 'uv-svg-water-label', transform: 'rotate(-90 25,330)' },
          'RIVER CORRIDOR'
        ),

        // Coordinate Grid Axis Lines
        React.createElement('line', { x1: '80', y1: '210', x2: '520', y2: '210', stroke: '#334155', strokeWidth: '1', strokeDasharray: '4 4' }),
        React.createElement('line', { x1: '300', y1: '50', x2: '300', y2: '370', stroke: '#334155', strokeWidth: '1', strokeDasharray: '4 4' }),

        // Compass / Orientation indicator
        React.createElement(
          'g',
          { transform: 'translate(555, 35)' },
          React.createElement('circle', { r: '14', fill: '#0f172a', stroke: '#475569' }),
          React.createElement('text', { y: '-3', textAnchor: 'middle', fill: '#38bdf8', fontSize: '9', fontWeight: 'bold' }, 'N'),
          React.createElement('polygon', { points: '0,-12 3,-4 -3,-4', fill: '#38bdf8' })
        ),

        // Four Actual GIS Zones
        MANGALORE_ZONES.map((zone) => {
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

            // Center Coordinate Marker
            React.createElement('circle', {
              cx: zone.center.x,
              cy: zone.center.y,
              r: '6',
              fill: status.color,
              stroke: '#0f172a',
              strokeWidth: '2'
            }),

            // Zone Title & ID Tag
            React.createElement(
              'text',
              {
                x: zone.center.x,
                y: zone.center.y - 12,
                className: 'uv-zone-label',
                textAnchor: 'middle'
              },
              `${zone.name} (${zone.zone_id})`
            ),

            // Elevation & Risk Score
            React.createElement(
              'text',
              {
                x: zone.center.x,
                y: zone.center.y + 18,
                className: 'uv-zone-score-label',
                textAnchor: 'middle',
                fill: status.color
              },
              status.score !== '--' ? `Risk: ${status.score}/100 • ${status.level} (${zone.base_elevation_m}m)` : `Elev: ${zone.base_elevation_m}m`
            )
          );
        }),

        // Shared Topology Junction Asterisk marker
        React.createElement('circle', { cx: '300', cy: '210', r: '4', fill: '#38bdf8', stroke: '#0f172a', strokeWidth: '1.5' }),
        React.createElement('text', { x: '308', y: '206', fill: '#38bdf8', fontSize: '9', fontFamily: 'monospace' }, 'Junction [74.852°E, 12.865°N]')
      )
    ),

    React.createElement(
      'div',
      { className: 'uv-map-footer' },
      React.createElement(
        'span',
        { className: 'uv-map-hint' },
        '💡 Actual GeoJSON Features: UV001 (NW), UV002 (NE), UV003 (SE), UV004 (SW). Click any zone to inspect.'
      ),
      React.createElement(
        'span',
        { className: 'uv-map-rainfall-ref' },
        `Simulated Rain: ${rainfall} mm`
      )
    )
  );
}
