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
import type { Bottle, MapController } from '@/types'
import type { InteractionMode } from './OceanMap'
import { useSimulationContext } from '@/simulation/context'
import { createDrifterCurrentsLayer } from '@/lib/arcgis/drifterCurrents'

interface Props {
  bottles: Bottle[]
  selectedBottle: Bottle | null
  mode: InteractionMode
  onMapClick: (lat: number, lng: number) => void
  onBottleClick: (bottle: Bottle) => void
  onMapReady?: (map: MapController) => void
}

interface LayerBundle {
  bottleLayer: GraphicsLayer
  plumeLayer: GraphicsLayer
  trailLayer: GraphicsLayer
  annotationLayer: GraphicsLayer
  currentsLayer: ImageryTileLayer
}

const GARBAGE_PATCH_BOUNDS = [
  [-155, 25],
  [-135, 25],
  [-135, 45],
  [-155, 45],
  [-155, 25],
]

export default function ArcGISMap({
  bottles,
  selectedBottle,
  mode,
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
  const { showFlowField } = useSimulationContext()

  modeRef.current = mode
  bottlesRef.current = bottles
  onMapClickRef.current = onMapClick
  onBottleClickRef.current = onBottleClick
  onMapReadyRef.current = onMapReady

  useEffect(() => {
    if (!containerRef.current) return

    const currentsLayer = createDrifterCurrentsLayer()
    const plumeLayer = new GraphicsLayer({ title: 'Spill Plume', blendMode: 'screen' })
    const trailLayer = new GraphicsLayer({ title: 'Bottle Trails' })
    const bottleLayer = new GraphicsLayer({ title: 'Bottle Particles' })
    const annotationLayer = new GraphicsLayer({ title: 'Ocean Risk Zones' })

    const map = new EsriMap({
      basemap: createPublicOceanBasemap(),
      layers: [currentsLayer, plumeLayer, trailLayer, bottleLayer, annotationLayer],
    })

    const view = new MapView({
      container: containerRef.current,
      map,
      center: [-150, 20],
      zoom: 3,
      constraints: {
        minZoom: 2,
        maxZoom: 8,
        rotationEnabled: false,
      },
    })

    view.ui.move('zoom', 'bottom-left')

    layersRef.current = {
      bottleLayer,
      plumeLayer,
      trailLayer,
      annotationLayer,
      currentsLayer,
    }
    viewRef.current = view

    onMapReadyRef.current?.({
      flyTo: (lat, lng, zoom = 5) => {
        void view.goTo({ center: [lng, lat], zoom }, { duration: 1200 })
      },
    })

    void view.when(async () => {
      drawStaticAnnotations(annotationLayer)
      syncCursor(view, modeRef.current)
    })

    const clickHandle = view.on('click', async (event) => {
      const hit = await view.hitTest(event)
      const bottleGraphic = hit.results.find((result) =>
        'graphic' in result && result.graphic.layer === bottleLayer
      )
      const graphic = bottleGraphic && 'graphic' in bottleGraphic ? bottleGraphic.graphic : null
      const bottleId = graphic?.attributes?.bottleId as string | undefined
      if (bottleId) {
        const bottle = bottlesRef.current.find((item) => item.id === bottleId)
        if (bottle) {
          onBottleClickRef.current(bottle)
          return
        }
      }

      if (
        modeRef.current !== 'bottle' ||
        !event.mapPoint ||
        event.mapPoint.latitude == null ||
        event.mapPoint.longitude == null
      ) return

      onMapClickRef.current(event.mapPoint.latitude, normalizeLongitude(event.mapPoint.longitude))
    })

    return () => {
      clickHandle.remove()
      view.destroy()
      viewRef.current = null
      layersRef.current = null
    }
  }, [])

  useEffect(() => {
    if (!viewRef.current) return
    syncCursor(viewRef.current, mode)
  }, [mode])

  useEffect(() => {
    if (!layersRef.current) return
    layersRef.current.currentsLayer.visible = showFlowField
  }, [showFlowField])

  useEffect(() => {
    if (!layersRef.current) return

    const { bottleLayer, plumeLayer, trailLayer } = layersRef.current

    bottleLayer.removeAll()
    plumeLayer.removeAll()
    trailLayer.removeAll()

    const bottleGraphics: Graphic[] = []
    const plumeGraphics: Graphic[] = []
    const trailGraphics: Graphic[] = []

    for (const bottle of bottles) {
      const isSelected = selectedBottle?.id === bottle.id

      plumeGraphics.push(createPlumeGraphic(bottle))
      bottleGraphics.push(createBottleGraphic(bottle, isSelected))

      const trailGraphic = createTrailGraphic(bottle, isSelected)
      if (trailGraphic) trailGraphics.push(trailGraphic)
    }

    plumeLayer.addMany(plumeGraphics)
    trailLayer.addMany(trailGraphics)
    bottleLayer.addMany(bottleGraphics)
  }, [bottles, selectedBottle])

  return <div ref={containerRef} className="w-full h-full arcgis-map-shell" />
}

function syncCursor(view: MapView, mode: InteractionMode) {
  if (!view.container) return
  view.container.style.cursor = mode === 'bottle' ? 'crosshair' : 'grab'
}

function createPublicOceanBasemap() {
  return new Basemap({
    baseLayers: [
      new WebTileLayer({
        urlTemplate: 'https://{subDomain}.basemaps.cartocdn.com/dark_nolabels/{level}/{col}/{row}.png',
        subDomains: ['a', 'b', 'c', 'd'],
        copyright: '&copy; OpenStreetMap contributors &copy; CARTO',
      }),
    ],
    referenceLayers: [
      new WebTileLayer({
        urlTemplate: 'https://{subDomain}.basemaps.cartocdn.com/dark_only_labels/{level}/{col}/{row}.png',
        subDomains: ['a', 'b', 'c', 'd'],
        copyright: '&copy; OpenStreetMap contributors &copy; CARTO',
      }),
    ],
    title: 'Ocean Dark',
  })
}

function drawStaticAnnotations(layer: GraphicsLayer) {
  layer.removeAll()

  layer.addMany([
    new Graphic({
      geometry: new Polygon({
        rings: [GARBAGE_PATCH_BOUNDS],
        spatialReference: { wkid: 4326 },
      }),
      symbol: {
        type: 'simple-fill',
        color: [255, 107, 43, 0.08],
        outline: {
          color: [255, 107, 43, 0.85],
          width: 1.2,
          style: 'dash',
        },
      },
    }),
    new Graphic({
      geometry: new Point({
        longitude: -145,
        latitude: 35,
        spatialReference: { wkid: 4326 },
      }),
      symbol: {
        type: 'text',
        text: 'Great Pacific\nGarbage Patch',
        color: [255, 209, 189, 0.95],
        haloColor: [8, 15, 31, 0.95],
        haloSize: 1,
        font: {
          size: 11,
          family: 'Avenir Next',
          weight: 'bold',
        },
      },
    }),
  ])
}

function createBottleGraphic(bottle: Bottle, isSelected: boolean) {
  const color = getBottleColor(bottle.status)

  return new Graphic({
    geometry: new Point({
      longitude: normalizeLongitude(bottle.current_lng),
      latitude: bottle.current_lat,
      spatialReference: { wkid: 4326 },
    }),
    attributes: {
      bottleId: bottle.id,
      authorName: bottle.author_name,
      message: bottle.message,
      status: bottle.status,
      daysDrifted: bottle.days_drifted,
    },
    symbol: {
      type: 'simple-marker',
      style: 'circle',
      size: isSelected ? 12 : 8,
      color,
      outline: {
        color: isSelected ? [255, 255, 255, 0.95] : [8, 15, 31, 0.9],
        width: isSelected ? 2.4 : 1.4,
      },
    },
    popupTemplate: {
      title: '{authorName}',
      content:
        '{message}<br/><br/><b>Status:</b> {status}<br/><b>Days adrift:</b> {daysDrifted}',
    },
  })
}

function createPlumeGraphic(bottle: Bottle) {
  const color = bottle.status === 'garbage_patch'
    ? [255, 140, 69, 0.2]
    : bottle.status === 'ashore'
      ? [80, 200, 120, 0.12]
      : [90, 179, 255, 0.12]

  const radius = Math.min(36, 12 + Math.max(0, bottle.days_drifted) * 0.08)

  return new Graphic({
    geometry: new Point({
      longitude: normalizeLongitude(bottle.current_lng),
      latitude: bottle.current_lat,
      spatialReference: { wkid: 4326 },
    }),
    symbol: {
      type: 'simple-marker',
      style: 'circle',
      size: radius,
      color,
      outline: {
        color: [255, 255, 255, 0],
        width: 0,
      },
    },
  })
}

function createTrailGraphic(bottle: Bottle, isSelected: boolean) {
  if (bottle.path.length < 2) return null

  return new Graphic({
    geometry: new Polyline({
      paths: [bottle.path.map(([lat, lng]) => [normalizeLongitude(lng), lat])],
      spatialReference: { wkid: 4326 },
    }),
    symbol: {
      type: 'simple-line',
      color: bottle.status === 'garbage_patch'
        ? [255, 140, 69, isSelected ? 0.65 : 0.38]
        : [95, 182, 255, isSelected ? 0.65 : 0.3],
      width: isSelected ? 2.2 : 1.4,
      cap: 'round',
      join: 'round',
    },
  })
}

function getBottleColor(status: Bottle['status']) {
  if (status === 'garbage_patch') return [255, 120, 40, 0.95]
  if (status === 'ashore') return [80, 204, 122, 0.95]
  return [80, 180, 255, 0.95]
}

function normalizeLongitude(lng: number) {
  return ((lng + 180) % 360 + 360) % 360 - 180
}
