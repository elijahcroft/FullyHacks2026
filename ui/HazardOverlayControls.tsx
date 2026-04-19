'use client'

import { useState } from 'react'
import { OVERLAY_CONFIGS, type OverlayType } from '@/lib/marineZones'

interface Props {
  activeOverlays: Set<OverlayType>
  onToggle: (type: OverlayType) => void
}

const ICONS: Record<OverlayType, string> = {
  'turtle-nesting':  '🐢',
  'coral-reef':      '🪸',
  'whale-migration': '🐋',
  'fishing-ground':  '🎣',
  'marine-protected':'🛡',
  'coastline':       '🏖',
}

export function HazardOverlayControls({ activeOverlays, onToggle }: Props) {
  const [open, setOpen] = useState(false)
  const activeCount = OVERLAY_CONFIGS.filter(o => activeOverlays.has(o.type)).length

  return (
    <div className="absolute top-4 right-4 z-[1100] select-none">
      <div className="bg-[#080f1f]/90 border border-white/10 rounded-2xl overflow-hidden backdrop-blur-sm shadow-2xl min-w-[210px]">
        {/* Header toggle */}
        <button
          onClick={() => setOpen(v => !v)}
          className="w-full flex items-center gap-2.5 px-4 py-2.5 hover:bg-white/5 transition-colors"
        >
          <span className="text-sm">🌊</span>
          <span className="text-xs text-white/60 flex-1 text-left tracking-wide">Ecosystem Layers</span>
          {activeCount > 0 && (
            <span className="bg-blue-500/20 text-blue-400 text-[10px] px-1.5 py-0.5 rounded-full border border-blue-500/20 leading-none">
              {activeCount}
            </span>
          )}
          <span className="text-white/25 text-xs">{open ? '▲' : '▼'}</span>
        </button>

        {/* Layer list */}
        {open && (
          <div className="border-t border-white/5 p-1.5 space-y-0.5">
            {OVERLAY_CONFIGS.map(({ type, label, color }) => {
              const active = activeOverlays.has(type)
              return (
                <button
                  key={type}
                  onClick={() => onToggle(type)}
                  className={`w-full flex items-center gap-2.5 px-3 py-1.5 rounded-xl transition-all text-left ${
                    active ? 'bg-white/5 border border-white/8' : 'hover:bg-white/3 border border-transparent'
                  }`}
                >
                  <span className="text-sm leading-none">{ICONS[type]}</span>
                  <span className={`text-xs flex-1 transition-colors ${active ? 'text-white/75' : 'text-white/35'}`}>
                    {label}
                  </span>
                  {/* Checkbox */}
                  <div
                    className="size-3.5 rounded border flex items-center justify-center shrink-0 transition-all"
                    style={active ? { background: color, borderColor: color } : { borderColor: 'rgba(255,255,255,0.1)' }}
                  >
                    {active && (
                      <svg className="size-2.5 text-white" viewBox="0 0 16 16" fill="currentColor">
                        <path d="M13.854 3.646a.5.5 0 0 1 0 .708l-7 7a.5.5 0 0 1-.708 0l-3.5-3.5a.5.5 0 1 1 .708-.708L6.5 10.293l6.646-6.647a.5.5 0 0 1 .708 0z"/>
                      </svg>
                    )}
                  </div>
                </button>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
