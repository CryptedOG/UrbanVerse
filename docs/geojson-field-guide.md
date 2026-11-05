# UrbanVerse — GeoJSON Field Guide & Zone Reference

This document provides the complete property dictionary and zone catalog for [`data/pilot-area.geojson`](../data/pilot-area.geojson), the primary GIS layer for the UrbanVerse digital twin prototype.

---

## 1. GeoJSON Structure & Standards

The GIS file is formatted as a standard GeoJSON `FeatureCollection` according to **RFC 7946**.

```json
{
  "type": "FeatureCollection",
  "name": "UrbanVerse_Pilot_Area_Mangalore_Synthetic",
  "description": "Fictional demonstration map...",
  "bbox": [74.8400, 12.8550, 74.8640, 12.8750],
  "features": [ ... ]
}
```

### Technical Specifications
- **GeoJSON Standard**: Conforming to [RFC 7946](https://tools.ietf.org/html/rfc7946).
- **Geometry Type**: `Polygon` (closed linear rings with 5 coordinate pairs each).
- **Coordinate Reference System (CRS)**: WGS 84 (`EPSG:4326` / `urn:ogc:def:crs:OGC:1.3:CRS84`), standard decimal degrees. Per RFC 7946, legacy `"crs"` members are omitted.
- **Coordinate Order**: Strictly `[longitude, latitude]` in decimal degrees (e.g., `[74.8400, 12.8650]`).
- **Ring Closure**: The first and last coordinate in each polygon's exterior ring are identical.
- **Winding Order**: Follows the RFC 7946 right-hand rule — exterior rings are wound **counterclockwise (CCW)**.
- **Bounding Box (`bbox`)**: Formatted as `[minLon, minLat, maxLon, maxLat]`. Defined at both the `FeatureCollection` level and each individual `Feature` level for instant bounding calculations (`map.fitBounds`).
- **Topology**: The four zones are contiguous and adjacent. They share identical edge vertices with zero gaps and zero overlapping interiors.
- **Geographical Center**: Anchored in the coastal vicinity of Mangalore, Karnataka, India (~12.865°N, 74.852°E).
- **Synthetic Disclaimer**: All boundaries and feature attributes are synthetic demonstration data and do not represent verified real-world municipal or geographical boundaries.

---

## 2. Complete Property Dictionary

### Feature-Level Members

| Member | Data Type | Required | Description & Usage | Example |
| :--- | :--- | :--- | :--- | :--- |
| `type` | `string` | **Yes** | GeoJSON object type. Always `"Feature"`. | `"Feature"` |
| `id` | `string` | **Yes** | Feature-level identifier conforming to RFC 7946 §3.2. Matches `properties.zone_id`. Used by map libraries (such as Mapbox GL JS `setFeatureState`). | `"UV001"` |
| `bbox` | `array` | Optional | Bounding box of the feature as `[minLon, minLat, maxLon, maxLat]`. | `[74.8400, 12.8650, 74.8520, 12.8750]` |
| `geometry` | `object` | **Yes** | GeoJSON Polygon geometry containing exterior linear ring coordinates. | `{ "type": "Polygon", "coordinates": [...] }` |
| `properties` | `object` | **Yes** | Feature properties dictionary containing application metadata. | `{ ... }` |

### Feature `properties` Dictionary

| Property | Data Type | Required | Description & Usage | Example |
| :--- | :--- | :--- | :--- | :--- |
| `zone_id` | `string` | **Yes** | **Permanent Unique Identifier** for the zone. Primary key connecting GIS polygons to backend simulation outputs and risk calculations. **Must not be modified or renamed.** | `"UV001"` |
| `zone_name` | `string` | **Yes** | Human-readable title of the zone. Displayed in UI tooltips, zone inspection cards, and report tables by Member 2. | `"Residential Zone"` |
| `zone_type` | `string` | **Yes** | Standardized land-use category (`residential`, `commercial`, `industrial`, `riverside`). Used for category filtering and contextual risk weighting. | `"residential"` |
| `data_type` | `string` | **Yes** | Provenance marker. Always set to `"synthetic"` for demonstration data to maintain project integrity and compliance with hackathon rules. | `"synthetic"` |
| `description` | `string` | **Yes** | Detailed contextual narrative explaining the characteristics of the zone while explicitly reiterating its fictional, synthetic nature. | `"Fictional residential zone located in the northern inland sector..."` |
| `pilot_area_id` | `string` | Optional | Identifier of the parent pilot area, matching the API interface contract (`"pilot-area-01"`). | `"pilot-area-01"` |
| `elevation_m` | `float` | Optional | Synthetic baseline terrain elevation in meters above sea level. Provided as a fallback parameter for Member 4's flood simulation rules. | `24.0` |

---

## 3. Permanent Zone Catalog

UrbanVerse defines **four permanent zones**. All team modules must reference these exact IDs.

### 1. `UV001` — Residential Zone
- **Zone ID**: `UV001`
- **Zone Name**: `Residential Zone`
- **Zone Type**: `residential`
- **Data Type**: `synthetic`
- **Baseline Elevation**: `24.0 m`
- **Bounding Box (`bbox`)**: `[74.8400, 12.8650, 74.8520, 12.8750]`
- **Coordinates (Counterclockwise)**:
  - `[74.8400, 12.8650]` (Southwest)
  - `[74.8520, 12.8650]` (Southeast — touches `UV002`, `UV003`, `UV004`)
  - `[74.8520, 12.8750]` (Northeast — touches `UV002`)
  - `[74.8400, 12.8750]` (Northwest)
  - `[74.8400, 12.8650]` (Southwest — closed)
- **Role in Simulation**: Represents an elevated inland neighborhood. Higher elevation creates natural resilience against moderate rain, but extreme precipitation can trigger localized surface-water pooling.

### 2. `UV002` — Commercial Zone
- **Zone ID**: `UV002`
- **Zone Name**: `Commercial Zone`
- **Zone Type**: `commercial`
- **Data Type**: `synthetic`
- **Baseline Elevation**: `18.0 m`
- **Bounding Box (`bbox`)**: `[74.8520, 12.8650, 74.8640, 12.8750]`
- **Coordinates (Counterclockwise)**:
  - `[74.8520, 12.8650]` (Southwest — touches `UV001`, `UV003`, `UV004`)
  - `[74.8640, 12.8650]` (Southeast — touches `UV003`)
  - `[74.8640, 12.8750]` (Northeast)
  - `[74.8520, 12.8750]` (Northwest — touches `UV001`)
  - `[74.8520, 12.8650]` (Southwest — closed)
- **Role in Simulation**: Represents a dense commercial district with high paved surface fraction. Moderate elevation with high economic vulnerability.

### 3. `UV003` — Industrial Zone
- **Zone ID**: `UV003`
- **Zone Name**: `Industrial Zone`
- **Zone Type**: `industrial`
- **Data Type**: `synthetic`
- **Baseline Elevation**: `10.0 m`
- **Bounding Box (`bbox`)**: `[74.8520, 12.8550, 74.8640, 12.8650]`
- **Coordinates (Counterclockwise)**:
  - `[74.8520, 12.8550]` (Southwest — touches `UV004`)
  - `[74.8640, 12.8550]` (Southeast)
  - `[74.8640, 12.8650]` (Northeast — touches `UV002`)
  - `[74.8520, 12.8650]` (Northwest — touches `UV001`, `UV002`, `UV004`)
  - `[74.8520, 12.8550]` (Southwest — closed)
- **Role in Simulation**: Represents mid-to-low elevation industrial and warehousing facilities. Moderate-to-high flood risk under heavy rainfall scenarios.

### 4. `UV004` — Riverside Zone
- **Zone ID**: `UV004`
- **Zone Name**: `Riverside Zone`
- **Zone Type**: `riverside`
- **Data Type**: `synthetic`
- **Baseline Elevation**: `4.0 m`
- **Bounding Box (`bbox`)**: `[74.8400, 12.8550, 74.8520, 12.8650]`
- **Coordinates (Counterclockwise)**:
  - `[74.8400, 12.8550]` (Southwest)
  - `[74.8520, 12.8550]` (Southeast — touches `UV003`)
  - `[74.8520, 12.8650]` (Northeast — touches `UV001`, `UV002`, `UV003`)
  - `[74.8400, 12.8650]` (Northwest — touches `UV001`)
  - `[74.8400, 12.8550]` (Southwest — closed)
- **Role in Simulation**: Low-lying riparian corridor closest to simulated river runoff. This zone is most vulnerable to flooding and serves as the primary high-risk benchmark during simulation runs.

---

## 4. Shared Spatial Adjacency Matrix

The four zones form a seamless 2x2 contiguous grid layout:

```text
       North (Latitude: 12.8750)
       +-----------------------+-----------------------+
       |                       |                       |
       |        UV001          |        UV002          |
       |   Residential Zone    |    Commercial Zone    |
       |      (Elev: 24m)      |      (Elev: 18m)      |
       |                       |                       |
Center +-----------------------*-----------------------+ (Latitude: 12.8650)
       |                       |                       |
       |        UV004          |        UV003          |
       |    Riverside Zone     |    Industrial Zone    |
       |      (Elev: 4m)       |      (Elev: 10m)      |
       |                       |                       |
       +-----------------------+-----------------------+
       South (Latitude: 12.8550)
   West (Lon: 74.8400)    Center (Lon: 74.8520)   East (Lon: 74.8640)
```

The asterisk (`*`) at `[74.8520, 12.8650]` marks the shared junction vertex where all four zones seamlessly meet.

---

## 5. Team Integration Guidelines

### For Member 1 (Backend & Integration)
- Load `data/pilot-area.geojson` when initializing the application or querying zone metadata.
- When `POST /api/simulate` responds, ensure that the returned `zones` array contains the exact `zone_id` strings (`"UV001"`, `"UV002"`, `"UV003"`, `"UV004"`):
  ```json
  {
    "area_id": "pilot-area-01",
    "rainfall_mm": 80,
    "zones": [
      { "zone_id": "UV001", "risk_score": 35, "risk_level": "Low" },
      { "zone_id": "UV002", "risk_score": 62, "risk_level": "Medium" },
      { "zone_id": "UV003", "risk_score": 75, "risk_level": "High" },
      { "zone_id": "UV004", "risk_score": 92, "risk_level": "High" }
    ],
    "affected_zones": ["UV003", "UV004"],
    "recommendations": ["Prioritise flood barriers in UV004 Riverside Zone"],
    "simulation_only": true
  }
  ```

### For Member 2 (Frontend & 3D Twin)
- Import or fetch `pilot-area.geojson` directly into your map component (e.g., Leaflet `L.geoJSON`, Mapbox `addSource` / `addLayer`).
- Initial map view recommendation:
  - Center: `[12.8650, 74.8520]` (Latitude, Longitude)
  - Zoom level: `14` or `15`
  - Fit bounds directly with `featureCollection.bbox`: `[[12.8550, 74.8400], [12.8750, 74.8640]]`
- Dynamic Styling: Join the backend simulation response to the map feature by matching `feature.properties.zone_id === responseZone.zone_id`:
  - `High`: `#ef4444` (Red / 70% opacity)
  - `Medium`: `#f59e0b` (Amber / 70% opacity)
  - `Low`: `#10b981` (Green / 70% opacity)
- Display `feature.properties.zone_name` and `feature.properties.description` on click/hover tooltips.

### For Member 4 (Simulation & Risk Logic)
- Read `zone_id`, `zone_type`, and `elevation_m` from `pilot-area.geojson`.
- Use `elevation_m` in your flood algorithm: lower elevation (e.g., `UV004` at 4m) experiences exponential risk growth at lower `rainfall_mm` thresholds compared to elevated zones (e.g., `UV001` at 24m).
