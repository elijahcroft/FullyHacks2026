'use client'
/**
 * PERSON 1 — Map + UI
 *
 * Popup shown when user clicks a bottle particle.
 * Displays message, author, journey stats, and current status.
 */

import type { Bottle } from '@/types'

interface Props {
  bottle: Bottle
  onClose: () => void
}

const STATUS_LABELS: Record<string, string> = {
  drifting: '🌊 Drifting',
  garbage_patch: '⚠️ Trapped in garbage patch',
  ashore: '🏝️ Washed ashore',
}

export function BottleCard({ bottle, onClose }: Props) {
  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 w-full max-w-sm">
      <div className="bg-[#0d1b2e] border border-blue-900 rounded-xl p-5 text-white shadow-2xl">
        <div className="flex justify-between items-start mb-3">
          <div>
            <p className="font-semibold">{bottle.author_name || 'Anonymous'}</p>
            <p className="text-xs text-blue-400">
              {STATUS_LABELS[bottle.status]} · {Math.round(bottle.days_drifted)} days adrift
            </p>
          </div>
          <button onClick={onClose} className="text-blue-600 hover:text-white text-lg leading-none">
            ×
          </button>
        </div>

        <p className="text-sm leading-relaxed text-blue-100 mb-3">{bottle.message}</p>

        <div className="text-xs text-blue-500 space-y-1">
          <p>
            Start: {bottle.start_lat.toFixed(2)}°, {bottle.start_lng.toFixed(2)}°
          </p>
          <p>
            Now: {bottle.current_lat.toFixed(2)}°, {bottle.current_lng.toFixed(2)}°
          </p>
          {bottle.destination && <p>Destination: {bottle.destination}</p>}
        </div>
      </div>
    </div>
  )
}
