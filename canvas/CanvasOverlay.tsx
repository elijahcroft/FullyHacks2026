'use client'
/**
 * PERSON 4 — Canvas Rendering + Visual Effects
 *
 * Renders all bottles on a canvas that sits on top of the Leaflet map.
 * Must be mounted inside a react-leaflet <MapContainer>.
 *
 * Uses requestAnimationFrame for smooth 60fps animation.
 * Re-projects lat/lng → pixels every frame via map.latLngToContainerPoint()
 * so the canvas stays aligned during pan/zoom automatically.
 *
 * Reads speedMultiplier from SimulationContext to scale trail length.
 */

import { useEffect, useRef } from 'react'
import { useMap } from 'react-leaflet'
import type { Bottle } from '@/types'

interface Props {
  bottles: Bottle[]
  onBottleClick: (bottle: Bottle) => void
}

export function CanvasOverlay({ bottles, onBottleClick }: Props) {
  const map = useMap()
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const rafRef = useRef<number>(0)
  const bottlesRef = useRef(bottles)
  bottlesRef.current = bottles

  // Mount canvas over the map container
  useEffect(() => {
    const canvas = canvasRef.current!
    const container = map.getContainer()
    container.style.position = 'relative'
    Object.assign(canvas.style, {
      position: 'absolute',
      top: '0',
      left: '0',
      zIndex: '400',
      pointerEvents: 'none',
    })

    const resize = () => {
      canvas.width = container.clientWidth
      canvas.height = container.clientHeight
    }
    resize()
    const ro = new ResizeObserver(resize)
    ro.observe(container)
    return () => ro.disconnect()
  }, [map])

  // 60fps draw loop
  useEffect(() => {
    const canvas = canvasRef.current!

    const draw = (ts: number) => {
      const ctx = canvas.getContext('2d')!
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      for (const bottle of bottlesRef.current) {
        const pt = map.latLngToContainerPoint([bottle.current_lat, bottle.current_lng])
        if (pt.x < -30 || pt.x > canvas.width + 30 || pt.y < -30 || pt.y > canvas.height + 30) continue

        drawTrail(ctx, bottle, map)
        if (bottle.status === 'garbage_patch') drawPulseRing(ctx, pt.x, pt.y, ts)
        drawGlow(ctx, pt.x, pt.y, bottle.status)
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
        const pt = map.latLngToContainerPoint([bottle.current_lat, bottle.current_lng])
        if (Math.hypot(mx - pt.x, my - pt.y) < 14) {
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

type LeafletMap = ReturnType<typeof useMap>

function drawTrail(ctx: CanvasRenderingContext2D, bottle: Bottle, map: LeafletMap) {
  if (bottle.path.length < 2) return

  const slice = bottle.path

  const color = bottle.status === 'garbage_patch' ? '255,120,40' : '80,160,255'

  ctx.beginPath()
  const first = map.latLngToContainerPoint([slice[0][0], slice[0][1]])
  ctx.moveTo(first.x, first.y)

  for (let i = 1; i < slice.length; i++) {
    const wp = map.latLngToContainerPoint([slice[i][0], slice[i][1]])
    ctx.lineTo(wp.x, wp.y)
  }

  // Connect trail to current position
  const cur = map.latLngToContainerPoint([bottle.current_lat, bottle.current_lng])
  ctx.lineTo(cur.x, cur.y)

  ctx.strokeStyle = `rgba(${color},0.18)`
  ctx.lineWidth = 1.5
  ctx.stroke()
}

function drawPulseRing(ctx: CanvasRenderingContext2D, x: number, y: number, ts: number) {
  const t = (ts % 1800) / 1800
  ctx.beginPath()
  ctx.arc(x, y, 8 + t * 20, 0, Math.PI * 2)
  ctx.strokeStyle = `rgba(255,120,40,${0.6 * (1 - t)})`
  ctx.lineWidth = 1.5
  ctx.stroke()
}

function drawGlow(ctx: CanvasRenderingContext2D, x: number, y: number, status: Bottle['status']) {
  const color = status === 'garbage_patch' ? '255,120,40' : '80,180,255'

  const glow = ctx.createRadialGradient(x, y, 0, x, y, 14)
  glow.addColorStop(0, `rgba(${color},0.7)`)
  glow.addColorStop(1, `rgba(${color},0)`)
  ctx.beginPath()
  ctx.arc(x, y, 14, 0, Math.PI * 2)
  ctx.fillStyle = glow
  ctx.fill()

  ctx.beginPath()
  ctx.arc(x, y, 3, 0, Math.PI * 2)
  ctx.fillStyle = `rgba(${color},1)`
  ctx.fill()
}
