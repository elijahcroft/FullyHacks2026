'use client'
/**
 * PERSON 2 — Flow Field + Simulation Engine
 *
 * Client-side tick loop. Reads speed/running from SimulationContext,
 * ticks all drifting bottles, and writes back via updateBottles().
 * Entirely local — no network calls.
 */

import { useEffect, useRef } from 'react'
import { loadFlowField } from '@/simulation/flowField'
import { tickAll } from '@/simulation/engine'
import { useSimulationContext } from '@/simulation/context'
import type { Bottle, FlowField, FlowFieldMeta } from '@/types'

const TICK_INTERVAL_MS = 1000

export function useSimulation(bottles: Bottle[], updateBottles: (updated: Bottle[]) => void) {
  const { running, speedMultiplier, daysElapsed, setDaysElapsed } = useSimulationContext()
  const fieldRef = useRef<{ field: FlowField; meta: FlowFieldMeta } | null>(null)
  const bottlesRef = useRef(bottles)
  const runningRef = useRef(running)
  const speedRef = useRef(speedMultiplier)
  const updateRef = useRef(updateBottles)
  const daysElapsedRef = useRef(daysElapsed)
  const setDaysElapsedRef = useRef(setDaysElapsed)

  bottlesRef.current = bottles
  runningRef.current = running
  speedRef.current = speedMultiplier
  updateRef.current = updateBottles
  daysElapsedRef.current = daysElapsed
  setDaysElapsedRef.current = setDaysElapsed

  useEffect(() => {
    loadFlowField().then((f) => { fieldRef.current = f })
  }, [])

  useEffect(() => {
    const interval = setInterval(() => {
      if (!runningRef.current || !fieldRef.current) return

      const { field, meta } = fieldRef.current
      const drifting = bottlesRef.current.filter((b) => b.status === 'drifting')
      if (drifting.length === 0) return

      // Run speedMultiplier sub-ticks of 1 simulated day each.
      // Same total displacement as before, but in small steps — path waypoints
      // record correctly and status detection fires mid-loop instead of skipping over.
      let current = drifting
      for (let i = 0; i < speedRef.current; i++) {
        current = tickAll(current, field, meta, {
          dtDays: 1,
          speedMultiplier: 1,
          turbulence: 0.05,
        })
      }

      updateRef.current(current)
      setDaysElapsedRef.current(daysElapsedRef.current + speedRef.current)
    }, TICK_INTERVAL_MS)

    return () => clearInterval(interval)
  }, []) // refs keep this stable — no restarts on re-render
}
