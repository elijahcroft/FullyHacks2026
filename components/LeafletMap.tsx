'use client'
/**
 * PERSON 1 — Map + UI
 *
 * The actual Leaflet map. Split from OceanMap so it can be
 * dynamically imported with ssr:false (Leaflet needs the DOM).
 *
 * CanvasOverlay is a react-leaflet child that draws all bottles
 * using requestAnimationFrame — it re-projects lat/lng → pixels
 * every frame so panning/zooming stays in sync automatically.
 */

import { MapContainer, TileLayer, useMap, useMapEvents } from 'react-leaflet'
import { useEffect, useRef } from 'react'
import type { Bottle } from '@/types'
import L from 'leaflet'

// ---- Types -----------------------------------------------------------------

interface Props {
  bottles: Bottle[]
  onMapClick: (lat: number, lng: number) => void
  onBottleClick: (bottle: Bottle) => void
}

// ---- Canvas overlay (renders inside MapContainer) --------------------------

function CanvasOverlay({ bottles, onBottleClick }: Omit<Props, 'onMapClick'>) {
  const map = useMap()
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const rafRef = useRef<number>(0)
  const timeRef = useRef(0)
  const bottlesRef = useRef(bottles)
  bottlesRef.current = bottles

  // Mount canvas on top of the map pane
  useEffect(() => {
    const canvas = canvasRef.current!
    const container = map.getContainer()
    container.style.position = 'relative'
    canvas.style.position = 'absolute'
    canvas.style.top = '0'
    canvas.style.left = '0'
    canvas.style.pointerEvents = 'none'
    canvas.style.zIndex = '400'

    const resize = () => {
      canvas.width = container.clientWidth
      canvas.height = container.clientHeight
    }
    resize()
    const ro = new ResizeObserver(resize)
    ro.observe(container)

    return () => ro.disconnect()
  }, [map])

  // Animation loop
  useEffect(() => {
    const canvas = canvasRef.current!

    const draw = (ts: number) => {
      timeRef.current = ts
      const ctx = canvas.getContext('2d')!
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      for (const bottle of bottlesRef.current) {
        const pt = map.latLngToContainerPoint([bottle.current_lat, bottle.current_lng])

        // Skip if off-screen
        if (pt.x < -20 || pt.x > canvas.width + 20 || pt.y < -20 || pt.y > canvas.height + 20) continue

        // Draw trail from path waypoints
        if (bottle.path.length > 1) {
          ctx.beginPath()
          const first = map.latLngToContainerPoint([bottle.path[0][0], bottle.path[0][1]])
          ctx.moveTo(first.x, first.y)
          for (let i = 1; i < bottle.path.length; i++) {
            const wp = map.latLngToContainerPoint([bottle.path[i][0], bottle.path[i][1]])
            ctx.lineTo(wp.x, wp.y)
          }
          ctx.lineTo(pt.x, pt.y)
          ctx.strokeStyle = bottle.status === 'garbage_patch'
            ? 'rgba(255,120,40,0.15)'
            : 'rgba(80,160,255,0.15)'
          ctx.lineWidth = 1
          ctx.stroke()
        }

        // Garbage patch pulse ring
        if (bottle.status === 'garbage_patch') {
          const pulse = ((ts % 1500) / 1500)
          const radius = 8 + pulse * 16
          ctx.beginPath()
          ctx.arc(pt.x, pt.y, radius, 0, Math.PI * 2)
          ctx.strokeStyle = `rgba(255,120,40,${0.5 * (1 - pulse)})`
          ctx.lineWidth = 1.5
          ctx.stroke()
        }

        // Glow halo
        const isTrapped = bottle.status === 'garbage_patch'
        const color = isTrapped ? '255,120,40' : '80,180,255'
        const glow = ctx.createRadialGradient(pt.x, pt.y, 0, pt.x, pt.y, 14)
        glow.addColorStop(0, `rgba(${color},0.6)`)
        glow.addColorStop(1, `rgba(${color},0)`)
        ctx.beginPath()
        ctx.arc(pt.x, pt.y, 14, 0, Math.PI * 2)
        ctx.fillStyle = glow
        ctx.fill()

        // Core dot
        ctx.beginPath()
        ctx.arc(pt.x, pt.y, 3, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(${color},1)`
        ctx.fill()
      }

      rafRef.current = requestAnimationFrame(draw)
    }

    rafRef.current = requestAnimationFrame(draw)
    return () => cancelAnimationFrame(rafRef.current)
  }, [map])

  // Click detection — re-enable pointer events on canvas and handle
  useEffect(() => {
    const canvas = canvasRef.current!
    canvas.style.pointerEvents = 'auto'

    const handleClick = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect()
      const mx = e.clientX - rect.left
      const my = e.clientY - rect.top

      for (const bottle of bottlesRef.current) {
        const pt = map.latLngToContainerPoint([bottle.current_lat, bottle.current_lng])
        if (Math.hypot(mx - pt.x, my - pt.y) < 14) {
          onBottleClick(bottle)
          e.stopPropagation()
          return
        }
      }
    }

    canvas.addEventListener('click', handleClick)
    return () => canvas.removeEventListener('click', handleClick)
  }, [map, onBottleClick])

  return <canvas ref={canvasRef} />
}

// ---- Map click handler -----------------------------------------------------

function MapClickHandler({ onMapClick }: { onMapClick: Props['onMapClick'] }) {
  useMapEvents({
    click(e) {
      onMapClick(e.latlng.lat, e.latlng.lng)
    },
  })
  return null
}

// ---- Garbage patch overlay -------------------------------------------------

function GarbagePatchOverlay() {
  const map = useMap()

  useEffect(() => {
    // Bounding box: 25–45°N, 135–155°W
    const rect = L.rectangle(
      [[25, -155], [45, -135]],
      {
        color: '#ff6b2b',
        weight: 1,
        fillColor: '#ff6b2b',
        fillOpacity: 0.07,
        dashArray: '4 4',
        interactive: false,
      },
    )
    rect.addTo(map)
    return () => { rect.remove() }
  }, [map])

  return null
}

// ---- Main export -----------------------------------------------------------

const DARK_TILE = 'https://{s}.basemaps.cartocdn.com/dark_nolabels/{z}/{x}/{y}{r}.png'
const LABEL_TILE = 'https://{s}.basemaps.cartocdn.com/dark_only_labels/{z}/{x}/{y}{r}.png'

export default function LeafletMap({ bottles, onMapClick, onBottleClick }: Props) {
  return (
    <MapContainer
      center={[20, -150]}
      zoom={3}
      minZoom={2}
      maxZoom={8}
      style={{ width: '100%', height: '100%', background: '#060d1a' }}
      zoomControl={false}
      worldCopyJump
    >
      {/* Dark ocean base */}
      <TileLayer url={DARK_TILE} attribution='&copy; CartoDB' />
      {/* Labels on top of canvas */}
      <TileLayer url={LABEL_TILE} pane="shadowPane" />

      <MapClickHandler onMapClick={onMapClick} />
      <GarbagePatchOverlay />
      <CanvasOverlay bottles={bottles} onBottleClick={onBottleClick} />
    </MapContainer>
  )
}
