'use client'

import { createContext, useContext, useState, ReactNode } from 'react'

interface SimulationContextValue {
  running: boolean
  setRunning: (v: boolean) => void
  speedMultiplier: number
  setSpeedMultiplier: (v: number) => void
  showFlowField: boolean
  setShowFlowField: (v: boolean) => void
  startDate: Date
  setStartDate: (d: Date) => void
  simDate: Date
  setSimDate: (d: Date) => void
  daysElapsed: number
  setDaysElapsed: (v: number) => void
  simulationStartIso: string
}

const SimulationContext = createContext<SimulationContextValue | null>(null)

export const SPEED_OPTIONS = [1, 10, 100] as const
export type SpeedOption = typeof SPEED_OPTIONS[number]

export function SimulationProvider({ children }: { children: ReactNode }) {
  const [running, setRunning] = useState(true)
  const [speedMultiplier, setSpeedMultiplier] = useState<number>(10)
  const [showFlowField, setShowFlowField] = useState(true)
  const [startDate, setStartDate] = useState<Date>(() => new Date())
  const [simDate, setSimDate] = useState<Date>(() => new Date())
  const [daysElapsed, setDaysElapsed] = useState(0)
  const [simulationStartIso] = useState(() => new Date().toISOString())

  return (
    <SimulationContext.Provider value={{
      running, setRunning,
      speedMultiplier, setSpeedMultiplier,
      showFlowField, setShowFlowField,
      startDate, setStartDate,
      simDate, setSimDate,
      daysElapsed, setDaysElapsed,
      simulationStartIso,
    }}>
      {children}
    </SimulationContext.Provider>
  )
}

export function useSimulationContext() {
  const ctx = useContext(SimulationContext)
  if (!ctx) throw new Error('useSimulationContext must be used inside SimulationProvider')
  return ctx
}
