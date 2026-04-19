'use client'
/**
 * PERSON 4 — Canvas Rendering + Visual Effects
 *
 * Subscribes to real-time bottle updates via Supabase realtime.
 * Falls back to demo bottles when Supabase is not configured.
 */

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import type { Bottle } from '@/types'

// Shown when there's no database connection so the canvas isn't empty
const DEMO_BOTTLES: Bottle[] = [
  {
    id: 'demo-1',
    message: 'Hello from the North Pacific! 🌊',
    author_name: 'Demo',
    start_lat: 40, start_lng: -170,
    current_lat: 38, current_lng: -155,
    path: [[40, -170], [39.5, -165], [39, -160], [38.5, -157], [38, -155]],
    status: 'drifting',
    dropped_at: new Date(Date.now() - 30 * 86400000).toISOString(),
    days_drifted: 30,
    destination: null,
  },
  {
    id: 'demo-2',
    message: 'Trapped forever... send help.',
    author_name: 'Demo',
    start_lat: 50, start_lng: -180,
    current_lat: 35, current_lng: -145,
    path: [[50, -180], [45, -170], [40, -160], [37, -150], [35, -145]],
    status: 'garbage_patch',
    dropped_at: new Date(Date.now() - 90 * 86400000).toISOString(),
    days_drifted: 90,
    destination: 'Great Pacific Garbage Patch',
  },
  {
    id: 'demo-3',
    message: 'Set adrift somewhere in the Atlantic.',
    author_name: 'Demo',
    start_lat: 20, start_lng: -50,
    current_lat: 25, current_lng: -40,
    path: [[20, -50], [22, -46], [24, -43], [25, -40]],
    status: 'drifting',
    dropped_at: new Date(Date.now() - 15 * 86400000).toISOString(),
    days_drifted: 15,
    destination: null,
  },
]

export function useBottles() {
  const [bottles, setBottles] = useState<Bottle[]>(supabase ? [] : DEMO_BOTTLES)
  const [loading, setLoading] = useState(!!supabase)

  useEffect(() => {
    if (!supabase) return

    supabase
      .from('bottles')
      .select('*')
      .then(({ data }) => {
        if (data) setBottles(data as Bottle[])
        setLoading(false)
      })

    const channel = supabase
      .channel('bottles-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'bottles' }, (payload) => {
        const updated = payload.new as Bottle
        setBottles((prev) => {
          const idx = prev.findIndex((b) => b.id === updated.id)
          if (idx === -1) return [...prev, updated]
          const next = [...prev]
          next[idx] = updated
          return next
        })
      })
      .subscribe()

    return () => { supabase!.removeChannel(channel) }
  }, [])

  const addBottle = (bottle: Bottle) => setBottles((prev) => [bottle, ...prev])

  return { bottles, loading, addBottle }
}
