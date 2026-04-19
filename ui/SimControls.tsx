'use client'

import { useSimulationContext, SPEED_OPTIONS } from '@/simulation/context'

export function SimControls() {
  const {
    running, setRunning,
    speedMultiplier, setSpeedMultiplier,
    showFlowField, setShowFlowField,
    startDate, setStartDate,
    simDate,
  } = useSimulationContext()

  const simMonthYear = simDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })

  function handleStartDate(e: React.ChangeEvent<HTMLInputElement>) {
    const d = new Date(e.target.value + 'T12:00:00')
    if (!isNaN(d.getTime())) setStartDate(d)
  }

  return (
    <div className="fixed bottom-5 right-4 z-[1000] flex flex-col items-end gap-2">
      <div className="flex flex-col gap-2 bg-[#080f1f]/90 border border-white/10 rounded-xl px-3 py-2 backdrop-blur-sm">
        <div className="flex items-center gap-1.5">
          {/* Play/pause */}
          <button
            onClick={() => setRunning(!running)}
            className="text-white/40 hover:text-white transition-colors mr-0.5"
            title={running ? 'Pause' : 'Resume'}
            aria-label={running ? 'Pause simulation' : 'Resume simulation'}
          >
            {running ? (
              <svg
                aria-hidden="true"
                viewBox="0 0 16 16"
                className="h-3.5 w-3.5 fill-current"
              >
                <rect x="3" y="2.5" width="3" height="11" rx="0.75" />
                <rect x="10" y="2.5" width="3" height="11" rx="0.75" />
              </svg>
            ) : (
              <svg
                aria-hidden="true"
                viewBox="0 0 16 16"
                className="h-3.5 w-3.5 fill-current"
              >
                <path d="M4 2.75a.75.75 0 0 1 1.14-.64l7 4.25a.75.75 0 0 1 0 1.28l-7 4.25A.75.75 0 0 1 4 11.25z" />
              </svg>
            )}
          </button>

          <div className="w-px h-3.5 bg-white/10" />

          {/* Speed */}
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

          <div className="w-px h-3.5 bg-white/10" />

          <button
            onClick={() => setShowFlowField(!showFlowField)}
            className={`flex items-center gap-1.5 rounded-md px-2 py-0.5 text-xs transition-colors ${
              showFlowField
                ? 'bg-blue-600/20 text-blue-300'
                : 'text-white/30 hover:text-white/60'
            }`}
          >
            <span className="text-sm">〰</span>
            currents
          </button>
        </div>

        <div className="flex items-center gap-1.5">
          {/* Sim date display */}
          <span className="text-white/30 text-xs font-mono tabular-nums w-16 text-center">
            {simMonthYear}
          </span>

          <div className="w-px h-3.5 bg-white/10" />

          {/* Start date */}
          <div className="flex items-center gap-1">
            <span className="text-white/20 text-xs">from</span>
            <input
              type="date"
              value={startDate.toISOString().slice(0, 10)}
              onChange={handleStartDate}
              className="sim-date-input"
            />
          </div>
        </div>
      </div>
    </div>
  )
}
