'use client'
/**
 * PERSON 1 — Map + UI
 */

import dynamic from 'next/dynamic'
import { useState, useRef } from 'react'
import { DropBottleModal } from './DropBottleModal'
import { BottleCard } from './BottleCard'
import { BottleList } from './BottleList'
import { SimControls } from './SimControls'
import { ModeToggle } from './ModeToggle'
import { useBottles } from '@/canvas/useBottles'
import { useSimulation } from '@/simulation/useSimulation'
import type { Bottle, MapController } from '@/types'

export type InteractionMode = 'drag' | 'bottle'

const ArcGISMap = dynamic(() => import('@/ui/ArcGISMap'), { ssr: false })

export function OceanMap() {
  const { bottles, addBottle, updateBottles, resetBottles } = useBottles()
  const [mode, setMode] = useState<InteractionMode>('drag')
  const [dropTarget, setDropTarget] = useState<{ lat: number; lng: number } | null>(null)
  const [selectedBottle, setSelectedBottle] = useState<Bottle | null>(null)
  const mapRef = useRef<MapController | null>(null)

  useSimulation(bottles, updateBottles)

  return (
    <div className="relative w-full h-full">
      <ArcGISMap
        bottles={bottles}
        selectedBottle={selectedBottle}
        mode={mode}
        onMapClick={(lat, lng) => {
          setSelectedBottle(null)
          setDropTarget({ lat, lng })
        }}
        onBottleClick={setSelectedBottle}
        onMapReady={(map) => { mapRef.current = map }}
      />
      <BottleList bottles={bottles} mapRef={mapRef} onReset={resetBottles} />

      {dropTarget && (
        <DropBottleModal
          lat={dropTarget.lat}
          lng={dropTarget.lng}
          onClose={() => setDropTarget(null)}
          onBottleDropped={(bottle) => {
            addBottle(bottle)
            setDropTarget(null)
            // Switch back to drag after dropping
            setMode('drag')
          }}
        />
      )}

      {selectedBottle && (
        <BottleCard bottle={selectedBottle} onClose={() => setSelectedBottle(null)} />
      )}

      {/* Mode toggle — top left */}
      <ModeToggle mode={mode} onChange={setMode} />

      {/* HUD — top center */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[1000] pointer-events-none select-none">
        <div className="bg-[#080f1f]/80 border border-white/10 rounded-full px-4 py-1.5 text-xs text-white/40 backdrop-blur-sm tracking-wide">
          {bottles.length} bottle{bottles.length !== 1 ? 's' : ''} adrift
          <span className="mx-2 text-white/15">·</span>
          {mode === 'bottle' ? 'click the ocean to drop' : 'drag to explore'}
        </div>
      </div>

      <SimControls />
    </div>
  )
}
