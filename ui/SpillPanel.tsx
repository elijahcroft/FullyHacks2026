'use client'

import type { SpillMarker } from '@/types'
import type { InterceptionResult } from '@/lib/spillInterception'

interface Props {
  spill: SpillMarker | null
  vesselStart: [number, number] | null
  interceptionResult: InterceptionResult | null
  onClear: () => void
}

function fmtDays(days: number): string {
  if (days < 7) return `${days} day${days !== 1 ? 's' : ''}`
  const weeks = Math.round(days / 7)
  if (days < 30) return `${weeks} wk${weeks !== 1 ? 's' : ''}`
  const months = Math.round(days / 30)
  return `${months} mo`
}

function fmtKm(km: number): string {
  return km >= 1000 ? `${(km / 1000).toFixed(1)}k km` : `${km.toLocaleString()} km`
}

function fmtCoord(lat: number, lng: number): string {
  return `${Math.abs(lat).toFixed(1)}°${lat >= 0 ? 'N' : 'S'} ${Math.abs(lng).toFixed(1)}°${lng >= 0 ? 'E' : 'W'}`
}

export function SpillPanel({ spill, vesselStart, interceptionResult, onClear }: Props) {
  if (!spill) return null

  return (
    <div className="fixed bottom-5 left-1/2 -translate-x-1/2 z-[1000] w-[360px] pointer-events-auto">
      <div className="bg-[#080f1f]/96 border border-white/10 rounded-2xl overflow-hidden backdrop-blur-md shadow-2xl">

        {/* Header */}
        <div className="flex items-center gap-2.5 px-4 py-3 border-b border-white/8">
          <div className="w-2.5 h-2.5 rounded-full bg-red-500 spill-pulse-dot shrink-0" />
          <span className="text-sm font-medium text-white/80 flex-1 tracking-wide">Spill Response Planner</span>
          <button
            onClick={onClear}
            className="text-white/25 hover:text-white/60 text-xl leading-none transition-colors px-1"
            title="Clear spill"
          >
            ×
          </button>
        </div>

        <div className="px-4 py-3 space-y-3">

          {/* Spill origin row */}
          <div className="flex items-center gap-3">
            <span className="text-red-400 text-sm leading-none">⬤</span>
            <div className="flex-1">
              <div className="text-[10px] text-white/30 uppercase tracking-wider mb-0.5">Spill origin</div>
              <div className="text-xs text-white/65 font-mono">{fmtCoord(spill.lat, spill.lng)}</div>
            </div>
            <div className="text-right">
              <div className="text-[10px] text-white/30 uppercase tracking-wider mb-0.5">Drift modeled</div>
              <div className="text-xs text-white/65">{spill.driftPath.length - 1} days</div>
            </div>
          </div>

          <div className="h-px bg-white/6" />

          {!vesselStart ? (
            /* Prompt to place vessel */
            <div className="flex items-center gap-3 py-0.5">
              <div className="w-6 h-6 rounded-full border border-blue-500/50 flex items-center justify-center shrink-0 text-blue-400 text-xs font-mono">
                2
              </div>
              <p className="text-xs text-white/45 leading-snug">
                Click the ocean to place a{' '}
                <span className="text-blue-300 font-medium">cleanup vessel</span> and find the fastest interception route
              </p>
            </div>
          ) : interceptionResult ? (
            <div className="space-y-2.5">

              {/* Status banner */}
              <div className={`rounded-xl px-3 py-2.5 flex items-start gap-2.5 ${
                interceptionResult.feasible
                  ? 'bg-emerald-500/10 border border-emerald-500/25'
                  : 'bg-amber-500/10 border border-amber-500/25'
              }`}>
                <span className="text-base mt-0.5">{interceptionResult.feasible ? '✅' : '⚠️'}</span>
                <div>
                  <div className={`text-xs font-semibold ${interceptionResult.feasible ? 'text-emerald-300' : 'text-amber-300'}`}>
                    {interceptionResult.feasible ? 'Interception feasible' : 'Outside interception window'}
                  </div>
                  <div className="text-[10px] text-white/40 mt-0.5 leading-snug">
                    {interceptionResult.feasible
                      ? `Vessel can reach spill before it escapes`
                      : `Spill escapes reach within ${spill.driftPath.length - 1} days — move vessel closer`}
                  </div>
                </div>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-1.5">
                <StatBox
                  label="Days to intercept"
                  value={interceptionResult.feasible ? fmtDays(interceptionResult.daysToIntercept) : '—'}
                  muted={!interceptionResult.feasible}
                />
                <StatBox
                  label="Vessel travels"
                  value={fmtKm(interceptionResult.vesselDistanceKm)}
                />
                <StatBox
                  label="Intercept point"
                  value={fmtCoord(interceptionResult.interceptionPoint[0], interceptionResult.interceptionPoint[1])}
                  small
                />
              </div>

            </div>
          ) : null}

        </div>
      </div>
    </div>
  )
}

function StatBox({ label, value, muted = false, small = false }: {
  label: string
  value: string
  muted?: boolean
  small?: boolean
}) {
  return (
    <div className="bg-white/3 border border-white/6 rounded-xl px-2 py-2 text-center">
      <div className="text-[9px] text-white/28 uppercase tracking-wider mb-1 leading-tight">{label}</div>
      <div className={`font-mono font-medium ${small ? 'text-[10px]' : 'text-sm'} ${muted ? 'text-white/22' : 'text-white/78'}`}>
        {value}
      </div>
    </div>
  )
}
