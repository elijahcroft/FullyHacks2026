'use client'

import { useState, useEffect, useRef } from 'react'
import type { Bottle } from '@/types'
import { getZonesAtPosition, type MarineZone } from '@/lib/marineZones'
import { analyzeBottleImpact } from '@/lib/gemini'

interface Props {
  bottle: Bottle | null
  onClose: () => void
}

const SEVERITY_COLORS: Record<string, { badge: string; dot: string }> = {
  critical: { badge: 'bg-red-500/15 text-red-400 border-red-500/25',    dot: 'bg-red-400' },
  high:     { badge: 'bg-orange-500/15 text-orange-400 border-orange-500/25', dot: 'bg-orange-400' },
  medium:   { badge: 'bg-yellow-500/15 text-yellow-400 border-yellow-500/25', dot: 'bg-yellow-400' },
  low:      { badge: 'bg-green-500/15 text-green-400 border-green-500/25',  dot: 'bg-green-400' },
}

function coord(lat: number, lng: number) {
  return `${Math.abs(lat).toFixed(2)}°${lat >= 0 ? 'N' : 'S'} ${Math.abs(lng).toFixed(2)}°${lng >= 0 ? 'E' : 'W'}`
}

function formatDays(days: number) {
  if (days < 30)  return `${Math.round(days)}d`
  if (days < 365) return `${Math.round(days / 30)}mo`
  return `${(days / 365).toFixed(1)}yr`
}

function overallSeverity(zones: MarineZone[]): string {
  if (zones.some(z => z.severity === 'critical')) return 'Critical'
  if (zones.some(z => z.severity === 'high'))     return 'High'
  if (zones.some(z => z.severity === 'medium'))   return 'Medium'
  if (zones.length > 0)                            return 'Low'
  return 'None'
}

