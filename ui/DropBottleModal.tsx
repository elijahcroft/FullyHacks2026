'use client'
/**
 * PERSON 1 — Map + UI
 */

import { useState } from 'react'
import { createBottleBatch } from '@/lib/bottleSpawn'
import type { Bottle } from '@/types'

interface Props {
  lat: number
  lng: number
  onClose: () => void
  onBottleDropped: (bottles: Bottle[]) => void
}

export function DropBottleModal({ lat, lng, onClose, onBottleDropped }: Props) {
  const [message, setMessage] = useState('')
  const [authorName, setAuthorName] = useState('')
  const [count, setCount] = useState('1')
  const [radiusKm, setRadiusKm] = useState('0')
  const bottleCount = Math.max(1, Math.min(100, Math.floor(Number(count) || 1)))

  const handleDrop = () => {
    const bottles = createBottleBatch({
      lat,
      lng,
      count: Number(count),
      radiusKm: Number(radiusKm),
      message,
      authorName,
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
            <h2 className="text-sm font-semibold text-white tracking-wide">Drop a bottle</h2>
            <button onClick={onClose} className="text-white/30 hover:text-white/70 transition-colors text-lg leading-none">×</button>
          </div>
          <p className="text-xs text-white/30 font-mono">{latStr}, {lngStr}</p>
        </div>

        {/* Body */}
        <div className="px-5 py-4 space-y-3">
          <input
            className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white placeholder-white/20 focus:outline-none focus:border-blue-500/60 transition-colors"
            placeholder="Your name (optional)"
            value={authorName}
            onChange={(e) => setAuthorName(e.target.value)}
          />
          <textarea
            className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white placeholder-white/20 focus:outline-none focus:border-blue-500/60 transition-colors resize-none"
            rows={3}
            placeholder="Message (optional)"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            autoFocus
          />
          <div className="grid grid-cols-2 gap-3">
            <label className="space-y-1">
              <span className="block text-[11px] uppercase tracking-[0.16em] text-white/35">Bottle Count</span>
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
          <p className="text-[11px] leading-relaxed text-white/30">
            Use a radius above 0 to scatter the bottles around this point instead of stacking them exactly on top of each other.
          </p>
        </div>

        {/* Footer */}
        <div className="px-5 pb-5">
          <button
            onClick={handleDrop}
            className="w-full bg-blue-600 hover:bg-blue-500 active:scale-[0.98] rounded-xl py-2.5 text-sm font-medium text-white transition-all"
          >
            {bottleCount > 1 ? 'Set cluster adrift' : 'Set adrift'}
          </button>
        </div>
      </div>
    </div>
  )
}
