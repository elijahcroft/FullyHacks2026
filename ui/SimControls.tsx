'use client'

import { useSimulationContext, SPEED_OPTIONS } from '@/simulation/context'

const DATE_FORMATTER = new Intl.DateTimeFormat('en-US', {
  month: '2-digit',
  day: '2-digit',
  year: 'numeric',
})

export function SimControls() {
  const {
    running,
    setRunning,
    speedMultiplier,
    setSpeedMultiplier,
    showFlowField,
    setShowFlowField,
    daysElapsed,
    simulationStartIso,
  } = useSimulationContext()
  const currentDate = new Date(simulationStartIso)
  currentDate.setDate(currentDate.getDate() + Math.floor(daysElapsed))

  return (
    <div className="fixed bottom-5 right-4 z-[1000] flex flex-col items-end gap-2">
      {/* Currents toggle */}
      <button
        onClick={() => setShowFlowField(!showFlowField)}
        className={`flex items-center gap-1.5 border rounded-xl px-3 py-2 text-xs transition-all backdrop-blur-sm ${
          showFlowField
            ? 'bg-blue-600/20 border-blue-500/40 text-blue-300'
            : 'bg-[#080f1f]/90 border-white/10 text-white/30 hover:text-white/60'
        }`}
      >
        <span className="text-sm">〰</span>
        currents
      </button>

      <div className="overflow-hidden rounded-xl border border-white/10 bg-[#080f1f]/90 backdrop-blur-sm">
        <div className="border-b border-white/10 px-3 py-2 text-xs">
          <span className="text-white/30">Date</span>
          <span className="ml-1.5 text-white/70">{DATE_FORMATTER.format(currentDate)}</span>
        </div>

        {/* Speed + play/pause row */}
        <div className="flex items-center gap-1.5 px-3 py-2">
          <button
            onClick={() => setRunning(!running)}
            className="text-white/40 hover:text-white transition-colors mr-1 text-sm leading-none"
            title={running ? 'Pause' : 'Resume'}
          >
            {running ? '⏸' : '▶'}
          </button>

          <div className="w-px h-3.5 bg-white/10" />

          {SPEED_OPTIONS.map((s) => (
            <button
              key={s}
              onClick={() => setSpeedMultiplier(s)}
              className={`px-2 py-0.5 rounded-md text-xs font-mono transition-colors ${
                speedMultiplier === s
                  ? 'bg-blue-600 text-white'
                  : 'text-white/35 hover:text-white'
              }`}
            >
              {s}×
            </button>
          ))}
        </div>
      </div>


    </div>
  )
}
