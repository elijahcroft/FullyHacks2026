'use client'
/**
 * PERSON 1 — Map + UI
 *
 * Floating simulation controls — speed multiplier + play/pause.
 * Reads/writes SimulationContext. No simulation logic lives here.
 *
 * Position: fixed, bottom-right, above map controls.
 */

import { useSimulationContext, SPEED_OPTIONS } from '@/context/SimulationContext'

export function SimControls() {
  const { running, setRunning, speedMultiplier, setSpeedMultiplier, showFlowField, setShowFlowField } = useSimulationContext()

  return (
    <div className="fixed bottom-6 right-4 z-[1000] flex flex-col items-end gap-2">
      {/* Speed buttons */}
      <div className="flex items-center gap-1 bg-[#0d1b2e]/90 border border-blue-900/60 rounded-xl px-3 py-2 backdrop-blur-sm">
        <span className="text-xs text-blue-500 mr-2 select-none">speed</span>
        {SPEED_OPTIONS.map((s) => (
          <button
            key={s}
            onClick={() => setSpeedMultiplier(s)}
            className={`px-2.5 py-1 rounded-lg text-xs font-mono font-medium transition-colors ${
              speedMultiplier === s
                ? 'bg-blue-600 text-white'
                : 'text-blue-400 hover:text-white hover:bg-blue-900/50'
            }`}
          >
            {s}x
          </button>
        ))}
      </div>

      {/* Play / Pause */}
      <button
        onClick={() => setRunning(!running)}
        className="flex items-center gap-2 bg-[#0d1b2e]/90 border border-blue-900/60 rounded-xl px-4 py-2 text-xs text-blue-300 hover:text-white hover:border-blue-600 transition-colors backdrop-blur-sm"
      >
        <span className="text-base leading-none">{running ? '⏸' : '▶'}</span>
        {running ? 'Pause' : 'Resume'}
      </button>

      {/* Flow field toggle */}
      <button
        onClick={() => setShowFlowField(!showFlowField)}
        className={`flex items-center gap-2 border rounded-xl px-4 py-2 text-xs transition-colors backdrop-blur-sm ${
          showFlowField
            ? 'bg-blue-900/40 border-blue-600/60 text-blue-200 hover:border-blue-400'
            : 'bg-[#0d1b2e]/90 border-blue-900/60 text-blue-500 hover:text-white hover:border-blue-600'
        }`}
      >
        <span className="text-base leading-none">〰</span>
        Currents
      </button>
    </div>
  )
}
