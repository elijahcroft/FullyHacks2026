'use client'
/**
 * PERSON 1 — Map + UI
 */

import dynamic from 'next/dynamic'
import { useState } from 'react'
import { DropBottleModal } from './DropBottleModal'
import { BottleCard } from './BottleCard'
import { useBottles } from '@/hooks/useBottles'
import type { Bottle } from '@/types'

const LeafletMap = dynamic(() => import('./LeafletMap'), { ssr: false })

export function OceanMap() {
  const { bottles, addBottle } = useBottles()
  const [dropTarget, setDropTarget] = useState<{ lat: number; lng: number } | null>(null)
  const [selectedBottle, setSelectedBottle] = useState<Bottle | null>(null)

  return (
    <div className="relative w-full h-full">
      <LeafletMap
        bottles={bottles}
        onMapClick={(lat, lng) => setDropTarget({ lat, lng })}
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

      <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[1000] pointer-events-none">
        <div className="bg-[#0d1b2e]/80 border border-blue-900/50 rounded-full px-4 py-1.5 text-xs text-blue-400 backdrop-blur-sm">
          {bottles.length} bottle{bottles.length !== 1 ? 's' : ''} adrift · click the ocean to drop one
        </div>
      </div>
    </div>
  )
}
