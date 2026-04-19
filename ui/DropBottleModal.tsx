'use client'
/**
 * PERSON 1 — Map + UI
 */

import { useState } from 'react'
import { createBottleBatch } from '@/lib/bottleSpawn'
import type { Bottle, IncidentType } from '@/types'
import { INCIDENT_CONFIGS } from '@/types'

interface Props {
  lat: number
  lng: number
  onClose: () => void
  onBottleDropped: (bottles: Bottle[]) => void
}

const URGENCY_COLOR: Record<string, string> = {
  critical: 'border-orange-500/70 bg-orange-500/10 text-orange-300',
  high:     'border-purple-500/70 bg-purple-500/10 text-purple-300',
  medium:   'border-sky-500/70 bg-sky-500/10 text-sky-300',
  low:      'border-emerald-500/70 bg-emerald-500/10 text-emerald-300',
}
const URGENCY_SELECTED: Record<string, string> = {
  critical: 'border-orange-400 bg-orange-500/25 ring-1 ring-orange-400/50',
  high:     'border-purple-400 bg-purple-500/25 ring-1 ring-purple-400/50',
  medium:   'border-sky-400 bg-sky-500/25 ring-1 ring-sky-400/50',
  low:      'border-emerald-400 bg-emerald-500/25 ring-1 ring-emerald-400/50',
}

export function DropBottleModal({ lat, lng, onClose, onBottleDropped }: Props) {
  const [incidentType, setIncidentType] = useState<IncidentType>('oil_spill')
  const [count, setCount] = useState('1')
  const [radiusKm, setRadiusKm] = useState('0')
  const bottleCount = Math.max(1, Math.min(100, Math.floor(Number(count) || 1)))

  const handleDrop = () => {
    const cfg = INCIDENT_CONFIGS[incidentType]
    const bottles = createBottleBatch({
      lat,
      lng,
      count: Number(count),
      radiusKm: Number(radiusKm),
      message: cfg.description,
      authorName: cfg.label,
      incidentType,
    })
    onBottleDropped(bottles)
  }

  const latStr = `${Math.abs(lat).toFixed(2)}° ${lat >= 0 ? 'N' : 'S'}`
  const lngStr = `${Math.abs(lng).toFixed(2)}° ${lng >= 0 ? 'E' : 'W'}`

  return (
    <div
      className="fixed inset-0 flex items-center justify-center z-[2000] bg-black/60 backdrop-blur-sm"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-[#080f1f] border border-white/10 rounded-2xl w-full max-w-sm mx-4 overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="px-5 pt-5 pb-4 border-b border-white/5">
          <div className="flex items-center justify-between mb-1">
            <h2 className="text-sm font-semibold text-white tracking-wide">Report Incident</h2>
            <button onClick={onClose} className="text-white/30 hover:text-white/70 transition-colors text-lg leading-none">×</button>
          </div>
          <p className="text-xs text-white/30 font-mono">{latStr}, {lngStr}</p>
        </div>

        {/* Incident type grid */}
        <div className="px-5 py-4 space-y-3">
          <p className="text-[11px] uppercase tracking-[0.16em] text-white/35">Incident Type</p>
          <div className="grid grid-cols-2 gap-2">
            {(Object.entries(INCIDENT_CONFIGS) as [IncidentType, typeof INCIDENT_CONFIGS[IncidentType]][]).map(([type, cfg]) => {
              const isSelected = incidentType === type
              const baseColor = URGENCY_COLOR[cfg.urgency]
              const selectedColor = URGENCY_SELECTED[cfg.urgency]
              return (
                <button
                  key={type}
                  onClick={() => setIncidentType(type)}
                  className={`border rounded-xl px-3 py-2.5 text-left transition-all ${isSelected ? selectedColor : baseColor + '/40 hover:opacity-90'}`}
                >
                  <div className="text-base mb-0.5">{cfg.emoji}</div>
                  <div className="text-xs font-medium text-white/90 leading-tight">{cfg.label}</div>
                  <div className="text-[10px] text-white/40 leading-tight mt-0.5">{cfg.description}</div>
                  <div className={`text-[10px] font-semibold uppercase tracking-wide mt-1.5 ${URGENCY_COLOR[cfg.urgency].split(' ')[2]}`}>
                    {cfg.urgency}
                  </div>
                </button>
              )
            })}
          </div>

          <div className="grid grid-cols-2 gap-3 pt-1">
            <label className="space-y-1">
              <span className="block text-[11px] uppercase tracking-[0.16em] text-white/35">Count</span>
              <input
                type="number"
                min={1}
                max={100}
                step={1}
                inputMode="numeric"
                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white placeholder-white/20 focus:outline-none focus:border-blue-500/60 transition-colors"
                value={count}
                onChange={(e) => setCount(e.target.value)}
              />
            </label>
            <label className="space-y-1">
              <span className="block text-[11px] uppercase tracking-[0.16em] text-white/35">Radius Km</span>
              <input
                type="number"
                min={0}
                max={500}
                step={1}
                inputMode="decimal"
                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white placeholder-white/20 focus:outline-none focus:border-blue-500/60 transition-colors"
                value={radiusKm}
                onChange={(e) => setRadiusKm(e.target.value)}
              />
            </label>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 pb-5">
          <button
            onClick={handleDrop}
            className="w-full bg-blue-600 hover:bg-blue-500 active:scale-[0.98] rounded-xl py-2.5 text-sm font-medium text-white transition-all"
          >
            {bottleCount > 1 ? `Simulate ${bottleCount} trackers` : 'Simulate tracker'}
          </button>
        </div>
      </div>
    </div>
  )
}
