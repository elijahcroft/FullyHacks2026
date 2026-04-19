'use client'

import { useState, useEffect, useRef } from 'react'
import type { Bottle } from '@/types'
import { INCIDENT_CONFIGS } from '@/types'
import { loadFlowField, FLOW_FIELD_META } from '@/simulation/flowField'
import {
  FLEET_PRESETS, findNearestBase, computeIncidentInterception,
  type FleetPreset, type IncidentInterception,
} from '@/lib/interception'
import { haversineDistanceKm } from '@/lib/spillInterception'

interface Props {
  bottle: Bottle | null
  simDate: Date
  onClose: () => void
  onInterceptionComputed: (data: IncidentInterception | null) => void
}

function fmtCoord(lat: number, lng: number) {
  return `${Math.abs(lat).toFixed(2)}°${lat >= 0 ? 'N' : 'S'} ${Math.abs(lng).toFixed(2)}°${lng >= 0 ? 'E' : 'W'}`
}

function fmtDate(d: Date) {
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function fmtDays(n: number) {
  if (n <= 0) return 'immediately'
  if (n === 1) return '1 day'
  if (n < 7) return `${n} days`
  const w = Math.round(n / 7)
  return w === 1 ? '1 week' : `${w} weeks`
}

function fmtKm(km: number) {
  return km >= 1000 ? `${(km / 1000).toFixed(1)}k km` : `${km.toLocaleString()} km`
}

const URGENCY_GLOW: Record<string, string> = {
  critical: 'shadow-[0_0_40px_rgba(239,68,68,0.18)] border-red-500/30',
  high:     'shadow-[0_0_40px_rgba(168,85,247,0.18)] border-purple-500/30',
  medium:   'shadow-[0_0_40px_rgba(56,189,248,0.18)] border-sky-500/30',
  low:      'shadow-[0_0_40px_rgba(52,211,153,0.18)] border-emerald-500/30',
}

const URGENCY_TEXT: Record<string, string> = {
  critical: 'text-red-400',
  high:     'text-purple-400',
  medium:   'text-sky-400',
  low:      'text-emerald-400',
}

const URGENCY_BG: Record<string, string> = {
  critical: 'bg-red-500/10 border-red-500/25',
  high:     'bg-purple-500/10 border-purple-500/25',
  medium:   'bg-sky-500/10 border-sky-500/25',
  low:      'bg-emerald-500/10 border-emerald-500/25',
}

export function InterceptionPanel({ bottle, simDate, onClose, onInterceptionComputed }: Props) {
  const [fleet, setFleet] = useState<FleetPreset>(FLEET_PRESETS[1]) // coast guard default
  const [result, setResult] = useState<IncidentInterception | null>(null)
  const [loading, setLoading] = useState(false)
  const prevKey = useRef('')

  const cfg = bottle ? INCIDENT_CONFIGS[bottle.incidentType ?? 'plastic'] : null

  useEffect(() => {
    if (!bottle) { setResult(null); onInterceptionComputed(null); return }
    const key = `${bottle.id}-${fleet.id}-${Math.floor(bottle.days_drifted / 30)}`
    if (key === prevKey.current) return
    prevKey.current = key

    setLoading(true)
    loadFlowField().then(({ field, meta }) => {
      const computed = computeIncidentInterception(bottle, fleet, field, meta)
      setResult(computed)
      onInterceptionComputed(computed)
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [bottle, fleet, onInterceptionComputed])

  // Recompute when fleet changes
  useEffect(() => { prevKey.current = '' }, [fleet])

  const visible = Boolean(bottle)

  return (
    <div
      className={`fixed top-0 right-0 bottom-0 z-[1200] w-[400px] flex flex-col transition-transform duration-300 ease-out ${
        visible ? 'translate-x-0' : 'translate-x-full'
      }`}
      style={{ background: 'linear-gradient(180deg, #060c1a 0%, #050b18 100%)' }}
    >
      {bottle && cfg && (
        <>
          {/* ── Header ─────────────────────────────────────────────────── */}
          <div className="px-5 pt-5 pb-4 border-b border-white/8 shrink-0">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-2.5">
                <span className="text-2xl">{cfg.emoji}</span>
                <div>
                  <h2 className="text-sm font-semibold text-white tracking-wide">{cfg.label}</h2>
                  <p className="text-[10px] text-white/35 mt-0.5 uppercase tracking-widest">
                    Predictive Interception
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded-full border ${URGENCY_BG[cfg.urgency]} ${URGENCY_TEXT[cfg.urgency]}`}>
                  {cfg.urgency}
                </span>
                <button
                  onClick={onClose}
                  className="size-7 flex items-center justify-center rounded-lg bg-white/5 hover:bg-white/10 text-white/30 hover:text-white transition-all text-sm"
                >
                  ×
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <MiniStat label="Current position" value={fmtCoord(bottle.current_lat, bottle.current_lng)} mono />
              <MiniStat label="Days drifted" value={`${Math.floor(bottle.days_drifted)} days`} />
            </div>
          </div>

          {/* ── Scrollable body ─────────────────────────────────────────── */}
          <div className="flex-1 overflow-y-auto min-h-0 px-5 py-4 space-y-5">

            {/* Fleet selector */}
            <section>
              <SectionLabel icon="🚀" text="Response Fleet" />
              <div className="grid grid-cols-2 gap-2 mt-2.5">
                {FLEET_PRESETS.map(f => (
                  <button
                    key={f.id}
                    onClick={() => setFleet(f)}
                    className={`text-left rounded-xl px-3 py-2.5 border transition-all ${
                      fleet.id === f.id
                        ? 'bg-blue-600/20 border-blue-500/60 ring-1 ring-blue-500/30'
                        : 'bg-white/3 border-white/8 hover:border-white/20 hover:bg-white/5'
                    }`}
                  >
                    <div className="text-base mb-1">{f.icon}</div>
                    <div className="text-xs font-semibold text-white/90">{f.label}</div>
                    <div className="text-[10px] text-white/40 mt-0.5 leading-tight">{f.description}</div>
                    <div className={`text-[10px] font-mono mt-1.5 font-medium ${fleet.id === f.id ? 'text-blue-300' : 'text-white/35'}`}>
                      {f.speedKmDay.toLocaleString()} km/day
                    </div>
                  </button>
                ))}
              </div>
            </section>

            <Divider />

            {/* ── Main interception block ──────────────────────────────── */}
            <section>
              <SectionLabel icon="🎯" text="Interception Analysis" />

              {loading ? (
                <div className="mt-3 rounded-2xl bg-white/3 border border-white/8 p-6 flex flex-col items-center gap-3">
                  <div className="size-6 border-2 border-blue-400/60 border-t-transparent rounded-full animate-spin" />
                  <span className="text-xs text-white/35">Computing optimal intercept…</span>
                </div>
              ) : result ? (
                <div className="mt-3 space-y-3">
                  {/* Feasibility banner */}
                  {result.feasible ? (
                    <div className="rounded-xl bg-emerald-500/8 border border-emerald-500/25 px-3.5 py-2.5 flex items-center gap-2.5">
                      <span className="text-base">✅</span>
                      <div>
                        <p className="text-xs font-semibold text-emerald-300">Interception feasible</p>
                        <p className="text-[10px] text-white/40 mt-0.5">Vessel can reach before the 90-day drift window closes</p>
                      </div>
                    </div>
                  ) : (
                    <div className="rounded-xl bg-red-500/8 border border-red-500/25 px-3.5 py-2.5 flex items-center gap-2.5">
                      <span className="text-base">⚠️</span>
                      <div>
                        <p className="text-xs font-semibold text-red-300">Outside intercept window</p>
                        <p className="text-[10px] text-white/40 mt-0.5">Try a faster fleet or a closer response base</p>
                      </div>
                    </div>
                  )}

                  {/* Hero interception card */}
                  <div className={`rounded-2xl border p-4 ${URGENCY_GLOW[cfg.urgency]}`}
                    style={{ background: 'linear-gradient(135deg, rgba(6,12,26,0.9) 0%, rgba(8,15,31,0.95) 100%)' }}
                  >
                    {/* Target label */}
                    <div className="flex items-center gap-2 mb-3">
                      <div className={`size-2 rounded-full animate-pulse ${
                        cfg.urgency === 'critical' ? 'bg-red-400' :
                        cfg.urgency === 'high' ? 'bg-purple-400' :
                        cfg.urgency === 'medium' ? 'bg-sky-400' : 'bg-emerald-400'
                      }`} />
                      <span className="text-[10px] uppercase tracking-[0.2em] text-white/40 font-medium">Deploy Here</span>
                    </div>

                    {/* Coordinates — the big hero number */}
                    <p className={`text-xl font-mono font-bold tracking-tight mb-1 ${URGENCY_TEXT[cfg.urgency]}`}>
                      {fmtCoord(result.point[0], result.point[1])}
                    </p>

                    <div className="border-t border-white/6 mt-3 pt-3 grid grid-cols-2 gap-3">
                      <div>
                        <p className="text-[10px] text-white/30 uppercase tracking-widest mb-0.5">Deploy By</p>
                        <p className="text-sm font-semibold text-white/90">{fmtDate(result.interceptDate)}</p>
                        <p className="text-[10px] text-white/40 mt-0.5">{fmtDays(result.daysToIntercept)} from now</p>
                      </div>
                      <div>
                        <p className="text-[10px] text-white/30 uppercase tracking-widest mb-0.5">Vessel Travels</p>
                        <p className="text-sm font-semibold text-white/90">{fmtKm(result.vesselDistanceKm)}</p>
                        <p className="text-[10px] text-white/40 mt-0.5">{result.fleet.label} vessel</p>
                      </div>
                    </div>
                  </div>

                  {/* Timeline */}
                  {result.feasible && (
                    <InterceptTimeline
                      totalDays={result.futurePath.length - 1}
                      interceptDay={result.daysToIntercept}
                      urgency={cfg.urgency}
                      simDate={simDate}
                    />
                  )}

                  {/* Stats row */}
                  <div className="grid grid-cols-3 gap-2">
                    <StatBox label="Base" value={result.base.name} small />
                    <StatBox label="Base dist" value={fmtKm(result.baseDistanceKm)} />
                    <StatBox label="Drift days" value={`${result.futurePath.length - 1}d`} />
                  </div>
                </div>
              ) : null}
            </section>

            <Divider />

            {/* Nearest base info */}
            {bottle && (
              <section>
                <SectionLabel icon="⚓" text="Nearest Response Base" />
                <NearestBaseCard lat={bottle.current_lat} lng={bottle.current_lng} fleet={fleet} />
              </section>
            )}

          </div>
        </>
      )}
    </div>
  )
}

// ── Sub-components ─────────────────────────────────────────────────────────

function SectionLabel({ icon, text }: { icon: string; text: string }) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-sm">{icon}</span>
      <span className="text-xs text-white/50 tracking-wide font-medium">{text}</span>
    </div>
  )
}

function Divider() {
  return <div className="border-t border-white/5" />
}

function MiniStat({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="bg-white/3 border border-white/5 rounded-xl px-3 py-2">
      <p className="text-[10px] text-white/25 uppercase tracking-widest mb-0.5">{label}</p>
      <p className={`text-xs text-white/70 ${mono ? 'font-mono' : ''}`}>{value}</p>
    </div>
  )
}

function StatBox({ label, value, small }: { label: string; value: string; small?: boolean }) {
  return (
    <div className="bg-white/3 border border-white/6 rounded-xl px-2.5 py-2.5 text-center">
      <p className="text-[9px] text-white/28 uppercase tracking-wider mb-1 leading-tight">{label}</p>
      <p className={`font-mono font-medium text-white/75 ${small ? 'text-[10px]' : 'text-sm'}`}>{value}</p>
    </div>
  )
}

function InterceptTimeline({
  totalDays, interceptDay, urgency, simDate,
}: {
  totalDays: number
  interceptDay: number
  urgency: string
  simDate: Date
}) {
  const pct = Math.min(100, (interceptDay / Math.max(1, totalDays)) * 100)

  const accentClass =
    urgency === 'critical' ? 'bg-red-400' :
    urgency === 'high'     ? 'bg-purple-400' :
    urgency === 'medium'   ? 'bg-sky-400' : 'bg-emerald-400'

  const accentText =
    urgency === 'critical' ? 'text-red-400' :
    urgency === 'high'     ? 'text-purple-400' :
    urgency === 'medium'   ? 'text-sky-400' : 'text-emerald-400'

  const deployDate = new Date(simDate.getTime() + interceptDay * 86_400_000)
  const endDate    = new Date(simDate.getTime() + totalDays   * 86_400_000)

  return (
    <div className="bg-white/3 border border-white/6 rounded-xl px-3.5 py-3">
      <p className="text-[10px] text-white/30 uppercase tracking-widest mb-3">Response Timeline</p>

      {/* Bar */}
      <div className="relative h-1.5 bg-white/8 rounded-full mb-4">
        {/* Filled portion */}
        <div
          className={`absolute inset-y-0 left-0 rounded-full ${accentClass} opacity-70`}
          style={{ width: `${pct}%` }}
        />
        {/* Intercept dot */}
        <div
          className={`absolute top-1/2 -translate-y-1/2 -translate-x-1/2 size-3 rounded-full ${accentClass} border-2 border-[#060c1a] shadow-lg`}
          style={{ left: `${pct}%` }}
        />
        {/* End dot */}
        <div className="absolute top-1/2 -translate-y-1/2 right-0 size-2 rounded-full bg-white/20 border border-white/10" />
      </div>

      {/* Labels */}
      <div className="flex items-start justify-between text-[10px]">
        <div>
          <p className="text-white/50 font-medium">Now</p>
          <p className="text-white/25 font-mono mt-0.5">{fmtDate(simDate)}</p>
        </div>
        <div className="text-center" style={{ marginLeft: `${Math.max(0, pct - 12)}%`, marginRight: `${Math.max(0, 88 - pct)}%` }}>
          <p className={`font-semibold ${accentText}`}>Intercept</p>
          <p className="text-white/25 font-mono mt-0.5">{fmtDate(deployDate)}</p>
        </div>
        <div className="text-right">
          <p className="text-white/50 font-medium">Day {totalDays}</p>
          <p className="text-white/25 font-mono mt-0.5">{fmtDate(endDate)}</p>
        </div>
      </div>
    </div>
  )
}

function NearestBaseCard({ lat, lng, fleet }: { lat: number; lng: number; fleet: FleetPreset }) {
  const base = findNearestBase(lat, lng)
  const dist = Math.round(haversineDistanceKm(lat, lng, base.lat, base.lng))
  const transitDays = Math.ceil(dist / fleet.speedKmDay)

  return (
    <div className="mt-2.5 bg-white/3 border border-white/8 rounded-xl p-3.5 flex items-center gap-3">
      <div className="size-9 rounded-lg bg-blue-500/15 border border-blue-500/25 flex items-center justify-center text-lg shrink-0">
        ⚓
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-semibold text-white/80 truncate">{base.name}</p>
        <p className="text-[10px] text-white/40 mt-0.5">{dist.toLocaleString()} km away</p>
      </div>
      <div className="text-right shrink-0">
        <p className="text-xs font-mono font-medium text-blue-300">{transitDays}d transit</p>
        <p className="text-[10px] text-white/30 mt-0.5">{fleet.label}</p>
      </div>
    </div>
  )
}
