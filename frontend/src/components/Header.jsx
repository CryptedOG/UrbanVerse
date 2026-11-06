/**
 * UrbanVerse Header Component
 * Displays system identity, pilot area context, backend connection status,
 * and the mandatory simulation warning banner.
 */

export function Header({ backendStatus, onRefreshHealth, isMockMode, onToggleMockMode }) {
  const isConnected = backendStatus && backendStatus.connected;

  return React.createElement(
    'header',
    { className: 'uv-header' },
    React.createElement(
      'div',
      { className: 'uv-header-main' },
      React.createElement(
        'div',
        { className: 'uv-brand' },
        React.createElement('div', { className: 'uv-logo-badge' }, 'UV'),
        React.createElement(
          'div',
          null,
          React.createElement('h1', { className: 'uv-title' }, 'UrbanVerse'),
          React.createElement(
            'p',
            { className: 'uv-subtitle' },
            'Multi-Hazard Urban Intelligence & Resilience Platform • Mangalore Pilot Area'
          )
        )
      ),
      React.createElement(
        'div',
        { className: 'uv-status-group' },
        React.createElement(
          'div',
          {
            className: `uv-health-pill ${isConnected ? 'uv-health-online' : 'uv-health-offline'}`,
            title: backendStatus ? backendStatus.error || 'FastAPI backend responding' : 'Checking...'
          },
          React.createElement('span', { className: 'uv-pulse-dot' }),
          React.createElement(
            'span',
            null,
            isConnected ? 'FastAPI Connected (8000)' : 'Backend Offline (Mock Active)'
          )
        ),
        React.createElement(
          'button',
          {
            className: 'uv-btn-subtle',
            onClick: onRefreshHealth,
            title: 'Recheck connection to Member 1 backend'
          },
          '↻ Recheck'
        ),
        React.createElement(
          'button',
          {
            className: `uv-mode-toggle ${isMockMode ? 'uv-mode-active' : ''}`,
            onClick: onToggleMockMode,
            title: 'Force local mock mode vs live API call'
          },
          isMockMode ? 'Mode: Forced Mock' : 'Mode: Auto / Live API'
        )
      )
    ),
    // Mandatory visible warning requirement from 00_Team_Integration_Guide.pdf
    React.createElement(
      'div',
      { className: 'uv-disclaimer-banner' },
      React.createElement('span', { className: 'uv-warning-icon' }, '⚠️'),
      React.createElement(
        'strong',
        null,
        'Simulation only; not a live emergency warning.'
      ),
      React.createElement(
        'span',
        { className: 'uv-disclaimer-sub' },
        ' All inundation levels and hazard scores are simulated for hackathon demonstration.'
      )
    )
  );
}
