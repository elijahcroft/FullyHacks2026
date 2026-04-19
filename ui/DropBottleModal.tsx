'use client'
/**
 * PERSON 1 — Map + UI
 */

import { useState } from 'react'
import type { Bottle } from '@/types'

interface Props {
  lat: number
  lng: number
  onClose: () => void
  onBottleDropped: (bottle: Bottle) => void
}
///a
export function DropBottleModal({ lat, lng, onClose, onBottleDropped }: Props) {
  const [message, setMessage] = useState('')
  const [authorName, setAuthorName] = useState('')

  const handleDrop = () => {
    const bottle: Bottle = {
      id: crypto.randomUUID(),
      message: message.trim() || '',
      author_name: authorName.trim() || 'Anonymous',
      start_lat: lat,
      start_lng: lng,
      current_lat: lat,
      current_lng: lng,
      path: [],
      status: 'drifting',
      dropped_at: new Date().toISOString(),
      days_drifted: 0,
      destination: null,
    }
    onBottleDropped(bottle)
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
        </div>

        {/* Footer */}
        <div className="px-5 pb-5">
          <button
            onClick={handleDrop}
            className="w-full bg-blue-600 hover:bg-blue-500 active:scale-[0.98] rounded-xl py-2.5 text-sm font-medium text-white transition-all"
          >
            Set adrift
          </button>
        </div>
      </div>
    </div>
  )
}
