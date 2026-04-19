'use client'
/**
 * PERSON 1 — Map + UI
 */

import type { Bottle } from '@/types'
import { INCIDENT_CONFIGS } from '@/types'

interface Props {
  bottle: Bottle
  onClose: () => void
}

const STATUS: Record<string, { label: string; color: string }> = {
  drifting:      { label: 'Drifting',                    color: 'text-blue-400' },
  garbage_patch: { label: 'Trapped in garbage patch',    color: 'text-orange-400' },
  ashore:        { label: 'Washed ashore',               color: 'text-emerald-400' },
}

function formatDays(days: number) {
  if (days < 1)   return '< 1 day'
  if (days < 30)  return `${Math.round(days)} day${Math.round(days) !== 1 ? 's' : ''}`
  if (days < 365) return `${Math.round(days / 30)} month${Math.round(days / 30) !== 1 ? 's' : ''}`
  return `${(days / 365).toFixed(1)} years`
}

function coord(lat: number, lng: number) {
  return `${Math.abs(lat).toFixed(2)}°${lat >= 0 ? 'N' : 'S'} ${Math.abs(lng).toFixed(2)}°${lng >= 0 ? 'E' : 'W'}`
}

const URGENCY_BADGE: Record<string, string> = {
  critical: 'bg-orange-500/20 text-orange-300 border border-orange-500/40',
  high:     'bg-purple-500/20 text-purple-300 border border-purple-500/40',
  medium:   'bg-sky-500/20 text-sky-300 border border-sky-500/40',
  low:      'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40',
}

export function BottleCard({ bottle, onClose }: Props) {
  const status = STATUS[bottle.status] ?? STATUS.drifting
  const incident = INCIDENT_CONFIGS[bottle.incidentType ?? 'plastic']

  return (
    <div className="fixed bottom-5 left-1/2 -translate-x-1/2 z-[1500] w-full max-w-sm mx-4 px-4">
      <div className="bg-[#080f1f] border border-white/10 rounded-2xl overflow-hidden shadow-2xl">
        {/* Status bar */}
        <div className="px-4 pt-4 pb-3 border-b border-white/5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-base">{incident.emoji}</span>
            <span className="text-sm font-semibold text-white/90">{incident.label}</span>
            <span className={`text-[10px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded-full ${URGENCY_BADGE[incident.urgency]}`}>
              {incident.urgency}
            </span>
          </div>
          <button onClick={onClose} className="text-white/25 hover:text-white/60 transition-colors leading-none">×</button>
        </div>

        <div className="px-4 py-3 space-y-3">
          {/* Drift status */}
          <div className="flex items-center gap-2">
            <span className={`text-xs font-medium ${status.color}`}>{status.label}</span>
            <span className="text-white/20 text-xs">·</span>
            <span className="text-white/40 text-xs">{formatDays(bottle.days_drifted)} adrift</span>
          </div>

          {/* Journey */}
          <div className="border-t border-white/5 pt-2 grid grid-cols-2 gap-2">
            <div>
              <p className="text-[10px] text-white/25 uppercase tracking-widest mb-0.5">Origin</p>
              <p className="text-xs text-white/50 font-mono">{coord(bottle.start_lat, bottle.start_lng)}</p>
            </div>
            <div>
              <p className="text-[10px] text-white/25 uppercase tracking-widest mb-0.5">Current</p>
              <p className="text-xs text-white/50 font-mono">{coord(bottle.current_lat, bottle.current_lng)}</p>
            </div>
          </div>

          {bottle.destination && (
            <p className="text-xs text-orange-400/70">⚠ {bottle.destination}</p>
          )}
        </div>
      </div>
    </div>
  )
}
