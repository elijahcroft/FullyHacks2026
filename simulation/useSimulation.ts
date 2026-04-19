'use client'

import { useEffect, useRef } from 'react'
import { loadFlowField, getFieldForMonth, FLOW_FIELD_META } from '@/simulation/flowField'
import { tickAll } from '@/simulation/engine'
import { useSimulationContext } from '@/simulation/context'
import type { Bottle } from '@/types'

const TICK_INTERVAL_MS = 1000

export function useSimulation(bottles: Bottle[], updateBottles: (updated: Bottle[]) => void) {
  const { running, speedMultiplier, startDate, setSimDate, daysElapsed, setDaysElapsed } = useSimulationContext()
  const bottlesRef = useRef(bottles)
  const runningRef = useRef(running)
  const speedRef = useRef(speedMultiplier)
  const updateRef = useRef(updateBottles)
  const setSimDateRef = useRef(setSimDate)
  const startDateRef = useRef(startDate)
  const simDaysRef = useRef(0)
  const daysElapsedRef = useRef(daysElapsed)
  const setDaysElapsedRef = useRef(setDaysElapsed)

  bottlesRef.current = bottles
  runningRef.current = running
  speedRef.current = speedMultiplier
  updateRef.current = updateBottles
  setSimDateRef.current = setSimDate
  startDateRef.current = startDate
  daysElapsedRef.current = daysElapsed
  setDaysElapsedRef.current = setDaysElapsed

  // Trigger static field load + kick off monthly prefetch
  useEffect(() => {
    loadFlowField()
  }, [])

  // Reset elapsed days when the user changes the start date
  useEffect(() => {
    simDaysRef.current = 0
    setSimDateRef.current(startDate)
  }, [startDate])

  useEffect(() => {
    const interval = setInterval(() => {
      if (!runningRef.current) return

      simDaysRef.current += speedRef.current
      const simDate = new Date(
        startDateRef.current.getTime() + simDaysRef.current * 86_400_000,
      )
      setSimDateRef.current(simDate)

      const field = getFieldForMonth(simDate.getMonth())
      if (!field) return

      const drifting = bottlesRef.current.filter((b) => b.status === 'drifting')
      if (drifting.length === 0) return

      let current = drifting
      for (let i = 0; i < speedRef.current; i++) {
        current = tickAll(current, field, FLOW_FIELD_META, {
          dtDays: 1,
          speedMultiplier: 1,
          turbulence: 0.05,
        })
      }

      updateRef.current(current)
      setDaysElapsedRef.current(daysElapsedRef.current + speedRef.current)
    }, TICK_INTERVAL_MS)

    return () => clearInterval(interval)
  }, []) // refs keep this stable — do not add deps
}
