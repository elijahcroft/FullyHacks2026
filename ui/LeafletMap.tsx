'use client'
/**
 * PERSON 1 — Map + UI
 *
 * Leaflet map shell: tile layers, click handler, garbage patch rectangle.
 * Canvas rendering is Person 4's CanvasOverlay — don't edit that here.
 *
 * Must be loaded via dynamic import with ssr:false (Leaflet needs the DOM).
 */

import { MapContainer, TileLayer, useMapEvents } from 'react-leaflet'
import { useEffect } from 'react'
import { useMap } from 'react-leaflet'
import { CanvasOverlay } from '@/canvas/CanvasOverlay'
import { FlowOverlay } from '@/canvas/FlowOverlay'
import { useSimulationContext } from '@/simulation/context'
import type { Bottle } from '@/types'
import L from 'leaflet'

interface Props {
  bottles: Bottle[]
  onMapClick: (lat: number, lng: number) => void
  onBottleClick: (bottle: Bottle) => void
  onMapReady?: (map: L.Map) => void
}

function MapClickHandler({ onMapClick }: { onMapClick: Props['onMapClick'] }) {
  useMapEvents({
    click(e) {
      onMapClick(e.latlng.lat, e.latlng.lng)
    },
  })
  return null
}

function GarbagePatchOverlay() {
  const map = useMap()
  useEffect(() => {
    const rect = L.rectangle([[25, -155], [45, -135]], {
      color: '#ff6b2b',
      weight: 1,
      fillColor: '#ff6b2b',
      fillOpacity: 0.07,
      dashArray: '4 4',
      interactive: false,
    })
    rect.addTo(map)

    // Label
    const label = L.tooltip({ permanent: true, direction: 'center', className: 'garbage-patch-label' })
      .setContent('Great Pacific<br>Garbage Patch')
      .setLatLng([35, -145])
    label.addTo(map)

    return () => { rect.remove(); label.remove() }
  }, [map])
  return null
}

const DARK_TILE  = 'https://{s}.basemaps.cartocdn.com/dark_nolabels/{z}/{x}/{y}{r}.png'
const LABEL_TILE = 'https://{s}.basemaps.cartocdn.com/dark_only_labels/{z}/{x}/{y}{r}.png'

function MapReadyHandler({ onMapReady }: { onMapReady?: (map: L.Map) => void }) {
  const map = useMap()
  useEffect(() => { onMapReady?.(map) }, [map, onMapReady])
  return null
}

function MapLayers({ bottles, onMapClick, onBottleClick, onMapReady }: Props) {
  const { showFlowField } = useSimulationContext()
  return (
    <>
      <TileLayer url={DARK_TILE} attribution='&copy; CartoDB' />
      <TileLayer url={LABEL_TILE} pane="shadowPane" />
      <MapReadyHandler onMapReady={onMapReady} />
      <MapClickHandler onMapClick={onMapClick} />
      <GarbagePatchOverlay />
      {showFlowField && <FlowOverlay />}
      <CanvasOverlay bottles={bottles} onBottleClick={onBottleClick} />
    </>
  )
}

export default function LeafletMap({ bottles, onMapClick, onBottleClick, onMapReady }: Props) {
  return (
    <MapContainer
      center={[20, -150]}
      zoom={3}
      minZoom={2}
      maxZoom={8}
      style={{ width: '100%', height: '100%', background: '#060d1a' }}
      zoomControl={false}
      worldCopyJump
    >
      <MapLayers bottles={bottles} onMapClick={onMapClick} onBottleClick={onBottleClick} onMapReady={onMapReady} />
    </MapContainer>
  )
}
