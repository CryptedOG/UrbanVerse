# UrbanVerse — GIS Data Sources and Provenance

> **CRITICAL DISCLAIMER: SYNTHETIC DEMONSTRATION DATA ONLY**  
> All geographical boundaries, polygon geometries, zone delineations, and elevation attributes provided in `data/pilot-area.geojson` are **synthetic demonstration data, not verified geographical information**.  
> This dataset does not represent real-world municipal, legal, or administrative information. It is created strictly for prototype demonstration and UI/backend/simulation integration within the 24-hour UrbanVerse hackathon project.  
> **Do not use this data for real-world navigation, urban planning, civil engineering, or operational disaster/emergency management.**

---

## 1. Overview

As part of the UrbanVerse digital twin prototype, Member 3 (GIS Data & Map Integration) provides geographical data to anchor the flood-risk simulation and dashboard visualization in a pilot area near Mangalore, Karnataka, India.

To guarantee zero dependencies on external GIS servers during hackathon testing and eliminate polygon rendering errors (such as sliver gaps, self-intersections, or coordinate mismatch), the pilot area is modeled as a clean, continuous, 4-zone synthetic GeoJSON polygon dataset.

---

## 2. Dataset Metadata Record

| Property | Details |
| :--- | :--- |
| **Dataset Title** | UrbanVerse Pilot Area Demonstration Zones |
| **File Location** | [`data/pilot-area.geojson`](../data/pilot-area.geojson) |
| **Data Format** | GeoJSON (`FeatureCollection`) conforming to RFC 7946 |
| **Geometry Type** | `Polygon` (closed linear rings) |
| **Coordinate Reference System (CRS)** | WGS 84 (`urn:ogc:def:crs:OGC:1.3:CRS84` / EPSG:4326) |
| **Coordinate Ordering** | `[longitude, latitude]` in decimal degrees |
| **Geographical Anchor** | Mangalore, Karnataka, India (approx. 12.8550°N–12.8750°N, 74.8400°E–74.8640°E) |
| **Target Pilot Area ID** | `pilot-area-01` |
| **Bounding Box (`bbox`)** | `[74.8400, 12.8550, 74.8640, 12.8750]` (`[minLon, minLat, maxLon, maxLat]`) |
| **Elevation Units** | Meters above mean sea level ($m$) |
| **Data Creation Date** | November 2026 |
| **Data Author / Role** | Member 3 — GIS Data & Map Integration |
| **License** | Open Demonstration / MIT (Hackathon Project Use Only) |
| **Data Type / Provenance** | `synthetic` |

---

## 3. Included Geographical Zones

The pilot area (`pilot-area-01`) is divided into four mutually adjacent, non-overlapping polygon zones:

| Zone ID | Zone Name | Zone Type | Data Type | Baseline Elevation ($m$) | Description & Demonstrative Role |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `UV001` | Residential Zone | `residential` | `synthetic` | 24.0 m | Northern inland elevated sector; lower vulnerability to tidal flooding, susceptible to surface run-off under heavy downpours. |
| `UV002` | Commercial Zone | `commercial` | `synthetic` | 18.0 m | Northeastern urban commercial district; high impervious surface coverage and dense asset density. |
| `UV003` | Industrial Zone | `industrial` | `synthetic` | 10.0 m | Southeastern mid-elevation district; manufacturing, warehousing, and transportation corridor. |
| `UV004` | Riverside Zone | `riverside` | `synthetic` | 4.0 m | Southwestern low-lying coastal/riparian basin; high baseline susceptibility to water inundation. |

---

## 4. Why Synthetic Data Was Used for the MVP

1. **Topology and Stability**:
   Real-world shapefiles from external portals frequently contain sliver overlaps, multi-part geometries, invalid winding orders, or complex topology that can crash lightweight web map renderers (e.g., Leaflet, Mapbox GL JS, Three.js). The synthetic dataset guarantees exact vertex sharing and counterclockwise closed rings.
2. **Interface Stability**:
   Stable zone IDs (`UV001` to `UV004`) are fixed so Member 1 (FastAPI backend), Member 2 (React frontend), and Member 4 (Flood simulation module) can test asynchronously without breakage.
3. **Offline Resilience**:
   Hackathon development must function reliably regardless of network connectivity or external map tile rate limits.
4. **Honest Science & Prototyping Ethics**:
   In adherence to the team integration guidelines, no simulated score is claimed as an authoritative hydrological prediction. Using explicitly labeled synthetic boundaries prevents false impressions of certified municipal risk assessments.

---

## 5. Dataset Limitations

- **Boundary Simplification**: Zones are represented as simplified contiguous polygons rather than actual cadastral parcels or natural river banks.
- **Elevation Approximation**: Baseline elevations (4 m to 24 m) are synthetic heuristic values provided as a fallback to allow Member 4's rule-based flood logic to execute without requiring heavy Digital Elevation Model (DEM) raster processing.
- **Hydrological Assumptions**: The dataset does not incorporate live stormwater pipe network capacity, subterranean culverts, or tidal gate operations.

---

## 6. Real-World Data Integration Roadmap (Post-Hackathon)

For subsequent production iterations, the following official and verified open datasets can be integrated:

1. **Topography & Elevation**:
   - **Copernicus GLO-30 DEM** / **SRTM 30m**: For continuous terrain height matrices.
   - *Source*: European Space Agency (ESA) / USGS EarthExplorer.
2. **Base Map & Building Footprints**:
   - **OpenStreetMap (OSM)**: For road networks, waterways, and building footprints via Overpass API.
   - *License*: Open Database License (ODbL).
3. **Municipal Boundaries**:
   - **Mangalore City Corporation (MCC) GIS Portal**: For ward boundaries and urban land-use zoning.
4. **Hydro-Meteorological Data**:
   - **India Meteorological Department (IMD)** & **Central Water Commission (CWC)**: For historical rainfall intensity, return periods, and Netravati river water level gauging.
