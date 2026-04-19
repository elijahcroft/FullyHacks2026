'use client'
/**
 * PERSON 1 — Map + UI
 */

import dynamic from 'next/dynamic'
import { useState, useRef } from 'react'
import type { Map as LeafletMapInstance } from 'leaflet'
import { DropBottleModal } from './DropBottleModal'
import { BottleCard } from './BottleCard'
import { BottleList } from './BottleList'
import { SimControls } from './SimControls'
import { ModeToggle } from './ModeToggle'
import { EnvironmentalImpactPanel } from './EnvironmentalImpactPanel'
import { GeminiChatWidget } from './GeminiChatWidget'
import { HazardOverlayControls } from './HazardOverlayControls'
import { useBottles } from '@/canvas/useBottles'
import { useSimulation } from '@/simulation/useSimulation'
import type { Bottle } from '@/types'
import type { OverlayType } from '@/lib/marineZones'

export type InteractionMode = 'drag' | 'bottle'

const LeafletMap = dynamic(() => import('@/ui/LeafletMap'), { ssr: false })

export function OceanMap() {
  const { bottles, addBottle, updateBottles, clearAllBottles } = useBottles()
  const [mode, setMode] = useState<InteractionMode>('drag')
  const [dropTarget, setDropTarget] = useState<{ lat: number; lng: number } | null>(null)
  const [selectedBottle, setSelectedBottle] = useState<Bottle | null>(null)
  const [activeOverlays, setActiveOverlays] = useState<Set<OverlayType>>(new Set())
  const mapRef = useRef<LeafletMapInstance | null>(null)

  function toggleOverlay(type: OverlayType) {
    setActiveOverlays(prev => {
      const next = new Set(prev)
      next.has(type) ? next.delete(type) : next.add(type)
      return next
    })
  }

  function handleMapClick(lat: number, lng: number) {
    if (mode === 'bottle') {
      setSelectedBottle(null)
      setDropTarget({ lat, lng })
    }
  }

  useSimulation(bottles, updateBottles)

  const hudHint =
    mode === 'bottle' ? 'click the ocean to drop' :
    'drag to explore'

  return (
    <div className="relative w-full h-full">
      <LeafletMap
        bottles={bottles}
        selectedBottle={selectedBottle}
        mode={mode}
        activeOverlays={activeOverlays}
        onMapClick={handleMapClick}
        onBottleClick={setSelectedBottle}
        onMapReady={(map) => { mapRef.current = map }}
      />

      {/* Left sidebar — mode toggle + bottle list stacked */}
      <div className="absolute left-3 top-3 bottom-3 z-[1000] w-56 flex flex-col gap-2 pointer-events-none">
        <ModeToggle mode={mode} onChange={setMode} />
        <BottleList bottles={bottles} mapRef={mapRef} onReset={clearAllBottles} />
      </div>

      {dropTarget && (
        <DropBottleModal
          lat={dropTarget.lat}
          lng={dropTarget.lng}
          onClose={() => setDropTarget(null)}
          onBottleDropped={(bottle) => {
            addBottle(bottle)
            setDropTarget(null)
            setMode('drag')
          }}
        />
      )}

      {selectedBottle && (
        <BottleCard bottle={selectedBottle} onClose={() => setSelectedBottle(null)} />
      )}

      <EnvironmentalImpactPanel
        bottle={selectedBottle}
        onClose={() => setSelectedBottle(null)}
      />

      {/* HUD — top center */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[1000] pointer-events-none select-none">
        <div className="bg-[#080f1f]/80 border border-white/10 rounded-full px-4 py-1.5 text-xs text-white/40 backdrop-blur-sm tracking-wide">
          {bottles.length} bottle{bottles.length !== 1 ? 's' : ''} adrift
          <span className="mx-2 text-white/15">·</span>
          {hudHint}
        </div>
      </div>

      <HazardOverlayControls activeOverlays={activeOverlays} onToggle={toggleOverlay} />

      <GeminiChatWidget bottles={bottles} selectedBottle={selectedBottle} />

      <SimControls />
    </div>
  )
}
