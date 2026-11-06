/**
 * UrbanVerse Multi-Hazard Definitions & Parameter Specifications
 * Phase 1A: Multi-Hazard Expansion (Flood, Cyclone, Heatwave, Air Pollution, Landslide)
 */

export const HAZARD_TYPES = {
  flood: {
    id: 'flood',
    name: 'Flood Inundation',
    shortName: 'Flood',
    icon: '🌊',
    color: '#38bdf8',
    unit: 'mm',
    paramName: '24-Hour Precipitation',
    min: 0,
    max: 300,
    step: 5,
    defaultValue: 80,
    scaleLabels: ['0 mm (Dry)', '75 mm', '150 mm', '225 mm', '300 mm (Flood Surge)'],
    presets: [
      { label: 'Light', value: 25, desc: 'Drizzle' },
      { label: 'Benchmark', value: 80, desc: 'Contract Test' },
      { label: 'Heavy', value: 150, desc: 'Monsoon Surge' },
      { label: 'Extreme', value: 240, desc: 'Severe Hazard' }
    ]
  },
  cyclone: {
    id: 'cyclone',
    name: 'Tropical Cyclone',
    shortName: 'Cyclone',
    icon: '🌀',
    color: '#818cf8',
    unit: 'km/h',
    paramName: 'Sustained Wind Speed',
    min: 0,
    max: 250,
    step: 5,
    defaultValue: 120,
    scaleLabels: ['0 km/h (Calm)', '60 km/h (Depression)', '120 km/h (Cat 1)', '180 km/h (Severe)', '250 km/h (Super)'],
    presets: [
      { label: 'Depression', value: 55, desc: 'Gale Winds' },
      { label: 'Cyclonic Storm', value: 90, desc: 'Structural Hazard' },
      { label: 'Severe Cyclone', value: 135, desc: 'Roof/Tree Damage' },
      { label: 'Super Cyclone', value: 220, desc: 'Catastrophic' }
    ]
  },
  heatwave: {
    id: 'heatwave',
    name: 'Urban Heat Island',
    shortName: 'Heatwave',
    icon: '☀️',
    color: '#fb923c',
    unit: '°C',
    paramName: 'Peak Surface Temperature',
    min: 30,
    max: 50,
    step: 1,
    defaultValue: 42,
    scaleLabels: ['30°C (Normal)', '35°C (Warm)', '40°C (Advisory)', '45°C (Severe)', '50°C (Extreme)'],
    presets: [
      { label: 'Baseline', value: 33, desc: 'Normal Summer' },
      { label: 'Advisory', value: 39, desc: 'Caution Required' },
      { label: 'Severe Alert', value: 44, desc: 'Heatstroke Risk' },
      { label: 'Emergency', value: 48, desc: 'Critical Outage' }
    ]
  },
  air_pollution: {
    id: 'air_pollution',
    name: 'Air Pollution Index',
    shortName: 'Air Quality',
    icon: '🌫️',
    color: '#cbd5e1',
    unit: 'AQI',
    paramName: 'Air Quality Index (PM2.5 / PM10)',
    min: 0,
    max: 500,
    step: 10,
    defaultValue: 180,
    scaleLabels: ['0 (Good)', '100 (Moderate)', '200 (Poor)', '300 (Very Poor)', '500 (Severe)'],
    presets: [
      { label: 'Good', value: 45, desc: 'Satisfactory' },
      { label: 'Moderate', value: 120, desc: 'Sensitive Group' },
      { label: 'Poor', value: 230, desc: 'Unhealthy' },
      { label: 'Severe Hazard', value: 410, desc: 'Emergency Level' }
    ]
  },
  landslide: {
    id: 'landslide',
    name: 'Landslide Susceptibility',
    shortName: 'Landslide',
    icon: '⛰️',
    color: '#f472b6',
    unit: '%',
    paramName: 'Soil Moisture Saturation',
    min: 0,
    max: 100,
    step: 5,
    defaultValue: 70,
    scaleLabels: ['0% (Dry Soil)', '25%', '50% (Saturated)', '75% (Unstable)', '100% (Liquefaction)'],
    presets: [
      { label: 'Stable', value: 20, desc: 'Dry Bedrock' },
      { label: 'Moderate', value: 50, desc: 'Pore Pressure' },
      { label: 'High Alert', value: 75, desc: 'Slope Instability' },
      { label: 'Critical Failure', value: 95, desc: 'Active Debris Flow' }
    ]
  }
};

export const HAZARD_LIST = Object.values(HAZARD_TYPES);

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { HAZARD_TYPES, HAZARD_LIST };
}
