'use client'

import { useState, useEffect, useRef } from 'react'
import type { Bottle } from '@/types'
import { INCIDENT_CONFIGS } from '@/types'
import { loadFlowField } from '@/simulation/flowField'
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

// ── helpers ───────────────────────────────────────────────────────────────

function fmtLat(lat: number) {
  return `${Math.abs(lat).toFixed(3)}° ${lat >= 0 ? 'N' : 'S'}`
}
function fmtLng(lng: number) {
  return `${Math.abs(lng).toFixed(3)}° ${lng >= 0 ? 'E' : 'W'}`
}
function fmtDate(d: Date) {
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}
function fmtDays(n: number) {
  if (n <= 0) return 'immediately'
  if (n === 1) return '1 day'
  if (n < 14) return `${n} days`
  const w = Math.round(n / 7)
  return `${w} week${w !== 1 ? 's' : ''}`
}
function fmtKm(km: number) {
  return km >= 1000 ? `${(km / 1000).toFixed(1)}k km` : `${km.toLocaleString()} km`
}

// per-urgency colour tokens
const ACCENT: Record<string, { border: string; text: string; glow: string; dot: string; badge: string; fill: string }> = {
  critical: {
    border: 'border-l-red-500',
    text:   'text-red-400',
    glow:   '0 0 60px rgba(239,68,68,0.22)',
    dot:    'bg-red-500',
    badge:  'bg-red-500/15 border-red-500/40 text-red-300',
    fill:   'bg-red-500',
  },
  high: {
    border: 'border-l-purple-500',
    text:   'text-purple-400',
    glow:   '0 0 60px rgba(168,85,247,0.22)',
    dot:    'bg-purple-500',
    badge:  'bg-purple-500/15 border-purple-500/40 text-purple-300',
    fill:   'bg-purple-500',
  },
  medium: {
    border: 'border-l-sky-500',
    text:   'text-sky-400',
    glow:   '0 0 60px rgba(56,189,248,0.22)',
    dot:    'bg-sky-500',
    badge:  'bg-sky-500/15 border-sky-500/40 text-sky-300',
    fill:   'bg-sky-500',
  },
  low: {
    border: 'border-l-emerald-500',
    text:   'text-emerald-400',
    glow:   '0 0 60px rgba(52,211,153,0.22)',
    dot:    'bg-emerald-500',
    badge:  'bg-emerald-500/15 border-emerald-500/40 text-emerald-300',
    fill:   'bg-emerald-500',
  },
}

// ── component ─────────────────────────────────────────────────────────────

