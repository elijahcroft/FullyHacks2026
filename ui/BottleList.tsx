'use client'

import type { RefObject } from 'react'
import type { Bottle, MapController } from '@/types'
import { INCIDENT_CONFIGS } from '@/types'

interface Props {
  bottles: Bottle[]
  mapRef: RefObject<MapController | null>
  onReset: () => void
  onSelect: (bottle: Bottle) => void
}

const STATUS_LABEL: Record<Bottle['status'], string> = {
  drifting: 'Drifting',
  garbage_patch: 'Garbage Patch',
  ashore: 'Ashore',
}

const STATUS_COLOR: Record<Bottle['status'], string> = {
  drifting: 'text-sky-400',
  garbage_patch: 'text-orange-400',
  ashore: 'text-emerald-400',
}

export function BottleList({ bottles, mapRef, onReset, onSelect }: Props) {
  const flyTo = (bottle: Bottle) => {
    mapRef.current?.flyTo(bottle.current_lat, bottle.current_lng, 5)
  }

  return (
    <div className="min-h-0 flex-1 flex flex-col gap-2 pointer-events-none">
      {/* Reset button */}
      <button
        onClick={onReset}
        className="pointer-events-auto w-full bg-[#080f1f]/80 border border-white/10 rounded-lg px-3 py-2 text-xs text-white/60 hover:text-white hover:border-white/20 backdrop-blur-sm tracking-wide transition-colors text-left"
      >
        Clear all incidents
      </button>

      {/* Bottle list */}
      <div className="hide-scrollbar pointer-events-auto flex flex-col gap-1.5 overflow-y-auto flex-1 pr-0.5">
        {bottles.length === 0 && (
          <p className="text-white/20 text-xs px-1">No incidents yet — click the ocean.</p>
        )}
        {bottles.map((bottle) => {
          const cfg = INCIDENT_CONFIGS[bottle.incidentType ?? 'plastic']
          return (
            <button
              key={bottle.id}
              onClick={() => { flyTo(bottle); onSelect(bottle) }}
              className="w-full text-left bg-[#080f1f]/80 border border-white/10 rounded-lg px-3 py-2.5 backdrop-blur-sm hover:border-white/25 transition-colors group"
            >
              <div className="flex items-center gap-1.5">
                <span className="text-sm">{cfg.emoji}</span>
                <div className="text-white/80 text-xs font-medium truncate group-hover:text-white transition-colors">
                  {cfg.label}
                </div>
              </div>
              <div className="flex items-center justify-between mt-1.5">
                <span className={`text-[10px] ${STATUS_COLOR[bottle.status]}`}>
                  {STATUS_LABEL[bottle.status]}
                </span>
                <span className="text-white/20 text-[10px]">
                  {Math.floor(bottle.days_drifted)}d
                </span>
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}