export function EnvironmentalImpactPanel({ bottle, onClose }: Props) {
  const [geminiText, setGeminiText] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError]   = useState('')
  const [zones, setZones]   = useState<MarineZone[]>([])

  const prevId = useRef<string | null>(null)

  useEffect(() => {
    if (!bottle) {
      setGeminiText('')
      setZones([])
      return
    }
    if (bottle.id === prevId.current) return
    prevId.current = bottle.id

    const currentZones = getZonesAtPosition(bottle.current_lat, bottle.current_lng)
    setZones(currentZones)
    setGeminiText('')
    setError('')
    setLoading(true)

    const key = process.env.NEXT_PUBLIC_GEMINI_API_KEY ?? ''
    analyzeBottleImpact(bottle, currentZones, key)
      .then(text => { setGeminiText(text); setLoading(false) })
      .catch(err  => { setError(err instanceof Error ? err.message : String(err)); setLoading(false) })
  }, [bottle])

  const visible = Boolean(bottle)

  return (
    <div
      className={`fixed top-0 right-0 bottom-0 z-[1200] w-[420px] bg-[#080f1f] border-l border-white/8 shadow-2xl flex flex-col transition-transform duration-300 ease-out ${
        visible ? 'translate-x-0' : 'translate-x-full'
      }`}
    >
      {bottle && (
        <>
          {/* Header */}
          <div className="px-5 pt-5 pb-4 border-b border-white/5 shrink-0">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h2 className="text-sm font-semibold text-white tracking-wide">Environmental Impact</h2>
                <p className="text-xs text-white/35 mt-0.5">AI-powered ecosystem analysis</p>
              </div>
              <button
                onClick={onClose}
                className="size-7 flex items-center justify-center rounded-lg bg-white/5 hover:bg-white/10 text-white/30 hover:text-white transition-all text-sm leading-none"
              >
                ×
              </button>
            </div>

            {/* Bottle info */}
            <div className="bg-white/3 border border-white/5 rounded-xl p-3.5">
              <p className="text-xs font-medium text-white/80 mb-0.5">{bottle.author_name || 'Anonymous'}</p>
              {bottle.message && (
                <p className="text-xs text-white/40 italic mb-2 leading-relaxed line-clamp-2">"{bottle.message}"</p>
              )}
              <div className="grid grid-cols-2 gap-2 mt-2">
                <div className="bg-[#060d1a] rounded-lg p-2">
                  <p className="text-[10px] text-white/25 uppercase tracking-widest mb-0.5">Current</p>
                  <p className="text-xs text-white/60 font-mono leading-tight">
                    {coord(bottle.current_lat, bottle.current_lng)}
                  </p>
                </div>
                <div className="bg-[#060d1a] rounded-lg p-2">
                  <p className="text-[10px] text-white/25 uppercase tracking-widest mb-0.5">Adrift</p>
                  <p className="text-xs text-white/60">{formatDays(bottle.days_drifted)}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Scrollable body */}
          <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5 min-h-0">

            {/* Gemini analysis */}
            <section>
              <div className="flex items-center gap-2 mb-2.5">
                <span className="text-sm">✨</span>
                <span className="text-xs text-white/50 tracking-wide">Gemini Analysis</span>
                <span className="text-[10px] text-white/20 ml-auto">gemini-2.0-flash-lite</span>
              </div>

              {loading ? (
                <div className="bg-white/3 border border-white/5 rounded-xl p-4 flex items-center gap-3">
                  <div className="size-4 border-2 border-purple-400/60 border-t-transparent rounded-full animate-spin shrink-0" />
                  <span className="text-xs text-white/35">Analyzing environmental impact…</span>
                </div>
              ) : error ? (
                <div className="bg-red-500/8 border border-red-500/20 rounded-xl p-3">
                  <p className="text-xs text-red-400">{error}</p>
                </div>
              ) : geminiText ? (
                <div className="bg-purple-500/5 border border-purple-500/15 rounded-xl p-4">
                  <p className="text-xs text-white/60 leading-relaxed whitespace-pre-line">{geminiText}</p>
                  <p className="text-[10px] text-white/20 mt-3 pt-3 border-t border-white/5">
                    {new Date().toLocaleTimeString()}
                  </p>
                </div>
              ) : null}

              {!process.env.NEXT_PUBLIC_GEMINI_API_KEY && (
                <p className="text-[10px] text-blue-400/50 mt-2">
                  Add <code className="font-mono">NEXT_PUBLIC_GEMINI_API_KEY</code> to .env.local to enable live AI analysis.
                </p>
              )}
            </section>

            <div className="border-t border-white/5" />

            {/* Hazard zones */}
            <section>
              <div className="flex items-center gap-2 mb-2.5">
                <span className="text-sm">⚠️</span>
                <span className="text-xs text-white/50 tracking-wide">Ecosystem Hazards</span>
                <span className="ml-auto bg-white/5 border border-white/5 text-white/35 text-[10px] px-2 py-0.5 rounded-full">
                  {zones.length}
                </span>
              </div>

              {zones.length === 0 ? (
                <p className="text-xs text-white/25 italic">
                  No sensitive zones detected at current position.
                </p>
              ) : (
                <div className="space-y-2">
                  {zones.map(zone => {
                    const colors = SEVERITY_COLORS[zone.severity] ?? SEVERITY_COLORS.low
                    return (
                      <div
                        key={zone.id}
                        className="bg-white/3 border border-white/5 rounded-xl p-3.5 hover:border-white/10 transition-colors"
                      >
                        <div className="flex items-center justify-between mb-1.5">
                          <p className="text-xs text-white/75 leading-tight">{zone.name}</p>
                          <span className={`text-[10px] px-1.5 py-0.5 rounded-full border shrink-0 ml-2 ${colors.badge}`}>
                            {zone.severity}
                          </span>
                        </div>
                        <p className="text-[11px] text-white/35 leading-relaxed">{zone.description}</p>
                      </div>
                    )
                  })}
                </div>
              )}
            </section>

            <div className="border-t border-white/5" />

            {/* Impact metrics */}
            <section>
              <div className="flex items-center gap-2 mb-2.5">
                <span className="text-sm">📊</span>
                <span className="text-xs text-white/50 tracking-wide">Impact Metrics</span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { label: 'Zones Affected',    value: String(zones.length),        color: 'text-green-400' },
                  { label: 'Risk Level',         value: overallSeverity(zones),      color: 'text-orange-400' },
                  { label: 'Days Adrift',        value: formatDays(bottle.days_drifted), color: 'text-blue-400' },
                  { label: 'Status',             value: bottle.status.replace('_', ' '), color: 'text-sky-400' },
                ].map(m => (
                  <div key={m.label} className="bg-white/3 border border-white/5 rounded-xl p-3">
                    <p className={`text-base ${m.color} mb-0.5 capitalize`}>{m.value}</p>
                    <p className="text-[10px] text-white/25">{m.label}</p>
                  </div>
                ))}
              </div>
            </section>

            {/* Data sources */}
            <div className="bg-white/3 border border-white/5 rounded-xl p-3.5">
              <p className="text-[10px] text-white/25 mb-2 uppercase tracking-wider">Data Sources</p>
              {[
                'NOAA Marine Regions Database',
                'MarineRegions.org GeoJSON',
                'Protected Planet WDPA',
                'Google Gemini AI',
              ].map(src => (
                <div key={src} className="text-[10px] text-white/35 flex items-center gap-1.5 mt-1">
                  <div className="size-1 rounded-full bg-blue-500/40 shrink-0" />
                  {src}
                </div>
              ))}
            </div>

          </div>
        </>
      )}
    </div>
  )
}
