'use client'
/**
 * PERSON 1 — Map + UI
 *
 * Modal shown when the user clicks the ocean to drop a bottle.
 */

import { useState } from 'react'
import { createBottle } from '@/lib/supabase'
import type { Bottle } from '@/types'

interface Props {
  lat: number
  lng: number
  onClose: () => void
  onBottleDropped?: (bottle: Bottle) => void
}

export function DropBottleModal({ lat, lng, onClose, onBottleDropped }: Props) {
  const [message, setMessage] = useState('')
  const [authorName, setAuthorName] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const handleDrop = async () => {
    if (!message.trim()) return
    setSubmitting(true)

    const saved = await createBottle({
      message: message.trim(),
      author_name: authorName.trim() || 'Anonymous',
      start_lat: lat,
      start_lng: lng,
    })

    // Optimistic local bottle if DB not connected
    const bottle: Bottle = saved ?? {
      id: `local-${Date.now()}`,
      message: message.trim(),
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

    onBottleDropped?.(bottle)
    setSubmitting(false)
    onClose()
  }

  return (
    <div className="fixed inset-0 flex items-center justify-center z-[2000] bg-black/50 backdrop-blur-sm">
      <div className="bg-[#0d1b2e] border border-blue-900/60 rounded-2xl p-6 w-full max-w-md text-white shadow-2xl mx-4">
        <h2 className="text-lg font-semibold mb-1">Drop a bottle</h2>
        <p className="text-xs text-blue-500 mb-5">
          {lat.toFixed(3)}°{lat >= 0 ? 'N' : 'S'}, {Math.abs(lng).toFixed(3)}°{lng >= 0 ? 'E' : 'W'}
        </p>

        <input
          className="w-full bg-[#081628] border border-blue-900/60 rounded-lg px-3 py-2 mb-3 text-sm placeholder-blue-900 focus:outline-none focus:border-blue-600 transition-colors"
          placeholder="Your name (optional)"
          value={authorName}
          onChange={(e) => setAuthorName(e.target.value)}
        />

        <textarea
          className="w-full bg-[#081628] border border-blue-900/60 rounded-lg px-3 py-2 mb-5 text-sm placeholder-blue-900 focus:outline-none focus:border-blue-600 transition-colors resize-none"
          rows={4}
          placeholder="Write your message to the ocean..."
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          autoFocus
        />

        <div className="flex gap-3">
          <button
            onClick={handleDrop}
            disabled={submitting || !message.trim()}
            className="flex-1 bg-blue-600 hover:bg-blue-500 disabled:opacity-30 disabled:cursor-not-allowed rounded-lg py-2 text-sm font-medium transition-colors"
          >
            {submitting ? 'Dropping…' : '🫙 Drop bottle'}
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-blue-500 hover:text-white transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  )
}
