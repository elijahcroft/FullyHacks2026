'use client'

import { useEffect, useRef } from 'react'
import EsriMap from '@arcgis/core/Map.js'
import MapView from '@arcgis/core/views/MapView.js'
import Basemap from '@arcgis/core/Basemap.js'
import GraphicsLayer from '@arcgis/core/layers/GraphicsLayer.js'
import Graphic from '@arcgis/core/Graphic.js'
import ImageryTileLayer from '@arcgis/core/layers/ImageryTileLayer.js'
import WebTileLayer from '@arcgis/core/layers/WebTileLayer.js'
import Point from '@arcgis/core/geometry/Point.js'
import Polyline from '@arcgis/core/geometry/Polyline.js'
import Polygon from '@arcgis/core/geometry/Polygon.js'
import { normalizeLongitude, unwrapPathFromEnd, wrapLongitudeNear } from '@/lib/longitude'
import type { Bottle, IncidentType, MapController } from '@/types'
import { INCIDENT_CONFIGS } from '@/types'
import type { InteractionMode } from './OceanMap'
import { useSimulationContext } from '@/simulation/context'
import { buildFlowRenderer, createDrifterCurrentsLayer, flowSpeedForMultiplier } from '@/lib/arcgis/drifterCurrents'
import { MARINE_ZONES, type OverlayType } from '@/lib/marineZones'
import type { IncidentInterception } from '@/lib/interception'

interface Props {
  bottles: Bottle[]
  selectedBottle: Bottle | null
  mode: InteractionMode
  activeOverlays: Set<OverlayType>
  interception: IncidentInterception | null
  onMapClick: (lat: number, lng: number) => void
  onBottleClick: (bottle: Bottle) => void
  onMapReady?: (map: MapController) => void
}

interface LayerBundle {
  bottleLayer: GraphicsLayer
  plumeLayer: GraphicsLayer
  trailLayer: GraphicsLayer
  annotationLayer: GraphicsLayer
  interceptionLayer: GraphicsLayer
  currentsLayer: ImageryTileLayer
}

// Per-bottle graphics kept alive across ticks so we can mutate in-place
interface BottleEntry {
  dot: Graphic
  plumes: Graphic[]   // fixed count per incident type — update symbol/geometry in-place
  trail: Graphic | null
}

// Organic, hand-crafted blob for the Great Pacific Garbage Patch gyre (lng, lat)
const GARBAGE_PATCH_RING = [
  [-161, 27], [-153, 24], [-143, 24], [-134, 28], [-131, 34],
  [-133, 40], [-139, 46], [-148, 47], [-157, 45], [-163, 40],
  [-165, 34], [-161, 27],
]

// How long each lerp animation runs (slightly under the 1 s tick interval)
const LERP_MS = 920

function easeInOut(t: number) {
  return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t
}

function makePt(lat: number, lng: number) {
  return new Point({ longitude: normalizeLongitude(lng), latitude: lat, spatialReference: { wkid: 4326 } })
}

// ── Component ─────────────────────────────────────────────────────────────

