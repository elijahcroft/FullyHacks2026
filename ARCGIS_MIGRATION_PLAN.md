# ArcGIS MapView Migration Plan

## Goal

Replace the Leaflet map with an ArcGIS `MapView` that is better aligned with ocean-current visualization and future spill tracking.

## Migration Phases

1. Replace the map engine without rewriting the simulator.
2. Move ocean-current visualization onto the ArcGIS drifter-current image service.
3. Render bottles, trails, and spill plumes as ArcGIS graphics layers.
4. Keep simulation logic independent so we can later upgrade the forcing model without another map rewrite.

## Current Layer Stack

From bottom to top:

1. ArcGIS `oceans` basemap.
2. `ImageryTileLayer` for NOAA/Esri monthly drifter currents.
3. Spill plume graphics layer for spread visualization.
4. Bottle trail graphics layer for advection history.
5. Bottle point graphics layer for active particles.
6. Annotation layer for risk zones like the Great Pacific Garbage Patch.

## Why This Architecture

- ArcGIS handles the native `ImageServer` currents layer directly.
- The simulation remains reusable for bottles, oil droplets, plastic particles, or other pollutants.
- Separate layers let us scale rendering strategies independently as the app grows.

## Recommended Next Steps

1. Replace the baked `/public/data/currentField.json` generator with a service-backed sampling/export workflow.
2. Move particle stepping into a Web Worker when particle counts grow.
3. Split bottle particles from spill particles so messages and pollution runs can coexist.
4. Add scenario inputs for release rate, pollutant type, decay, shoreline sticking, and wind drift.
5. Promote bottle/plume graphics to client-side `FeatureLayer`s if querying and filtering needs outgrow `GraphicsLayer`.
