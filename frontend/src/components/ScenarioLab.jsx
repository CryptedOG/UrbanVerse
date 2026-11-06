/**
 * Scenario Lab
 * Compares two flood rainfall scenarios with the existing simulateFloodRisk path.
 * Uses forceMock so the comparison stays on the local demonstration model
 * and does not replace the dashboard simulation.
 */

import { simulateFloodRisk } from '../api/client.js';
import { MANGALORE_ZONES } from '../data/mangalorePilotZones.js';

const ZONE_ORDER = ['UV001', 'UV002', 'UV003', 'UV004'];

function readRainfall(raw) {
  const n = Number(raw);
  if (!Number.isFinite(n)) return 0;
  return Math.min(300, Math.max(0, Math.round(n)));
}

function zoneResult(simulation, zoneId) {
  if (!simulation || !Array.isArray(simulation.zones)) return null;
  return simulation.zones.find((z) => z.zone_id === zoneId) || null;
}

function levelBadgeClass(level) {
  if (level === 'High') return 'uv-badge uv-badge-high';
  if (level === 'Medium') return 'uv-badge uv-badge-medium';
  if (level === 'Low') return 'uv-badge uv-badge-low';
  return 'uv-badge uv-badge-neutral';
}

function changeFor(baselineScore, alternativeScore) {
  const delta = alternativeScore - baselineScore;
  if (delta > 0) return { delta, label: 'Increased', className: 'uv-delta-up' };
  if (delta < 0) return { delta, label: 'Decreased', className: 'uv-delta-down' };
  return { delta: 0, label: 'Unchanged', className: 'uv-delta-flat' };
}

function formatDelta(delta) {
  if (delta > 0) return `+${delta}`;
  return String(delta);
}

export function ScenarioLab() {
  const [baselineMm, setBaselineMm] = React.useState(80);
  const [alternativeMm, setAlternativeMm] = React.useState(150);
  const [baselineResult, setBaselineResult] = React.useState(null);
  const [alternativeResult, setAlternativeResult] = React.useState(null);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState(null);

  const zones = ZONE_ORDER.map((id) => MANGALORE_ZONES.find((z) => z.zone_id === id)).filter(Boolean);
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
          onChange: (e) => onChange(readRainfall(e.target.value))
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
        onChange: (e) => onChange(readRainfall(e.target.value))
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
      React.createElement('span', { className: levelBadgeClass(result.risk_level) }, result.risk_level)
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
                zones.map((zone) => {
                  const base = zoneResult(baselineResult, zone.zone_id);
                  const alt = zoneResult(alternativeResult, zone.zone_id);
                  const comparable = base && alt && typeof base.risk_score === 'number' && typeof alt.risk_score === 'number';
                  const change = comparable ? changeFor(base.risk_score, alt.risk_score) : null;
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
                      change ? formatDelta(change.delta) : '—'
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
