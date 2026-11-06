/**
 * UrbanVerse Controls Component
 * Phase 1A: Multi-hazard selector tabs, hazard-specific parameter controls, presets,
 * and 2D/3D view mode selector while preserving all existing flood capabilities.
 */

import { HAZARD_TYPES, HAZARD_LIST } from '../data/hazardDefinitions.js';

export function Controls({
  activeHazard = 'flood',
  onHazardChange,
  currentValue,
  onValueChange,
  // Backward compatibility with initial props
  rainfall,
  onRainfallChange,
  onRunSimulation,
  loading,
  viewMode,
  onViewModeChange,
  lastRunValue,
  lastRunRainfall
}) {
  const hazardDef = HAZARD_TYPES[activeHazard] || HAZARD_TYPES.flood;

  // Resolve current active value (fallback to rainfall prop if passed directly)
  const resolvedValue = currentValue !== undefined ? currentValue : (rainfall !== undefined ? rainfall : hazardDef.defaultValue);
  const handleValueChange = onValueChange || onRainfallChange;

  // Determine if input has changed since last assessment
  const benchmarkRun = lastRunValue !== undefined ? lastRunValue : lastRunRainfall;
  const hasUnsavedChanges = benchmarkRun !== null && benchmarkRun !== undefined && benchmarkRun !== resolvedValue;

  return React.createElement(
    'section',
    { className: 'uv-card uv-controls-card' },
    // Header & View Mode Switcher
    React.createElement(
      'div',
      { className: 'uv-controls-header' },
      React.createElement(
        'div',
        null,
        React.createElement('h2', { className: 'uv-card-title' }, 'Multi-Hazard Intelligence Command'),
        React.createElement(
          'p',
          { className: 'uv-card-desc' },
          'Select an environmental hazard vector and adjust simulation parameters'
        )
      ),
      // 2D vs 3D Viewport Toggle
      React.createElement(
        'div',
        { className: 'uv-view-toggle-group' },
        React.createElement(
          'button',
          {
            className: `uv-toggle-btn ${viewMode === '2d' ? 'uv-toggle-active' : ''}`,
            onClick: () => onViewModeChange('2d')
          },
          '🗺️ 2D GIS Map'
        ),
        React.createElement(
          'button',
          {
            className: `uv-toggle-btn ${viewMode === '3d' ? 'uv-toggle-active' : ''}`,
            onClick: () => onViewModeChange('3d')
          },
          '🏙️ 3D Digital Twin'
        )
      )
    ),

    // Step 2: Multi-Hazard Selection Tabs
    React.createElement(
      'div',
      { className: 'uv-hazard-nav' },
      React.createElement(
        'span',
        { className: 'uv-hazard-nav-label' },
        'Hazard Vector:'
      ),
      React.createElement(
        'div',
        { className: 'uv-hazard-tabs', role: 'tablist' },
        HAZARD_LIST.map((h) => {
          const isActive = activeHazard === h.id;
          return React.createElement(
            'button',
            {
              key: h.id,
              role: 'tab',
              'aria-selected': isActive,
              className: `uv-hazard-tab ${isActive ? 'uv-hazard-tab-active' : ''}`,
              style: isActive ? { borderColor: h.color, boxShadow: `0 0 12px ${h.color}33` } : {},
              onClick: () => onHazardChange && onHazardChange(h.id)
            },
            React.createElement('span', { className: 'uv-hazard-icon' }, h.icon),
            React.createElement('span', { className: 'uv-hazard-title' }, h.shortName)
          );
        })
      )
    ),

    // Step 3: Hazard-Specific Input Controls
    React.createElement(
      'div',
      { className: 'uv-slider-section', style: { borderLeft: `3px solid ${hazardDef.color}` } },
      React.createElement(
        'div',
        { className: 'uv-slider-label-row' },
        React.createElement(
          'div',
          { className: 'uv-param-label-col' },
          React.createElement(
            'span',
            { className: 'uv-slider-title' },
            `Simulated ${hazardDef.paramName}:`
          ),
          React.createElement(
            'span',
            { className: 'uv-hazard-badge-inline', style: { color: hazardDef.color } },
            `${hazardDef.icon} ${hazardDef.name}`
          )
        ),
        React.createElement(
          'div',
          { className: 'uv-rainfall-metric' },
          React.createElement(
            'span',
            { className: 'uv-rainfall-value', style: { color: hazardDef.color } },
            resolvedValue
          ),
          React.createElement(
            'span',
            { className: 'uv-rainfall-unit' },
            hazardDef.unit
          )
        )
      ),

      // Dynamic Slider
      React.createElement('input', {
        type: 'range',
        min: String(hazardDef.min),
        max: String(hazardDef.max),
        step: String(hazardDef.step),
        value: resolvedValue,
        className: 'uv-slider',
        style: { accentColor: hazardDef.color },
        onChange: (e) => handleValueChange && handleValueChange(Number(e.target.value))
      }),

      // Slider Scale Labels
      React.createElement(
        'div',
        { className: 'uv-slider-scale' },
        hazardDef.scaleLabels.map((lbl, idx) =>
          React.createElement('span', { key: idx }, lbl)
        )
      ),

      // Hazard-Specific Presets
      React.createElement(
        'div',
        { className: 'uv-presets-row' },
        hazardDef.presets.map((p) =>
          React.createElement(
            'button',
            {
              key: p.label,
              className: `uv-preset-btn ${resolvedValue === p.value ? 'uv-preset-selected' : ''}`,
              style: resolvedValue === p.value ? { borderColor: hazardDef.color } : {},
              onClick: () => handleValueChange && handleValueChange(p.value)
            },
            React.createElement(
              'span',
              { className: 'uv-preset-mm' },
              `${p.value} ${hazardDef.unit}`
            ),
            React.createElement(
              'span',
              { className: 'uv-preset-tag' },
              p.label
            )
          )
        )
      )
    ),

    // Run Assessment Action Bar
    React.createElement(
      'div',
      { className: 'uv-action-bar' },
      React.createElement(
        'button',
        {
          className: `uv-btn-primary uv-btn-simulate ${loading ? 'uv-loading' : ''}`,
          onClick: onRunSimulation,
          disabled: loading
        },
        loading
          ? React.createElement(
              'span',
              { className: 'uv-btn-content' },
              React.createElement('span', { className: 'uv-spinner' }),
              `Evaluating ${hazardDef.shortName} Dynamics...`
            )
          : React.createElement(
              'span',
              { className: 'uv-btn-content' },
              activeHazard === 'flood'
                ? '⚡ Run Flood Simulation (POST /api/simulate)'
                : `⚡ Run ${hazardDef.shortName} Assessment`
            )
      ),
      hasUnsavedChanges &&
        React.createElement(
          'span',
          { className: 'uv-pending-notice' },
          `● Parameter altered. Click assessment button to evaluate.`
        )
    )
  );
}
