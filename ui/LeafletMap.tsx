'use client'
/**
 * PERSON 1 — Map + UI
 */

import { MapContainer, TileLayer, useMapEvents, useMap } from 'react-leaflet'
import { useEffect, useRef } from 'react'
import { CanvasOverlay } from '@/canvas/CanvasOverlay'
import { FlowOverlay } from '@/canvas/FlowOverlay'
import { useSimulationContext } from '@/simulation/context'
import type { Bottle } from '@/types'
import type { InteractionMode } from './OceanMap'
import L from 'leaflet'

interface Props {
  bottles: Bottle[]
  selectedBottle: Bottle | null
  mode: InteractionMode
  onMapClick: (lat: number, lng: number) => void
  onBottleClick: (bottle: Bottle) => void
}

function MapClickHandler({ mode, onMapClick }: { mode: InteractionMode; onMapClick: Props['onMapClick'] }) {
  useMapEvents({
    click(e) {
      if (mode === 'bottle') onMapClick(e.latlng.lat, e.latlng.lng)
    },
  })
  return null
}

function CursorController({ mode }: { mode: InteractionMode }) {
  const map = useMap()
  useEffect(() => {
    map.getContainer().style.cursor = mode === 'bottle' ? 'crosshair' : ''
  }, [map, mode])
  return null
}

function GarbagePatchOverlay() {
  const map = useMap()
  useEffect(() => {
    const rect = L.rectangle([[25, -155], [45, -135]], {
      color: '#ff6b2b', weight: 1, fillColor: '#ff6b2b',
      fillOpacity: 0.07, dashArray: '4 4', interactive: false,
    })
    rect.addTo(map)
    const label = L.tooltip({ permanent: true, direction: 'center', className: 'garbage-patch-label' })
      .setContent('Great Pacific<br>Garbage Patch')
      .setLatLng([35, -145])
    label.addTo(map)
    return () => { rect.remove(); label.remove() }
  }, [map])
  return null
}

function ZoomControls() {
  const map = useMap()
  const containerRef = useRef<HTMLDivElement>(null)

  // Prevent clicks on the zoom buttons from propagating to the Leaflet map
  // (which would trigger the drop-bottle click handler)
  useEffect(() => {
    if (containerRef.current) L.DomEvent.disableClickPropagation(containerRef.current)
  }, [])

  return (
    <div ref={containerRef} className="absolute bottom-5 left-4 z-[1000] flex flex-col gap-1.5">
      <button
        onClick={() => map.zoomIn()}
        className="w-9 h-9 bg-[#080f1f]/90 border border-white/10 rounded-xl text-white/50 hover:text-white hover:border-white/30 transition-all backdrop-blur-sm flex items-center justify-center text-lg leading-none select-none"
        title="Zoom in"
      >
        +
      </button>
      <button
        onClick={() => map.zoomOut()}
        className="w-9 h-9 bg-[#080f1f]/90 border border-white/10 rounded-xl text-white/50 hover:text-white hover:border-white/30 transition-all backdrop-blur-sm flex items-center justify-center text-lg leading-none select-none"
        title="Zoom out"
      >
        −
      </button>
    </div>
  )
}

const DARK_TILE  = 'https://{s}.basemaps.cartocdn.com/dark_nolabels/{z}/{x}/{y}{r}.png'
const LABEL_TILE = 'https://{s}.basemaps.cartocdn.com/dark_only_labels/{z}/{x}/{y}{r}.png'

function MapLayers({ bottles, selectedBottle, mode, onMapClick, onBottleClick }: Props) {
  const { showFlowField } = useSimulationContext()
  return (
    <>
      <TileLayer url={DARK_TILE} attribution='&copy; CartoDB' />
      <TileLayer url={LABEL_TILE} pane="shadowPane" />
      <MapClickHandler mode={mode} onMapClick={onMapClick} />
      <CursorController mode={mode} />
      <GarbagePatchOverlay />
      {showFlowField && <FlowOverlay />}
      <CanvasOverlay bottles={bottles} selectedBottle={selectedBottle} onBottleClick={onBottleClick} />
      <ZoomControls />
    </>
  )
}

export default function LeafletMap({ bottles, selectedBottle, mode, onMapClick, onBottleClick }: Props) {
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
      <MapLayers
        bottles={bottles}
        selectedBottle={selectedBottle}
        mode={mode}
        onMapClick={onMapClick}
        onBottleClick={onBottleClick}
      />
    </MapContainer>
  )
}