export default function ArcGISMap({
  bottles,
  selectedBottle,
  mode,
  activeOverlays,
  interception,
  onMapClick,
  onBottleClick,
  onMapReady,
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const viewRef = useRef<MapView | null>(null)
  const layersRef = useRef<LayerBundle | null>(null)
  const modeRef = useRef(mode)
  const bottlesRef = useRef(bottles)
  const onMapClickRef = useRef(onMapClick)
  const onBottleClickRef = useRef(onBottleClick)
  const onMapReadyRef = useRef(onMapReady)
  const { showFlowField, speedMultiplier } = useSimulationContext()

  modeRef.current = mode
  bottlesRef.current = bottles
  onMapClickRef.current = onMapClick
  onBottleClickRef.current = onBottleClick
  onMapReadyRef.current = onMapReady

  // ── Graphics management refs (stable across renders) ─────────────────────
  const graphicsMap = useRef(new Map<string, BottleEntry>())
  // Currently displayed position for each bottle (what the lerp has reached)
  const dispPos = useRef(new Map<string, [number, number]>())
  // Lerp start and target per bottle
  const lerpFrom = useRef(new Map<string, [number, number]>())
  const lerpTo   = useRef(new Map<string, [number, number]>())
  const lerpT0   = useRef(0)
  const rafId    = useRef<number | null>(null)

  function cancelLerp() {
    if (rafId.current !== null) { cancelAnimationFrame(rafId.current); rafId.current = null }
  }

  function startLerp() {
    lerpT0.current = performance.now()
    const tick = (now: number) => {
      const raw = Math.min(1, (now - lerpT0.current) / LERP_MS)
      const ease = easeInOut(raw)

      for (const [id, entry] of graphicsMap.current) {
        const from = lerpFrom.current.get(id)
        const to   = lerpTo.current.get(id)
        if (!from || !to) continue

        const lat = from[0] + (to[0] - from[0]) * ease
        // Unwrap target lng to be near `from` so lerp takes the short arc over the antimeridian
        const toNearFrom = wrapLongitudeNear(to[1], from[1])
        const lng = from[1] + (toNearFrom - from[1]) * ease
        dispPos.current.set(id, [lat, lng])

        const geo = makePt(lat, lng)
        // Mutate geometry in-place — no remove/add, no flash
        entry.dot.geometry = geo
        for (const p of entry.plumes) p.geometry = geo
      }

      if (raw < 1) {
        rafId.current = requestAnimationFrame(tick)
      } else {
        rafId.current = null
      }
    }
    rafId.current = requestAnimationFrame(tick)
  }

  // ── Map initialisation (runs once) ───────────────────────────────────────

  useEffect(() => {
    if (!containerRef.current) return

    const currentsLayer     = createDrifterCurrentsLayer(speedMultiplier)
    const plumeLayer        = new GraphicsLayer({ title: 'Spill Plume', blendMode: 'screen' })
    const trailLayer        = new GraphicsLayer({ title: 'Incident Trails' })
    const bottleLayer       = new GraphicsLayer({ title: 'Incident Markers' })
    const annotationLayer   = new GraphicsLayer({ title: 'Ocean Risk Zones' })
    const interceptionLayer = new GraphicsLayer({ title: 'Interception Overlay' })

    const map = new EsriMap({
      basemap: createPublicOceanBasemap(),
      layers: [currentsLayer, plumeLayer, trailLayer, bottleLayer, annotationLayer, interceptionLayer],
    })

    const view = new MapView({
      container: containerRef.current,
      map,
      center: [-150, 20],
      zoom: 3,
      constraints: { minZoom: 2, maxZoom: 8, rotationEnabled: false },
    })

    view.ui.move('zoom', 'bottom-left')
    layersRef.current = { bottleLayer, plumeLayer, trailLayer, annotationLayer, interceptionLayer, currentsLayer }
    viewRef.current = view

    onMapReadyRef.current?.({
      flyTo: (lat, lng, zoom = 5) => void view.goTo({ center: [lng, lat], zoom }, { duration: 1200 }),
    })

    void view.when(() => {
      drawAnnotations(annotationLayer, new Set())
      syncCursor(view, modeRef.current)
    })

    const clickHandle = view.on('click', async (event) => {
      const hit = await view.hitTest(event)
      const bottleGraphic = hit.results.find(r => 'graphic' in r && r.graphic.layer === bottleLayer)
      const graphic = bottleGraphic && 'graphic' in bottleGraphic ? bottleGraphic.graphic : null
      const bottleId = graphic?.attributes?.bottleId as string | undefined
      if (bottleId) {
        const bottle = bottlesRef.current.find(b => b.id === bottleId)
        if (bottle) { onBottleClickRef.current(bottle); return }
      }
      if (modeRef.current !== 'bottle' || !event.mapPoint || event.mapPoint.latitude == null || event.mapPoint.longitude == null) return
      onMapClickRef.current(event.mapPoint.latitude, normalizeLongitude(event.mapPoint.longitude))
    })

    return () => {
      cancelLerp()
      clickHandle.remove()
      view.destroy()
      viewRef.current = null
      layersRef.current = null
      graphicsMap.current.clear()
      dispPos.current.clear()
      lerpFrom.current.clear()
      lerpTo.current.clear()
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (viewRef.current) syncCursor(viewRef.current, mode)
  }, [mode])

  useEffect(() => {
    if (layersRef.current) layersRef.current.currentsLayer.visible = showFlowField
  }, [showFlowField])

  useEffect(() => {
    if (layersRef.current) drawAnnotations(layersRef.current.annotationLayer, activeOverlays)
  }, [activeOverlays])

  useEffect(() => {
    if (!layersRef.current) return
    const layer = layersRef.current.currentsLayer
    layer.renderer = buildFlowRenderer(flowSpeedForMultiplier(speedMultiplier)) as unknown as ImageryTileLayer['renderer']
  }, [speedMultiplier])

  // ── Bottle sync — diff-based, in-place geometry mutation ─────────────────

  useEffect(() => {
    const layers = layersRef.current
    if (!layers) return
    const { bottleLayer, plumeLayer, trailLayer } = layers

    const currentIds = new Set(bottles.map(b => b.id))

    // Remove stale entries
    for (const [id, entry] of graphicsMap.current) {
      if (!currentIds.has(id)) {
        bottleLayer.remove(entry.dot)
        plumeLayer.removeMany(entry.plumes)
        if (entry.trail) trailLayer.remove(entry.trail)
        graphicsMap.current.delete(id)
        dispPos.current.delete(id)
        lerpFrom.current.delete(id)
        lerpTo.current.delete(id)
      }
    }

    for (const bottle of bottles) {
      const isSelected = selectedBottle?.id === bottle.id
      const newLat = bottle.current_lat
      const newLng = bottle.current_lng
      const existing = graphicsMap.current.get(bottle.id)

      if (!existing) {
        // Brand-new bottle: create graphics at actual position
        const dot    = createDotGraphic(bottle, isSelected)
        const plumes = createPlumeGraphics(bottle, newLat, newLng)
        const trail  = createTrailGraphic(bottle, isSelected)

        plumeLayer.addMany(plumes)
        if (trail) trailLayer.add(trail)
        bottleLayer.add(dot)

        const pos: [number, number] = [newLat, newLng]
        graphicsMap.current.set(bottle.id, { dot, plumes, trail })
        dispPos.current.set(bottle.id, pos)
        lerpFrom.current.set(bottle.id, pos)
        lerpTo.current.set(bottle.id, pos)
      } else {
        // Existing: set new lerp target (geometry will animate smoothly)
        const cur = dispPos.current.get(bottle.id) ?? [newLat, newLng]
        lerpFrom.current.set(bottle.id, [cur[0], cur[1]])
        lerpTo.current.set(bottle.id, [newLat, newLng])

        // Symbol-only updates (no geometry change — lerp handles that)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        existing.dot.symbol = dotSymbol(bottle.incidentType ?? 'plastic', isSelected) as any

        const plumeSyms = plumeSymbolList(bottle)
        existing.plumes.forEach((p, i) => {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          if (plumeSyms[i]) p.symbol = plumeSyms[i] as any
        })

        // Trail geometry changes — update in-place if possible, else swap
        const newTrailGraphic = createTrailGraphic(bottle, isSelected)
        if (existing.trail && newTrailGraphic) {
          existing.trail.geometry = newTrailGraphic.geometry
          existing.trail.symbol = newTrailGraphic.symbol
        } else if (!existing.trail && newTrailGraphic) {
          trailLayer.add(newTrailGraphic)
          existing.trail = newTrailGraphic
        } else if (existing.trail && !newTrailGraphic) {
          trailLayer.remove(existing.trail)
          existing.trail = null
        }
      }
    }

    cancelLerp()
    startLerp()
  }, [bottles, selectedBottle]) // eslint-disable-line react-hooks/exhaustive-deps

  // ── Interception overlay ───────────────────────────────────────────────────

  const pulseRafRef = useRef<number | null>(null)
  const interceptDotRef = useRef<Graphic | null>(null)
  const interceptHaloRef = useRef<Graphic | null>(null)

  useEffect(() => {
    const layer = layersRef.current?.interceptionLayer
    if (!layer) return

    // Cancel previous pulse animation
    if (pulseRafRef.current !== null) { cancelAnimationFrame(pulseRafRef.current); pulseRafRef.current = null }
    layer.removeAll()
    interceptDotRef.current = null
    interceptHaloRef.current = null

    if (!interception || !selectedBottle) return

    const cfg = INCIDENT_CONFIGS[selectedBottle.incidentType ?? 'plastic']
    const [r, g, b] = cfg.color
    const normPath = (pts: [number,number][]) => pts.map(([lat, lng]) => [normalizeLongitude(lng), lat] as [number,number])

    // 1. Future drift path — dashed
    if (interception.futurePath.length >= 2) {
      layer.add(new Graphic({
        geometry: new Polyline({ paths: [normPath(interception.futurePath)], spatialReference: { wkid: 4326 } }),
        symbol: { type: 'simple-line', color: [r, g, b, 0.45], width: 1.8, style: 'dash', cap: 'round', join: 'round' },
      }))
    }

    // 2. Vessel route — thin white dashed
    if (interception.vesselPath.length >= 2) {
      layer.add(new Graphic({
        geometry: new Polyline({ paths: [normPath(interception.vesselPath)], spatialReference: { wkid: 4326 } }),
        symbol: { type: 'simple-line', color: [255, 255, 255, 0.28], width: 1.2, style: 'short-dash', cap: 'round', join: 'round' },
      }))
    }

    // 3. Response base marker
    layer.add(new Graphic({
      geometry: new Point({ longitude: normalizeLongitude(interception.base.lng), latitude: interception.base.lat, spatialReference: { wkid: 4326 } }),
      symbol: { type: 'simple-marker', style: 'square', size: 8, color: [255,255,255,0.7], outline: { color: [255,255,255,0.3], width: 1 } },
    }))

    // 4. Interception point — pulsing target rings
    const [iLat, iLng] = interception.point
    const iGeo = new Point({ longitude: normalizeLongitude(iLng), latitude: iLat, spatialReference: { wkid: 4326 } })

    // Outer halo (will pulse)
    const halo = new Graphic({
      geometry: iGeo,
      symbol: { type: 'simple-marker', style: 'circle', size: 36, color: [r, g, b, 0.0], outline: { color: [r, g, b, 0.6], width: 2 } },
    })
    // Inner dot
    const dot = new Graphic({
      geometry: iGeo,
      symbol: { type: 'simple-marker', style: 'circle', size: 14, color: [r, g, b, 0.95], outline: { color: [255,255,255,0.9], width: 2.5 } },
    })
    // Crosshair rings
    const ring = new Graphic({
      geometry: iGeo,
      symbol: { type: 'simple-marker', style: 'circle', size: 24, color: [0,0,0,0], outline: { color: [r, g, b, 0.5], width: 1.5 } },
    })

    layer.addMany([halo, ring, dot])
    interceptHaloRef.current = halo
    interceptDotRef.current = dot

    // Pulse animation: breathe the halo size
    const pulseStart = performance.now()
    const pulseTick = (now: number) => {
      const t = ((now - pulseStart) / 1800) % 1  // 1.8s cycle
      const ease = Math.sin(t * Math.PI)           // 0→1→0
      if (interceptHaloRef.current) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        interceptHaloRef.current.symbol = {
          type: 'simple-marker', style: 'circle',
          size: 36 + ease * 18,
          color: [r, g, b, 0],
          outline: { color: [r, g, b, 0.7 - ease * 0.5], width: 2 - ease * 0.5 },
        } as any
      }
      pulseRafRef.current = requestAnimationFrame(pulseTick)
    }
    pulseRafRef.current = requestAnimationFrame(pulseTick)

    return () => {
      if (pulseRafRef.current !== null) { cancelAnimationFrame(pulseRafRef.current); pulseRafRef.current = null }
    }
  }, [interception, selectedBottle]) // eslint-disable-line react-hooks/exhaustive-deps

  return <div ref={containerRef} className="w-full h-full arcgis-map-shell" />
}

// ── Map helpers ────────────────────────────────────────────────────────────

function syncCursor(view: MapView, mode: InteractionMode) {
  if (view.container) view.container.style.cursor = mode === 'bottle' ? 'crosshair' : 'grab'
}

function createPublicOceanBasemap() {
  return new Basemap({
    baseLayers: [new WebTileLayer({
      urlTemplate: 'https://{subDomain}.basemaps.cartocdn.com/dark_nolabels/{level}/{col}/{row}.png',
      subDomains: ['a', 'b', 'c', 'd'],
      copyright: '&copy; OpenStreetMap contributors &copy; CARTO',
    })],
    referenceLayers: [new WebTileLayer({
      urlTemplate: 'https://{subDomain}.basemaps.cartocdn.com/dark_only_labels/{level}/{col}/{row}.png',
      subDomains: ['a', 'b', 'c', 'd'],
      copyright: '&copy; OpenStreetMap contributors &copy; CARTO',
    })],
    title: 'Ocean Dark',
  })
}

function hexToRgba(hex: string, alpha: number): number[] {
  return [parseInt(hex.slice(1,3),16), parseInt(hex.slice(3,5),16), parseInt(hex.slice(5,7),16), alpha]
}

function seededRng(seed: number): () => number {
  let s = seed | 0
  return () => {
    s = Math.imul(s, 1664525) + 1013904223 | 0
    return (s >>> 0) / 4294967295
  }
}

/** Generate an organic-looking polygon ring from a bounding box [lng, lat] pairs */
function organicRing(south: number, west: number, north: number, east: number, seed: number): number[][] {
  const rng = seededRng(seed)
  const jit = (range: number) => (rng() - 0.5) * 2 * range
  const hJ = (north - south) * 0.09  // vertical jitter budget
  const wJ = (east - west) * 0.09    // horizontal jitter budget
  const pts: number[][] = []
  const steps = 6

  // Bottom edge: west→east
  for (let i = 0; i <= steps; i++) {
    const t = i / steps
    pts.push([west + (east - west) * t, south + jit(hJ)])
  }
  // Right edge: south→north (skip first point)
  for (let i = 1; i <= steps; i++) {
    const t = i / steps
    pts.push([east + jit(wJ), south + (north - south) * t])
  }
  // Top edge: east→west (skip first point)
  for (let i = 1; i <= steps; i++) {
    const t = i / steps
    pts.push([east - (east - west) * t, north + jit(hJ)])
  }
  // Left edge: north→south (skip first and last)
  for (let i = 1; i < steps; i++) {
    const t = i / steps
    pts.push([west + jit(wJ), north - (north - south) * t])
  }
  pts.push(pts[0])  // close ring
  return pts
}

function drawAnnotations(layer: GraphicsLayer, activeOverlays: Set<OverlayType>) {
  layer.removeAll()
  for (const zone of MARINE_ZONES) {
    if (!activeOverlays.has(zone.type)) continue
    const [south, west, north, east] = zone.bounds
    const seed = zone.id.split('').reduce((acc, c) => acc * 31 + c.charCodeAt(0), 0)
    const ring = organicRing(south, west, north, east, seed)
    layer.add(new Graphic({
      geometry: new Polygon({ rings: [ring], spatialReference: { wkid: 4326 } }),
      symbol: { type: 'simple-fill', color: hexToRgba(zone.color, 0.12), outline: { color: hexToRgba(zone.color, 0.75), width: 1, style: 'short-dash' } },
    }))
    // Name label at centroid
    const cLng = (west + east) / 2
    const cLat = (south + north) / 2
    const labelText = zone.name.replace(' / ', '\n').replace(' (', '\n(')
    layer.add(new Graphic({
      geometry: new Point({ longitude: cLng, latitude: cLat, spatialReference: { wkid: 4326 } }),
      symbol: { type: 'text', text: labelText, color: hexToRgba(zone.color, 0.95), haloColor: [5, 10, 22, 0.92], haloSize: 1.5, font: { size: 10, family: 'Avenir Next', weight: 'bold' }, horizontalAlignment: 'center' },
    }))
  }
  layer.addMany([
    new Graphic({
      geometry: new Polygon({ rings: [GARBAGE_PATCH_RING], spatialReference: { wkid: 4326 } }),
      symbol: { type: 'simple-fill', color: [255,107,43,0.08], outline: { color: [255,107,43,0.85], width: 1.4, style: 'short-dash' } },
    }),
    new Graphic({
      geometry: new Point({ longitude: -148, latitude: 36, spatialReference: { wkid: 4326 } }),
      symbol: { type: 'text', text: 'Great Pacific\nGarbage Patch', color: [255,209,189,0.95], haloColor: [8,15,31,0.95], haloSize: 1.5, font: { size: 11, family: 'Avenir Next', weight: 'bold' }, horizontalAlignment: 'center' },
    }),
  ])
}

// ── Symbol factories (return plain objects, no Graphic wrapper) ────────────

function dotSymbol(type: IncidentType, isSelected: boolean): object {
  const cfg = INCIDENT_CONFIGS[type]
  const [r, g, b] = cfg.color

  if (type === 'oil_spill') return {
    type: 'simple-marker', style: 'circle',
    size: isSelected ? 5 : 3,
    color: [40, 20, 5, 0.9],
    outline: { color: [r, g, b, isSelected ? 0.9 : 0.5], width: isSelected ? 2 : 1 },
  }
  if (type === 'chemical') return {
    type: 'simple-marker', style: 'diamond',
    size: isSelected ? 14 : 10,
    color: [r, g, b, 0.95],
    outline: { color: isSelected ? [255,255,255,0.95] : [255,200,255,0.6], width: isSelected ? 2.5 : 1.8 },
  }
  if (type === 'sewage') return {
    type: 'simple-marker', style: 'circle',
    size: isSelected ? 12 : 8,
    color: [r, g, b, 0.75],
    outline: { color: isSelected ? [255,255,255,0.8] : [r, g, b, 0.3], width: isSelected ? 2 : 1 },
  }
  // plastic
  return {
    type: 'simple-marker', style: 'circle',
    size: isSelected ? 13 : 9,
    color: [r, g, b, 0.95],
    outline: { color: isSelected ? [255,255,255,0.95] : [8,15,31,0.9], width: isSelected ? 2.6 : 1.4 },
  }
}

/** Returns one symbol per plume ring for the given bottle state. */
function plumeSymbolList(bottle: Bottle): object[] {
  const type = bottle.incidentType ?? 'plastic'
  const cfg  = INCIDENT_CONFIGS[type]
  const [r, g, b] = cfg.color
  const days = Math.max(0, bottle.days_drifted)

  if (type === 'oil_spill') {
    const base = Math.min(60, 18 + days * 0.14)
    return [
      { size: base * 0.30, alpha: 0.55 },
      { size: base * 0.55, alpha: 0.32 },
      { size: base * 0.75, alpha: 0.17 },
      { size: base,        alpha: 0.08 },
    ].map(({ size, alpha }) => ({
      type: 'simple-marker', style: 'circle', size,
      color: [r, g, b, alpha], outline: { color: [0,0,0,0], width: 0 },
    }))
  }
  if (type === 'chemical') {
    const coreR = Math.min(22, 10 + days * 0.04)
    const haloR = Math.min(45, 20 + days * 0.08)
    return [
      { type: 'simple-marker', style: 'circle', size: coreR, color: [r, g, b, 0.28], outline: { color: [0,0,0,0], width: 0 } },
      { type: 'simple-marker', style: 'circle', size: haloR, color: [r, g, b, 0.07], outline: { color: [r, g, b, 0.45], width: 1.2 } },
    ]
  }
  if (type === 'sewage') {
    const radius = Math.min(50, 20 + days * 0.11)
    return [{ type: 'simple-marker', style: 'circle', size: radius, color: [r, g, b, 0.15], outline: { color: [r, g, b, 0.25], width: 1 } }]
  }
  // plastic
  const radius = Math.min(32, 12 + days * 0.07)
  return [{ type: 'simple-marker', style: 'circle', size: radius, color: [r, g, b, 0.12], outline: { color: [0,0,0,0], width: 0 } }]
}

// ── Graphic factories (used only on initial creation) ──────────────────────

function createDotGraphic(bottle: Bottle, isSelected: boolean): Graphic {
  const cfg = INCIDENT_CONFIGS[bottle.incidentType ?? 'plastic']
  return new Graphic({
    geometry: makePt(bottle.current_lat, bottle.current_lng),
    attributes: { bottleId: bottle.id, incidentType: cfg.label, status: bottle.status, daysDrifted: Math.round(bottle.days_drifted) },
    popupTemplate: { title: cfg.label, content: '<b>{incidentType}</b><br/>Status: {status}<br/>Days drifted: {daysDrifted}' },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    symbol: dotSymbol(bottle.incidentType ?? 'plastic', isSelected) as any,
  })
}

function createPlumeGraphics(bottle: Bottle, lat: number, lng: number): Graphic[] {
  const geo  = makePt(lat, lng)
  const syms = plumeSymbolList(bottle)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return syms.map(sym => new Graphic({ geometry: geo, symbol: sym as any }))
}

function createTrailGraphic(bottle: Bottle, isSelected: boolean): Graphic | null {
  const type = bottle.incidentType ?? 'plastic'
  if (type === 'oil_spill' || bottle.path.length < 2) return null

  const cfg  = INCIDENT_CONFIGS[type]
  const [r, g, b] = cfg.color
  const path = unwrapPathFromEnd(bottle.path, bottle.current_lng)

  const styles: Record<string, [number, number, number]> = {
    //                      width-normal  width-selected  alpha
    plastic:  [1.4, 2.2, 0.35],
    chemical: [1.0, 1.8, 0.55],
    sewage:   [0.9, 1.6, 0.22],
  }
  const [wn, ws, a] = styles[type] ?? styles.plastic

  return new Graphic({
    geometry: new Polyline({ paths: [path.map(([lat, lng]) => [lng, lat])], spatialReference: { wkid: 4326 } }),
    symbol: {
      type: 'simple-line',
      color: [r, g, b, isSelected ? Math.min(1, a * 2) : a],
      width: isSelected ? ws : wn,
      cap: 'round', join: 'round',
    },
  })
}
