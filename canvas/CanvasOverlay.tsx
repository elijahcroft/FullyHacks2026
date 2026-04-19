'use client'
/**
 * PERSON 4 — Canvas Rendering + Visual Effects
 */

import { useEffect, useRef } from 'react'
import { useMap } from 'react-leaflet'
import type { Bottle } from '@/types'

interface Props {
  bottles: Bottle[]
  selectedBottle: Bottle | null
  onBottleClick: (bottle: Bottle) => void
}

// How fast rendered position chases actual position (per frame at 60fps).
// 0.08 = smooth ~0.8s catch-up. Higher = snappier, lower = laggier.
const LERP = 0.08

type LeafletMap = ReturnType<typeof useMap>

export function CanvasOverlay({ bottles, selectedBottle, onBottleClick }: Props) {
  const map = useMap()
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const rafRef = useRef<number>(0)
  const bottlesRef = useRef(bottles)
<<<<<<< HEAD
  bottlesRef.current = bottles
=======
  const selectedRef = useRef(selectedBottle)
  const speedRef = useRef(speedMultiplier)

  // Smoothed render positions per bottle id
  const renderPos = useRef<Map<string, { lat: number; lng: number }>>(new Map())

  bottlesRef.current = bottles
  selectedRef.current = selectedBottle
  speedRef.current = speedMultiplier
>>>>>>> 29a5078de118f70b3a661c93f31b5cae884dac40

  // Mount canvas
  useEffect(() => {
    const canvas = canvasRef.current!
    const container = map.getContainer()
    container.style.position = 'relative'
    Object.assign(canvas.style, {
      position: 'absolute', top: '0', left: '0',
      zIndex: '400', pointerEvents: 'none',
    })
    const resize = () => { canvas.width = container.clientWidth; canvas.height = container.clientHeight }
    resize()
    const ro = new ResizeObserver(resize)
    ro.observe(container)
    return () => ro.disconnect()
  }, [map])

  // 60fps draw loop with lerp
  useEffect(() => {
    const canvas = canvasRef.current!

    const draw = (ts: number) => {
      const ctx = canvas.getContext('2d')!
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      for (const bottle of bottlesRef.current) {
        // Initialise render position on first sight, then lerp toward actual
        let rp = renderPos.current.get(bottle.id)
        if (!rp) {
          rp = { lat: bottle.current_lat, lng: bottle.current_lng }
          renderPos.current.set(bottle.id, rp)
        } else {
          rp.lat += (bottle.current_lat - rp.lat) * LERP
          rp.lng += (bottle.current_lng - rp.lng) * LERP
        }

<<<<<<< HEAD
        drawTrail(ctx, bottle, map)
=======
        // Wrap longitude into [-180, 180] so bottles don't vanish at the antimeridian
        const wrappedLng = ((rp.lng + 180) % 360 + 360) % 360 - 180
        const pt = map.latLngToContainerPoint([rp.lat, wrappedLng])
        // Generous buffer so bottles near the edge don't pop in/out
        if (pt.x < -120 || pt.x > canvas.width + 120 || pt.y < -120 || pt.y > canvas.height + 120) continue

        const isSelected = selectedRef.current?.id === bottle.id

        drawTrail(ctx, bottle, rp, map, speedRef.current)
>>>>>>> 29a5078de118f70b3a661c93f31b5cae884dac40
        if (bottle.status === 'garbage_patch') drawPulseRing(ctx, pt.x, pt.y, ts)
        if (isSelected) drawSelectionRing(ctx, pt.x, pt.y, ts)
        drawGlow(ctx, pt.x, pt.y, bottle.status, isSelected)
      }

      // Clean up render positions for removed bottles
      if (renderPos.current.size > bottlesRef.current.length + 10) {
        const ids = new Set(bottlesRef.current.map(b => b.id))
        for (const id of renderPos.current.keys()) {
          if (!ids.has(id)) renderPos.current.delete(id)
        }
      }

      rafRef.current = requestAnimationFrame(draw)
    }

    rafRef.current = requestAnimationFrame(draw)
    return () => cancelAnimationFrame(rafRef.current)
  }, [map])

  // Click detection
  useEffect(() => {
    const canvas = canvasRef.current!
    canvas.style.pointerEvents = 'auto'

    const onClick = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect()
      const mx = e.clientX - rect.left
      const my = e.clientY - rect.top
      for (const bottle of bottlesRef.current) {
        const rp = renderPos.current.get(bottle.id)
        const rawLng = rp?.lng ?? bottle.current_lng
        const wrappedLng = ((rawLng + 180) % 360 + 360) % 360 - 180
        const pt = map.latLngToContainerPoint([rp?.lat ?? bottle.current_lat, wrappedLng])
        if (Math.hypot(mx - pt.x, my - pt.y) < 16) {
          onBottleClick(bottle)
          e.stopPropagation()
          return
        }
      }
    }

    canvas.addEventListener('click', onClick)
    return () => canvas.removeEventListener('click', onClick)
  }, [map, onBottleClick])

  return <canvas ref={canvasRef} />
}

