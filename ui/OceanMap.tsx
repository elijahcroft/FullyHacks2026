'use client'
/**
 * PERSON 1 — Map + UI
 */

import dynamic from 'next/dynamic'
import { useState, useRef, useCallback } from 'react'
import { DropBottleModal } from './DropBottleModal'
import { BottleList } from './BottleList'
import { SimControls } from './SimControls'
import { ModeToggle } from './ModeToggle'
import { InterceptionPanel } from './InterceptionPanel'
import { GeminiChatWidget } from './GeminiChatWidget'
import { HazardOverlayControls } from './HazardOverlayControls'
import { useBottles } from '@/canvas/useBottles'
import { useSimulation } from '@/simulation/useSimulation'
import { useSimulationContext } from '@/simulation/context'
import type { Bottle, MapController } from '@/types'
import type { OverlayType } from '@/lib/marineZones'
import type { IncidentInterception } from '@/lib/interception'

export type InteractionMode = 'drag' | 'bottle'

const ArcGISMap = dynamic(() => import('@/ui/ArcGISMap'), { ssr: false })

export function OceanMap() {
  const { bottles, addBottles, updateBottles, clearAllBottles } = useBottles()
  const [mode, setMode] = useState<InteractionMode>('drag')
  const [dropTarget, setDropTarget] = useState<{ lat: number; lng: number } | null>(null)
  const [selectedBottle, setSelectedBottle] = useState<Bottle | null>(null)
  const [activeOverlays, setActiveOverlays] = useState<Set<OverlayType>>(new Set())
  const [interceptionData, setInterceptionData] = useState<IncidentInterception | null>(null)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const mapRef = useRef<MapController | null>(null)

  function toggleOverlay(type: OverlayType) {
    setActiveOverlays(prev => {
      const next = new Set(prev)
      next.has(type) ? next.delete(type) : next.add(type)
      return next
    })
  }

  function handleMapClick(lat: number, lng: number) {
    if (mode === 'bottle') {
      setSelectedBottle(null)
      setDropTarget({ lat, lng })
    }
  }

  function handleBottleClick(bottle: Bottle) {
    setSelectedBottle(bottle)
    mapRef.current?.flyTo(bottle.current_lat, bottle.current_lng, 5)
    setSidebarOpen(false)
  }

  function handleModeChange(newMode: InteractionMode) {
    setMode(newMode)
    if (newMode === 'bottle') setSidebarOpen(false)
  }

  const handleInterceptionComputed = useCallback((data: IncidentInterception | null) => {
    setInterceptionData(data)
  }, [])

  useSimulation(bottles, updateBottles)
  const { simDate } = useSimulationContext()

  return (
    <div className="relative w-full h-full">
      <ArcGISMap
        bottles={bottles}
        selectedBottle={selectedBottle}
        mode={mode}
        activeOverlays={activeOverlays}
        interception={interceptionData}
        onMapClick={handleMapClick}
        onBottleClick={handleBottleClick}
        onMapReady={(map) => { mapRef.current = map }}
      />

      {/* Desktop left sidebar — hidden on mobile */}
      <div className="hidden sm:flex absolute left-3 top-3 bottom-3 z-[1000] w-56 flex-col gap-2 pointer-events-none">
        <ModeToggle mode={mode} onChange={handleModeChange} />
        <BottleList bottles={bottles} mapRef={mapRef} onReset={clearAllBottles} onSelect={handleBottleClick} />
      </div>

      {/* Mobile sidebar toggle button */}
      <button
        onClick={() => setSidebarOpen(v => !v)}
        className="sm:hidden absolute left-3 top-3 z-[1000] bg-[#080f1f]/90 border border-white/10 rounded-xl p-2.5 text-white/60 backdrop-blur-sm transition-colors active:bg-white/10"
        aria-label="Toggle menu"
      >
        <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
          <path d="M2 4h14M2 9h14M2 14h14" />
        </svg>
      </button>

      {/* Mobile sidebar drawer */}
      {sidebarOpen && (
        <div
          className="sm:hidden fixed inset-0 z-[1400] bg-black/50 backdrop-blur-sm"
          onClick={() => setSidebarOpen(false)}
        >
          <div
            className="absolute bottom-0 left-0 right-0 bg-[#080f1f] border-t border-white/10 rounded-t-2xl px-4 pt-3 pb-6 max-h-[72vh] flex flex-col gap-3"
            onClick={e => e.stopPropagation()}
          >
            {/* Drag handle */}
            <div className="w-10 h-1 bg-white/20 rounded-full mx-auto mb-1 shrink-0" />
            <div className="pointer-events-auto shrink-0">
              <ModeToggle mode={mode} onChange={(m) => { handleModeChange(m) }} />
            </div>
            <div className="min-h-0 flex-1 pointer-events-auto">
              <BottleList
                bottles={bottles}
                mapRef={mapRef}
                onReset={() => { clearAllBottles(); setSidebarOpen(false) }}
                onSelect={(b) => { handleBottleClick(b); setSidebarOpen(false) }}
              />
            </div>
          </div>
        </div>
      )}

      {dropTarget && (
        <DropBottleModal
          lat={dropTarget.lat}
          lng={dropTarget.lng}
          onClose={() => setDropTarget(null)}
          onBottleDropped={(spawnedBottles) => {
            addBottles(spawnedBottles)
            setDropTarget(null)
            setMode('drag')
          }}
        />
      )}

      {/* Right panel / bottom sheet — interception analysis */}
      <InterceptionPanel
        bottle={selectedBottle}
        simDate={simDate ?? new Date()}
        onClose={() => { setSelectedBottle(null); setInterceptionData(null) }}
        onInterceptionComputed={handleInterceptionComputed}
      />

      {/* HUD — top center */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[1000] pointer-events-none select-none">
        <div className="bg-[#080f1f]/80 border border-white/10 rounded-full px-3 py-1.5 text-xs text-white/40 backdrop-blur-sm tracking-wide whitespace-nowrap">
          {bottles.length} incident{bottles.length !== 1 ? 's' : ''}
          <span className="hidden sm:inline">
            <span className="mx-2 text-white/15">·</span>
            {mode === 'bottle' ? 'click the ocean to report' : 'drag to explore'}
          </span>
        </div>
      </div>

      <HazardOverlayControls activeOverlays={activeOverlays} onToggle={toggleOverlay} />

      <GeminiChatWidget bottles={bottles} selectedBottle={selectedBottle} />

      <SimControls />
    </div>
  )
}
