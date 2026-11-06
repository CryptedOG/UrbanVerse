/**
 * UrbanVerse 3D Digital Twin Component
 * Uses matching 2x2 contiguous GIS topology and elevations from data/pilot-area.geojson:
 * - UV001 (NW): Residential Zone (24m elevation)
 * - UV002 (NE): Commercial Zone (18m elevation)
 * - UV003 (SE): Industrial Zone (10m elevation)
 * - UV004 (SW): Riverside Zone (4m elevation)
 */

import { MANGALORE_ZONES, PILOT_AREA_METADATA } from '../data/mangalorePilotZones.js';

export function DigitalTwin3D({
  simulationResult,
  selectedZoneId,
  onSelectZone,
  rainfall
}) {
  const [pitch, setPitch] = React.useState(60);
  const [yaw, setYaw] = React.useState(35);
  const [zoom, setZoom] = React.useState(1.05);

  const zoneResults = (simulationResult && simulationResult.zones) || [];
  const affectedZoneIds = (simulationResult && simulationResult.affected_zones) || [];

  // Simulated flood water surface height based on rainfall (0 - 300 mm)
  const floodWaterHeight = Math.min(48, (rainfall / 300) * 48);

  function getZoneStatus(zoneId) {
    let found = zoneResults.find((z) => z.zone_id === zoneId);
    if (!found) {
      const aliasMap = { 'UV004': 'zone-a', 'UV003': 'zone-b', 'UV002': 'zone-c', 'UV001': 'zone-d' };
      if (aliasMap[zoneId]) found = zoneResults.find((z) => z.zone_id === aliasMap[zoneId]);
    }

    if (!found) return { score: '--', level: 'Pending', color: '#64748b' };
    if (found.risk_level === 'High') return { score: found.risk_score, level: 'High', color: '#ef4444' };
    if (found.risk_level === 'Medium') return { score: found.risk_score, level: 'Medium', color: '#f59e0b' };
    return { score: found.risk_score, level: 'Low', color: '#10b981' };
  }

  function isZoneAffected(zoneId) {
    if (affectedZoneIds.includes(zoneId)) return true;
    const aliasMap = { 'UV004': 'zone-a', 'UV003': 'zone-b', 'UV002': 'zone-c', 'UV001': 'zone-d' };
    return Boolean(aliasMap[zoneId] && affectedZoneIds.includes(aliasMap[zoneId]));
  }

  // 3D Isometric Projection Helper
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
        React.createElement(
          'p',
          { className: 'uv-card-desc' },
          `Topographical elevation & building-scale flood inundation model • ${PILOT_AREA_METADATA.city}`
        )
      ),
      // 3D Camera Controls
      React.createElement(
        'div',
        { className: 'uv-3d-controls-bar' },
        React.createElement(
          'div',
          { className: 'uv-control-mini' },
          React.createElement('label', null, `Tilt: ${pitch}°`),
          React.createElement('input', {
            type: 'range',
            min: '30',
            max: '85',
            value: pitch,
            onChange: (e) => setPitch(Number(e.target.value))
          })
        ),
        React.createElement(
          'div',
          { className: 'uv-control-mini' },
          React.createElement('label', null, `Rotate: ${yaw}°`),
          React.createElement('input', {
            type: 'range',
            min: '-60',
            max: '90',
            value: yaw,
            onChange: (e) => setYaw(Number(e.target.value))
          })
        ),
        React.createElement(
          'div',
          { className: 'uv-control-mini' },
          React.createElement('label', null, `Zoom: ${zoom.toFixed(1)}x`),
          React.createElement('input', {
            type: 'range',
            min: '0.8',
            max: '1.6',
            step: '0.1',
            value: zoom,
            onChange: (e) => setZoom(Number(e.target.value))
          })
        ),
        React.createElement(
          'button',
          {
            className: 'uv-btn-subtle',
            onClick: () => { setPitch(60); setYaw(35); setZoom(1.05); }
          },
          'Reset'
        )
      )
    ),

    React.createElement(
      'div',
      { className: 'uv-3d-viewport' },
      React.createElement(
        'svg',
        {
          viewBox: '0 0 600 420',
          className: 'uv-3d-svg',
          preserveAspectRatio: 'xMidYMid meet'
        },
        React.createElement(
          'defs',
          null,
          React.createElement(
            'radialGradient',
            { id: 'waterFloodGrad', cx: '50%', cy: '50%', r: '60%' },
            React.createElement('stop', { offset: '0%', stopColor: '#38bdf8', stopOpacity: '0.75' }),
            React.createElement('stop', { offset: '100%', stopColor: '#0284c7', stopOpacity: '0.6' })
          )
        ),

        // Base Sea-Level Plane (Z=0)
        React.createElement('polygon', {
          points: [
            project(40, 40, 0),
            project(430, 40, 0),
            project(430, 360, 0),
            project(40, 360, 0)
          ].map(p => `${p.x},${p.y}`).join(' '),
          fill: '#090d16',
          stroke: '#1e293b',
          strokeWidth: '1.5'
        }),

        // 3D GIS Terrain Blocks (Extruded by real baseline elevation)
        MANGALORE_ZONES.map((zone) => {
          const status = getZoneStatus(zone.zone_id);
          const isSelected = selectedZoneId === zone.zone_id;
          const isAffected = isZoneAffected(zone.zone_id);

          const { origin, width, depth, elevation_base } = zone.isometric_mesh;
          const [ox, oy] = origin;
          const ez = elevation_base;

          const b0 = project(ox, oy, 0);
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
              className: 'uv-3d-zone-group',
              onClick: () => onSelectZone(zone.zone_id)
            },
            // Front Face
            React.createElement('polygon', {
              points: `${t3.x},${t3.y} ${t2.x},${t2.y} ${b2.x},${b2.y} ${b3.x},${b3.y}`,
              fill: '#0f172a',
              stroke: '#334155',
              strokeWidth: '1'
            }),
            // Side Face
            React.createElement('polygon', {
              points: `${t2.x},${t2.y} ${t1.x},${t1.y} ${b1.x},${b1.y} ${b2.x},${b2.y}`,
              fill: '#1e293b',
              stroke: '#334155',
              strokeWidth: '1'
            }),
            // Top Terrain Surface
            React.createElement('polygon', {
              points: `${t0.x},${t0.y} ${t1.x},${t1.y} ${t2.x},${t2.y} ${t3.x},${t3.y}`,
              fill: isSelected ? 'rgba(56, 189, 248, 0.35)' : 'rgba(30, 41, 59, 0.9)',
              stroke: isSelected ? '#38bdf8' : status.color,
              strokeWidth: isSelected ? '2.5' : '1.5'
            }),

            // 3D Buildings
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

            // Zone Floating 3D Label
            React.createElement(
              'text',
              {
                x: t0.x + 15,
                y: t0.y - 8,
                className: 'uv-3d-label',
                fill: status.color
              },
              `${zone.zone_id}: ${zone.name} (${zone.base_elevation_m}m)`
            )
          );
        }),

        // Dynamic 3D Floodwater Surface Plane
        floodWaterHeight > 3 &&
          React.createElement('polygon', {
            points: [
              project(40, 160, floodWaterHeight),
              project(430, 160, floodWaterHeight),
              project(430, 360, floodWaterHeight),
              project(40, 360, floodWaterHeight)
            ].map(p => `${p.x},${p.y}`).join(' '),
            fill: 'url(#waterFloodGrad)',
            stroke: '#38bdf8',
            strokeWidth: '2',
            strokeDasharray: '4 2',
            className: 'uv-flood-plane'
          }),

        floodWaterHeight > 3 &&
          React.createElement(
            'text',
            {
              x: project(50, 240, floodWaterHeight).x,
              y: project(50, 240, floodWaterHeight).y - 8,
              className: 'uv-flood-depth-tag'
            },
            `🌊 Water Level (+${(rainfall * 0.012).toFixed(2)}m surge)`
          )
      )
    ),

    React.createElement(
      'div',
      { className: 'uv-3d-footer' },
      React.createElement(
        'span',
        null,
        `Topography Gradient: UV004 Riverside (4m) ➔ UV003 Industrial (10m) ➔ UV002 Commercial (18m) ➔ UV001 Residential (24m)`
      ),
      React.createElement(
        'span',
        { className: 'uv-3d-flood-note' },
        rainfall > 70
          ? '⚠️ UV004 Riverside Zone and UV003 Industrial Zone inundated.'
          : 'Water level contained within natural drainage gradient.'
      )
    )
  );
}