// ---- Drawing helpers -------------------------------------------------------

<<<<<<< HEAD
type LeafletMap = ReturnType<typeof useMap>

function drawTrail(ctx: CanvasRenderingContext2D, bottle: Bottle, map: LeafletMap) {
  if (bottle.path.length < 2) return

  const slice = bottle.path

=======
function drawTrail(
  ctx: CanvasRenderingContext2D,
  bottle: Bottle,
  rp: { lat: number; lng: number },
  map: LeafletMap,
  speed: number,
) {
  if (bottle.path.length < 2) return

  const maxWaypoints = Math.min(bottle.path.length, 6 + Math.floor(Math.log10(Math.max(speed, 1)) * 4))
  const slice = bottle.path.slice(-maxWaypoints)
>>>>>>> 29a5078de118f70b3a661c93f31b5cae884dac40
  const color = bottle.status === 'garbage_patch' ? '255,120,40' : '80,160,255'

  ctx.beginPath()
  const first = map.latLngToContainerPoint([slice[0][0], slice[0][1]])
  ctx.moveTo(first.x, first.y)
  for (let i = 1; i < slice.length; i++) {
    const wp = map.latLngToContainerPoint([slice[i][0], slice[i][1]])
    ctx.lineTo(wp.x, wp.y)
  }
  // Connect to smoothed position
  const cur = map.latLngToContainerPoint([rp.lat, rp.lng])
  ctx.lineTo(cur.x, cur.y)
  ctx.strokeStyle = `rgba(${color},0.2)`
  ctx.lineWidth = 1.5
  ctx.stroke()
}

function drawPulseRing(ctx: CanvasRenderingContext2D, x: number, y: number, ts: number) {
  const t = (ts % 1800) / 1800
  ctx.beginPath()
  ctx.arc(x, y, 8 + t * 20, 0, Math.PI * 2)
  ctx.strokeStyle = `rgba(255,120,40,${0.5 * (1 - t)})`
  ctx.lineWidth = 1.5
  ctx.stroke()
}

function drawSelectionRing(ctx: CanvasRenderingContext2D, x: number, y: number, ts: number) {
  const pulse = 0.6 + 0.4 * Math.sin(ts / 300)
  ctx.beginPath()
  ctx.arc(x, y, 18, 0, Math.PI * 2)
  ctx.strokeStyle = `rgba(255,255,255,${pulse * 0.8})`
  ctx.lineWidth = 1.5
  ctx.stroke()
}

function drawGlow(
  ctx: CanvasRenderingContext2D,
  x: number, y: number,
  status: Bottle['status'],
  isSelected: boolean,
) {
  const color = status === 'garbage_patch' ? '255,120,40' : '80,180,255'
  const radius = isSelected ? 20 : 14

  const glow = ctx.createRadialGradient(x, y, 0, x, y, radius)
  glow.addColorStop(0, `rgba(${color},${isSelected ? 0.9 : 0.7})`)
  glow.addColorStop(1, `rgba(${color},0)`)
  ctx.beginPath()
  ctx.arc(x, y, radius, 0, Math.PI * 2)
  ctx.fillStyle = glow
  ctx.fill()

  ctx.beginPath()
  ctx.arc(x, y, isSelected ? 4 : 3, 0, Math.PI * 2)
  ctx.fillStyle = `rgba(${color},1)`
  ctx.fill()
}
