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

      {/* Main controls row */}
      <div className="flex items-center gap-1.5 bg-[#080f1f]/90 border border-white/10 rounded-xl px-3 py-2 backdrop-blur-sm">

        {/* Play/pause */}
        <button
          onClick={() => setRunning(!running)}
          className="text-white/40 hover:text-white transition-colors mr-0.5 text-sm leading-none"
          title={running ? 'Pause' : 'Resume'}
        >
          {running ? '⏸' : '▶'}
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

    </div>
  )
}
