'use client'
/**
 * PERSON 1 — Map + UI
 * App shell. Composes all pieces — no simulation or canvas logic lives here.
 */

import dynamic from 'next/dynamic'
import { useState } from 'react'
import { DropBottleModal } from './DropBottleModal'
import { BottleCard } from './BottleCard'
import { SimControls } from './SimControls'
import { useBottles } from '@/canvas/useBottles'
import { useSimulation } from '@/simulation/useSimulation'
import type { Bottle } from '@/types'

const LeafletMap = dynamic(() => import('@/ui/LeafletMap'), { ssr: false })

export function OceanMap() {
  const { bottles, addBottle, updateBottles } = useBottles()
  const [dropTarget, setDropTarget] = useState<{ lat: number; lng: number } | null>(null)
  const [selectedBottle, setSelectedBottle] = useState<Bottle | null>(null)

  useSimulation(bottles, updateBottles)

  return (
    <div className="relative w-full h-full">
      <LeafletMap
        bottles={bottles}
        selectedBottle={selectedBottle}
        onMapClick={(lat, lng) => { setSelectedBottle(null); setDropTarget({ lat, lng }) }}
        onBottleClick={setSelectedBottle}
      />

      {dropTarget && (
        <DropBottleModal
          lat={dropTarget.lat}
          lng={dropTarget.lng}
          onClose={() => setDropTarget(null)}
          onBottleDropped={(bottle) => {
            addBottle(bottle)
            setDropTarget(null)
          }}
        />
      )}

      {selectedBottle && (
        <BottleCard bottle={selectedBottle} onClose={() => setSelectedBottle(null)} />
      )}

      <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[1000] pointer-events-none select-none">
        <div className="bg-[#080f1f]/80 border border-white/10 rounded-full px-4 py-1.5 text-xs text-white/40 backdrop-blur-sm tracking-wide">
          {bottles.length} bottle{bottles.length !== 1 ? 's' : ''} adrift
          <span className="mx-2 text-white/15">·</span>
          click the ocean to drop one
        </div>
      </div>

      <SimControls />
    </div>
  )
}
