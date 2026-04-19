'use client'
/**
 * PERSON 4 — Canvas Rendering + Visual Effects
 *
 * All bottle state lives here. Backed by localStorage — no server needed.
 * The simulation tick loop calls updateBottles() to move bottles forward.
 */

import { useState, useEffect } from 'react'
import { loadBottles, saveBottles, clearBottles } from '@/lib/store'
import type { Bottle } from '@/types'

export function useBottles() {
  // Start empty so server and client render the same thing (no hydration mismatch).
  // Populate from localStorage after mount.
  const [bottles, setBottles] = useState<Bottle[]>([])

  useEffect(() => {
    const saved = loadBottles()
    setBottles(saved === null ? DEMO_BOTTLES : saved)
  }, [])

  const addBottle = (bottle: Bottle) => {
    setBottles((prev) => {
      const next = [bottle, ...prev]
      saveBottles(next)
      return next
    })
  }

  const addBottles = (incoming: Bottle[]) => {
    if (incoming.length === 0) return

    setBottles((prev) => {
      const next = [...incoming, ...prev]
      saveBottles(next)
      return next
    })
  }

  // Called by useSimulation on every tick with updated positions
  const updateBottles = (updated: Bottle[]) => {
    setBottles((prev) => {
      const map = new Map(updated.map((b) => [b.id, b]))
      const next = prev.map((b) => map.get(b.id) ?? b)
      saveBottles(next)
      return next
    })
  }

  const clearAllBottles = () => {
    clearBottles()
    setBottles([])
  }

  return { bottles, addBottle, addBottles, updateBottles, clearAllBottles }
}

// ---- Demo data (shown until the user drops their first bottle) -------------

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
    message: 'Trapped forever in the gyre... send help.',
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
    message: 'Drifting through the Atlantic...',
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
