'use client'
/**
 * PERSON 1 — Map + UI
 *
 * Toolbar toggle between drag/explore and bottle-drop modes.
 * Lives in the left sidebar above the bottle list actions.
 * Keyboard shortcuts: D = drag, B = bottle.
 */

import { useEffect } from 'react'
import type { InteractionMode } from './OceanMap'

interface Props {
  mode: InteractionMode
  onChange: (mode: InteractionMode) => void
}

export function ModeToggle({ mode, onChange }: Props) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return
      if (e.key === 'd' || e.key === 'D') onChange('drag')
      if (e.key === 'b' || e.key === 'B') onChange('bottle')
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onChange])

  return (
    <div className="pointer-events-auto flex w-fit gap-1.5 self-start bg-[#080f1f]/90 border border-white/10 rounded-xl p-1 backdrop-blur-sm">
      <ModeButton
        active={mode === 'drag'}
        onClick={() => onChange('drag')}
        title="Drag to explore (D)"
        shortcut="D"
      >
        <PanIcon />
      </ModeButton>

      <ModeButton
        active={mode === 'bottle'}
        onClick={() => onChange('bottle')}
        title="Click to drop a bottle (B)"
        shortcut="B"
      >
        <BottleIcon />
      </ModeButton>

    </div>
  )
}

function ModeButton({
  active, onClick, title, shortcut, children,
}: {
  active: boolean
  onClick: () => void
  title: string
  shortcut: string
  children: React.ReactNode
}) {
  const activeClass = 'bg-blue-600 text-white shadow-lg shadow-blue-900/40'

  return (
    <button
      onClick={onClick}
      title={title}
      className={`relative w-9 h-9 rounded-lg flex items-center justify-center transition-all ${
        active ? activeClass : 'text-white/35 hover:text-white/70 hover:bg-white/5'
      }`}
    >
      {children}
      <span className={`absolute -bottom-0.5 -right-0.5 text-[8px] font-mono leading-none px-0.5 rounded ${
        active ? 'text-blue-300' : 'text-white/20'
      }`}>
        {shortcut}
      </span>
    </button>
  )
}

function PanIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M8 1v14M1 8h14M4 4l-3 4 3 4M12 4l3 4-3 4M4 4l4-3 4 3M4 12l4 3 4-3" />
    </svg>
  )
}

function BottleIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 1h4" />
      <path d="M6.5 1v2.5C4.5 5 3 7 3 9.5a5 5 0 0 0 10 0C13 7 11.5 5 9.5 3.5V1" />
      <path d="M5.5 9.5c.5-1 2.5-1 3 0" />
    </svg>
  )
}

function SpillIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      {/* oil droplet */}
      <path d="M8 2 C8 2, 13 8, 13 10.5 a5 5 0 0 1-10 0 C3 8, 8 2, 8 2Z" />
      {/* spill waves */}
      <path d="M3 14 C4.5 13.2, 5.5 14.8, 7 14" strokeWidth="1.2" opacity="0.7" />
      <path d="M9 14 C10.5 13.2, 11.5 14.8, 13 14" strokeWidth="1.2" opacity="0.7" />
    </svg>
  )
}
