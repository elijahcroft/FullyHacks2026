'use client'
/**
 * PERSON 2 — Flow Field + Simulation Engine
 *
 * Client-side tick loop. Reads speed/running from SimulationContext,
 * ticks all drifting bottles, and writes back via updateBottles().
 * Entirely local — no network calls.
 */

import { useEffect, useRef } from 'react'
import { loadFlowField } from '@/lib/currentField'
import { tickAll } from '@/lib/simulation'
import { useSimulationContext } from '@/context/SimulationContext'
import type { Bottle, FlowField, FlowFieldMeta } from '@/types'

const TICK_INTERVAL_MS = 1000

export function useSimulation(bottles: Bottle[], updateBottles: (updated: Bottle[]) => void) {
  const { running, speedMultiplier } = useSimulationContext()
  const fieldRef = useRef<{ field: FlowField; meta: FlowFieldMeta } | null>(null)
  const bottlesRef = useRef(bottles)
  const runningRef = useRef(running)
  const speedRef = useRef(speedMultiplier)
  const updateRef = useRef(updateBottles)

  bottlesRef.current = bottles
  runningRef.current = running
  speedRef.current = speedMultiplier
  updateRef.current = updateBottles

  useEffect(() => {
    loadFlowField().then((f) => { fieldRef.current = f })
  }, [])

  useEffect(() => {
    const interval = setInterval(() => {
      if (!runningRef.current || !fieldRef.current) return

      const { field, meta } = fieldRef.current
      const drifting = bottlesRef.current.filter((b) => b.status === 'drifting')
      if (drifting.length === 0) return

      const updated = tickAll(drifting, field, meta, {
        dtDays: 1,
        speedMultiplier: speedRef.current,
        turbulence: 0.05,
      })

      updateRef.current(updated)
    }, TICK_INTERVAL_MS)

    return () => clearInterval(interval)
  }, []) // refs keep this stable — no restarts on re-render
}
