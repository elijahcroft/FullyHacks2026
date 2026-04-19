'use client'
/**
 * PERSON 4 — Canvas Rendering + Visual Effects
 *
 * Renders all bottles as glowing particles on a canvas overlay.
 * The canvas is positioned absolutely over the map.
 *
 * Coordinate conversion:
 *   You'll receive (lat, lng) from bottle data.
 *   You need to convert those to (x, y) canvas pixels.
 *   Use the `latLngToPixel` prop provided by OceanMap.
 *
 * Visual goals:
 *   - Glowing dot per bottle (radial gradient, soft blue/white glow)
 *   - Faint trail (store last N positions per bottle in local state)
 *   - Ripple animation when a bottle is first dropped
 *   - Slow pulse on garbage_patch bottles (orange/red tint)
 *   - Clickable: call onBottleClick(bottle) when user clicks near a particle
 */

import { useRef, useEffect } from 'react'
import type { Bottle } from '@/types'

interface Props {
  bottles: Bottle[]
  width: number
  height: number
  latLngToPixel: (lat: number, lng: number) => { x: number; y: number }
  onBottleClick: (bottle: Bottle) => void
}

export function BottleCanvas({ bottles, width, height, latLngToPixel, onBottleClick }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')!

    ctx.clearRect(0, 0, width, height)

    for (const bottle of bottles) {
      const { x, y } = latLngToPixel(bottle.current_lat, bottle.current_lng)

      // TODO (Person 4): draw trail from bottle.path

      // Glow
      const color = bottle.status === 'garbage_patch' ? '255,120,40' : '80,180,255'
      const gradient = ctx.createRadialGradient(x, y, 0, x, y, 10)
      gradient.addColorStop(0, `rgba(${color},0.9)`)
      gradient.addColorStop(1, `rgba(${color},0)`)

      ctx.beginPath()
      ctx.arc(x, y, 10, 0, Math.PI * 2)
      ctx.fillStyle = gradient
      ctx.fill()

      // Core dot
      ctx.beginPath()
      ctx.arc(x, y, 3, 0, Math.PI * 2)
      ctx.fillStyle = `rgba(${color},1)`
      ctx.fill()
    }
  }, [bottles, width, height, latLngToPixel])

  const handleClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const rect = canvasRef.current!.getBoundingClientRect()
    const mx = e.clientX - rect.left
    const my = e.clientY - rect.top

    for (const bottle of bottles) {
      const { x, y } = latLngToPixel(bottle.current_lat, bottle.current_lng)
      const dist = Math.hypot(mx - x, my - y)
      if (dist < 12) {
        onBottleClick(bottle)
        return
      }
    }
  }

  return (
    <canvas
      ref={canvasRef}
      width={width}
      height={height}
      onClick={handleClick}
      style={{ position: 'absolute', top: 0, left: 0, pointerEvents: 'auto' }}
    />
  )
}
