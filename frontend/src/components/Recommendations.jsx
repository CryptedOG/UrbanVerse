/**
 * UrbanVerse Emergency Recommendations Component
 * Surfaces actionable mitigation procedures, response directives, and affected zone lists
 * directly from the simulation response contract.
 */

export function Recommendations({ simulationResult }) {
  const recommendations = (simulationResult && simulationResult.recommendations) || [];
  const affectedZones = (simulationResult && simulationResult.affected_zones) || [];

  return React.createElement(
    'section',
    { className: 'uv-card uv-recommendations-card' },
    React.createElement(
      'div',
      { className: 'uv-recommendations-header' },
      React.createElement('h3', { className: 'uv-card-title' }, 'Emergency Response Directives'),
      React.createElement(
        'span',
        { className: 'uv-badge uv-badge-alert' },
        'AI Resilience Guidance'
      )
    ),

    // Affected Zones Alert Strip
    React.createElement(
      'div',
      { className: 'uv-affected-strip' },
      React.createElement('span', { className: 'uv-strip-label' }, 'Priority Impact Zones:'),
      affectedZones.length > 0
        ? React.createElement(
            'div',
            { className: 'uv-affected-pills' },
            affectedZones.map((zId) =>
              React.createElement(
                'span',
                { key: zId, className: 'uv-affected-pill' },
                `⚠️ ${zId.toUpperCase()}`
              )
            )
          )
        : React.createElement(
            'span',
            { className: 'uv-no-affected' },
            'No zones currently exceed critical hazard thresholds.'
          )
    ),

    // Action Directives List
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
        : React.createElement(
            'div',
            { className: 'uv-recs-empty' },
            'Run a simulation to generate tailored emergency advisories based on precipitation intensity.'
          )
    ),

    // Operational Standard Protocol Note
    React.createElement(
      'div',
      { className: 'uv-protocol-box' },
      React.createElement('strong', null, 'Disaster Protocol Note: '),
      React.createElement(
        'span',
        null,
        'Evacuation staging coordinates default to Kadri Hills Ridge (Zone D) as safe elevated ground above the 35m flood contour.'
      )
    )
  );
}