export function InterceptionPanel({ bottle, simDate, onClose, onInterceptionComputed }: Props) {
  const [fleet, setFleet]   = useState<FleetPreset>(FLEET_PRESETS[1])
  const [result, setResult] = useState<IncidentInterception | null>(null)
  const [loading, setLoading] = useState(false)

  // Single stable compute key — avoids re-running on every position tick
  const computeKey = useRef('')

  const cfg     = bottle ? INCIDENT_CONFIGS[bottle.incidentType ?? 'plastic'] : null
  const accent  = cfg ? ACCENT[cfg.urgency] : ACCENT.medium
  const visible = Boolean(bottle)

  useEffect(() => {
    if (!bottle) {
      setResult(null)
      computeKey.current = ''
      onInterceptionComputed(null)
      return
    }

    // Recompute when bottle identity, fleet, or drift epoch (every 30 days) changes
    const key = `${bottle.id}|${fleet.id}|${Math.floor(bottle.days_drifted / 30)}`
    if (key === computeKey.current) return
    computeKey.current = key

    setLoading(true)
    loadFlowField()
      .then(({ field, meta }) => {
        const r = computeIncidentInterception(bottle, fleet, field, meta)
        setResult(r)
        onInterceptionComputed(r)
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bottle, fleet])

  return (
    <div
      className={`fixed top-0 right-0 bottom-0 z-[1200] w-[460px] flex flex-col border-l-4 ${accent.border} transition-transform duration-300 ease-out ${visible ? 'translate-x-0' : 'translate-x-full'}`}
      style={{
        background: 'linear-gradient(180deg, #0a1628 0%, #080f1f 60%, #060c1a 100%)',
        boxShadow: `-8px 0 48px rgba(0,0,0,0.7), ${accent.glow}`,
      }}
    >
      {bottle && cfg && (
        <>
          {/* ── Header ──────────────────────────────────────────────────── */}
          <div className="px-5 pt-5 pb-4 border-b border-white/8 shrink-0">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-2xl leading-none">{cfg.emoji}</span>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-white tracking-wide">{cfg.label}</span>
                    <span className={`text-[9px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded-full border ${accent.badge}`}>
                      {cfg.urgency}
                    </span>
                  </div>
                  <p className="text-[10px] text-white/35 mt-0.5 uppercase tracking-[0.18em]">
                    Predictive Interception
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="size-8 flex items-center justify-center rounded-xl bg-white/5 hover:bg-white/12 text-white/30 hover:text-white transition-all text-base leading-none"
              >
                ×
              </button>
            </div>
          </div>

          {/* ── Fleet tabs ──────────────────────────────────────────────── */}
          <div className="px-5 pt-4 pb-3 border-b border-white/6 shrink-0">
            <p className="text-[9px] uppercase tracking-[0.2em] text-white/30 mb-2.5">Response Fleet</p>
            <div className="grid grid-cols-4 gap-1.5">
              {FLEET_PRESETS.map(f => {
                const active = fleet.id === f.id
                return (
                  <button
                    key={f.id}
                    onClick={() => { computeKey.current = ''; setFleet(f) }}
                    title={f.description}
                    className={`flex flex-col items-center gap-1 py-2 px-1 rounded-xl border text-center transition-all ${
                      active
                        ? `${accent.badge} ring-1 ring-white/20`
                        : 'bg-white/3 border-white/8 hover:bg-white/6 hover:border-white/16 text-white/50'
                    }`}
                  >
                    <span className="text-base leading-none">{f.icon}</span>
                    <span className={`text-[9px] font-semibold leading-tight ${active ? '' : 'text-white/50'}`}>{f.label}</span>
                    <span className={`text-[8px] font-mono leading-none ${active ? 'opacity-80' : 'text-white/25'}`}>
                      {f.speedKmDay >= 1000 ? `${(f.speedKmDay/1000).toFixed(1)}k` : f.speedKmDay} km/d
                    </span>
                  </button>
                )
              })}
            </div>
          </div>

          {/* ── Scrollable body ─────────────────────────────────────────── */}
          <div className="flex-1 overflow-y-auto min-h-0">

            {/* ── HERO: intercept point ────────────────────────────────── */}
            <div className="px-5 pt-5 pb-4">
              {loading ? (
                <div className="rounded-2xl bg-white/3 border border-white/8 p-8 flex flex-col items-center gap-3">
                  <div className="size-7 border-2 border-white/30 border-t-white/80 rounded-full animate-spin" />
                  <p className="text-xs text-white/35 tracking-wide">Computing optimal intercept…</p>
                </div>
              ) : result ? (
                <div
                  className="rounded-2xl border border-white/10 overflow-hidden"
                  style={{ background: 'linear-gradient(145deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.01) 100%)' }}
                >
                  {/* top bar */}
                  <div className={`flex items-center gap-2 px-4 py-2.5 ${result.feasible ? 'bg-emerald-500/12' : 'bg-red-500/12'} border-b border-white/8`}>
                    <div className={`size-2 rounded-full animate-pulse ${result.feasible ? 'bg-emerald-400' : 'bg-red-400'}`} />
                    <span className={`text-[10px] font-bold uppercase tracking-widest ${result.feasible ? 'text-emerald-300' : 'text-red-300'}`}>
                      {result.feasible ? 'Interception Feasible' : 'Outside Window — Try Faster Fleet'}
                    </span>
                  </div>

                  <div className="px-4 pt-5 pb-4">
                    {/* coordinates — the hero number */}
                    <p className="text-[9px] uppercase tracking-[0.22em] text-white/35 mb-2">Optimal Deploy Point</p>
                    <div className={`font-mono font-black leading-none mb-1 ${accent.text}`} style={{ fontSize: '1.65rem' }}>
                      {fmtLat(result.point[0])}
                    </div>
                    <div className={`font-mono font-black leading-none mb-5 ${accent.text}`} style={{ fontSize: '1.65rem' }}>
                      {fmtLng(result.point[1])}
                    </div>

                    {/* key stats */}
                    <div className="grid grid-cols-2 gap-3">
                      <div className="bg-white/4 border border-white/8 rounded-xl px-3 py-3">
                        <p className="text-[9px] text-white/30 uppercase tracking-widest mb-1">Deploy By</p>
                        <p className="text-sm font-bold text-white/95">{fmtDate(result.interceptDate)}</p>
                        <p className={`text-xs font-semibold mt-0.5 ${accent.text}`}>{fmtDays(result.daysToIntercept)} from now</p>
                      </div>
                      <div className="bg-white/4 border border-white/8 rounded-xl px-3 py-3">
                        <p className="text-[9px] text-white/30 uppercase tracking-widest mb-1">Vessel Travels</p>
                        <p className="text-sm font-bold text-white/95">{fmtKm(result.vesselDistanceKm)}</p>
                        <p className="text-xs text-white/40 mt-0.5">{result.fleet.label}</p>
                      </div>
                    </div>
                  </div>
                </div>
              ) : null}
            </div>

            {/* ── Timeline ────────────────────────────────────────────────  */}
            {result?.feasible && (
              <div className="px-5 pb-4">
                <Timeline
                  totalDays={result.futurePath.length - 1}
                  interceptDay={result.daysToIntercept}
                  accent={accent}
                  simDate={simDate}
                />
              </div>
            )}

            {/* ── Response base ────────────────────────────────────────── */}
            <div className="px-5 pb-5">
              <p className="text-[9px] uppercase tracking-[0.2em] text-white/30 mb-2.5">Nearest Response Base</p>
              <BaseCard lat={bottle.current_lat} lng={bottle.current_lng} fleet={fleet} accent={accent} />
            </div>

            {/* ── Incident info footer ─────────────────────────────────── */}
            <div className="mx-5 mb-5 px-4 py-3 rounded-xl bg-white/2 border border-white/6 grid grid-cols-2 gap-3">
              <div>
                <p className="text-[9px] uppercase tracking-widest text-white/25 mb-0.5">Current Position</p>
                <p className="text-[10px] font-mono text-white/55">{fmtLat(bottle.current_lat)}</p>
                <p className="text-[10px] font-mono text-white/55">{fmtLng(bottle.current_lng)}</p>
              </div>
              <div>
                <p className="text-[9px] uppercase tracking-widest text-white/25 mb-0.5">Time Adrift</p>
                <p className="text-[10px] text-white/55">{Math.floor(bottle.days_drifted)} days</p>
                <p className="text-[9px] text-white/30 mt-0.5">{cfg.description}</p>
              </div>
            </div>

          </div>
        </>
      )}
    </div>
  )
}

// ── Sub-components ─────────────────────────────────────────────────────────

function Timeline({
  totalDays, interceptDay, accent, simDate,
}: {
  totalDays: number
  interceptDay: number
  accent: typeof ACCENT[string]
  simDate: Date
}) {
  const pct = Math.min(98, Math.max(2, (interceptDay / Math.max(1, totalDays)) * 100))
  const deployDate = new Date(simDate.getTime() + interceptDay * 86_400_000)
  const endDate    = new Date(simDate.getTime() + totalDays   * 86_400_000)

  return (
    <div className="bg-white/3 border border-white/7 rounded-xl px-4 py-3.5">
      <p className="text-[9px] uppercase tracking-[0.2em] text-white/30 mb-4">Response Timeline</p>

      {/* Track */}
      <div className="relative h-1 bg-white/10 rounded-full mb-5 mx-1">
        <div className={`absolute inset-y-0 left-0 rounded-full ${accent.fill} opacity-40`} style={{ width: `${pct}%` }} />
        {/* Now dot */}
        <div className="absolute top-1/2 left-0 -translate-y-1/2 -translate-x-1/2 size-2.5 rounded-full bg-white/50 border-2 border-[#080f1f]" />
        {/* Intercept dot */}
        <div
          className={`absolute top-1/2 -translate-y-1/2 -translate-x-1/2 size-3.5 rounded-full ${accent.fill} border-2 border-[#080f1f] shadow-lg`}
          style={{ left: `${pct}%`, boxShadow: `0 0 8px ${accent.fill.replace('bg-', '')}` }}
        />
        {/* End dot */}
        <div className="absolute top-1/2 right-0 -translate-y-1/2 translate-x-1/2 size-2 rounded-full bg-white/20 border border-white/15" />
      </div>

      {/* Labels */}
      <div className="flex justify-between text-[9px]">
        <div>
          <p className="text-white/50 font-semibold">Now</p>
          <p className="text-white/25 font-mono mt-0.5">{fmtDate(simDate)}</p>
        </div>
        <div className="text-center">
          <p className={`font-bold ${accent.text}`}>Intercept</p>
          <p className="text-white/30 font-mono mt-0.5">{fmtDate(deployDate)}</p>
        </div>
        <div className="text-right">
          <p className="text-white/50 font-semibold">Day {totalDays}</p>
          <p className="text-white/25 font-mono mt-0.5">{fmtDate(endDate)}</p>
        </div>
      </div>
    </div>
  )
}

function BaseCard({
  lat, lng, fleet, accent,
}: {
  lat: number
  lng: number
  fleet: FleetPreset
  accent: typeof ACCENT[string]
}) {
  const base = findNearestBase(lat, lng)
  const dist = Math.round(haversineDistanceKm(lat, lng, base.lat, base.lng))
  const days = Math.ceil(dist / fleet.speedKmDay)

  return (
    <div className="bg-white/3 border border-white/8 rounded-xl p-3.5 flex items-center gap-3">
      <div className={`size-10 rounded-xl border flex items-center justify-center text-xl shrink-0 ${accent.badge}`}>
        ⚓
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-semibold text-white/85 truncate">{base.name}</p>
        <p className="text-[10px] text-white/35 mt-0.5">{dist.toLocaleString()} km away · {base.country}</p>
      </div>
      <div className="text-right shrink-0">
        <p className={`text-sm font-bold font-mono ${accent.text}`}>{days}d</p>
        <p className="text-[9px] text-white/30 mt-0.5">transit</p>
      </div>
    </div>
  )
}
