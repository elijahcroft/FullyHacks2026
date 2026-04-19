'use client'
/**
 * PERSON 2 — Flow Field + Simulation Engine
 *
 * Client-side simulation tick loop.
 * Use this as the MVP fallback when server-side cron isn't set up yet.
 *
 * Call tickAll() on each animation frame (throttled to ~1 real second per tick).
 * Persists updates to Supabase so other clients see the movement.
 */

import { useEffect, useRef, useState } from 'react'
import { loadFlowField } from '@/lib/currentField'
import { tickAll } from '@/lib/simulation'
import { updateBottles } from '@/lib/supabase'
import type { Bottle, FlowField, FlowFieldMeta, TickOptions } from '@/types'

const TICK_INTERVAL_MS = 1000 // 1 real second per simulated day

export function useSimulation(
  bottles: Bottle[],
  options: Partial<TickOptions> = {},
) {
  const [running, setRunning] = useState(true)
  const fieldRef = useRef<{ field: FlowField; meta: FlowFieldMeta } | null>(null)
  const bottlesRef = useRef(bottles)
  bottlesRef.current = bottles

  useEffect(() => {
    loadFlowField().then((f) => { fieldRef.current = f })
  }, [])

  useEffect(() => {
    if (!running) return

    const interval = setInterval(async () => {
      if (!fieldRef.current) return
      const { field, meta } = fieldRef.current
      const updated = tickAll(
        bottlesRef.current.filter((b) => b.status === 'drifting'),
        field,
        meta,
        options,
      )
      if (updated.length > 0) {
        await updateBottles(updated)
      }
    }, TICK_INTERVAL_MS)

    return () => clearInterval(interval)
  }, [running, options])

  return { running, setRunning }
}
