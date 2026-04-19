'use client'
/**
 * PERSON 4 — Canvas Rendering + Visual Effects
 *
 * Animated particle system visualizing the ocean current flow field.
 * Particles spawn randomly, drift along the flow vectors, then fade out.
 * Technique: instead of clearing the canvas each frame, fill with a
 * semi-transparent background — old positions decay naturally, creating trails.
 *
 * Must be mounted inside a react-leaflet <MapContainer>.
 */

import { useEffect, useRef } from 'react'
import { useMap } from 'react-leaflet'
import { loadFlowField, sampleFlowField } from '@/simulation/flowField'
import type { FlowField, FlowFieldMeta } from '@/types'

const N_PARTICLES = 1000
const VISUAL_SCALE = 0.004  // degrees moved per frame (visual, not physical)
const MAX_AGE      = 120    // frames before particle respawns

interface Particle {
  lat: number
  lng: number
  age: number
  lifespan: number
}

function spawnParticle(): Particle {
  return {
    lat: Math.random() * 140 - 70,   // -70° to 70°
    lng: Math.random() * 360 - 180,  // -180° to 180°
    age: Math.floor(Math.random() * MAX_AGE), // stagger so they don't all reset at once
    lifespan: 80 + Math.random() * 80,
  }
}

export function FlowOverlay() {
  const map = useMap()
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const rafRef = useRef<number>(0)
  const fieldRef = useRef<{ field: FlowField; meta: FlowFieldMeta } | null>(null)
  const particlesRef = useRef<Particle[]>(Array.from({ length: N_PARTICLES }, spawnParticle))

  // Load flow field once
  useEffect(() => {
    loadFlowField().then((f) => { fieldRef.current = f })
  }, [])

  // Mount canvas below the bottle canvas (z-index 399)
  useEffect(() => {
    const canvas = canvasRef.current!
    const container = map.getContainer()
    Object.assign(canvas.style, {
      position: 'absolute',
      top: '0', left: '0',
      zIndex: '399',
      pointerEvents: 'none',
    })
    const resize = () => {
      canvas.width  = container.clientWidth
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

    const draw = () => {
      const ctx = canvas.getContext('2d')!

      // Fade previous frame instead of clearing — creates natural trails
      ctx.fillStyle = 'rgba(6,13,26,0.12)'
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      if (fieldRef.current) {
        const { field, meta } = fieldRef.current
        const particles = particlesRef.current

        // Batch segments by color+alpha bucket to avoid one stroke() per particle.
        // 5 speed buckets × 5 alpha buckets = ≤25 draw calls per frame instead of N_PARTICLES.
        const groups = new Map<string, { r: number; g: number; b: number; alpha: number; segs: number[] }>()

        for (let i = 0; i < particles.length; i++) {
          const p = particles[i]
          p.age++

          if (p.age > p.lifespan) {
            particles[i] = spawnParticle()
            continue
          }

          const vec = sampleFlowField(field, meta, p.lat, p.lng)
          const speed = Math.sqrt(vec.u ** 2 + vec.v ** 2)

          // Respawn particles that land on zero-flow areas (land / out of bounds)
          if (speed < 0.001) {
            particles[i] = spawnParticle()
            continue
          }

          const oldPt = map.latLngToContainerPoint([p.lat, p.lng])

          p.lat += vec.v * VISUAL_SCALE
          p.lng += vec.u * VISUAL_SCALE

          const newPt = map.latLngToContainerPoint([p.lat, p.lng])

          if (newPt.x < -10 || newPt.x > canvas.width + 10 || newPt.y < -10 || newPt.y > canvas.height + 10) {
            particles[i] = spawnParticle()
            continue
          }

          // Fade in, sustain, fade out over particle lifespan
          const t = p.age / p.lifespan
          const alpha = Math.sin(t * Math.PI) * 0.75

          // Color by speed: slow = deep blue, fast = cyan-white
          const s = Math.min(speed / 0.3, 1)
          const r = Math.round(20  + s * 180)
          const g = Math.round(80  + s * 150)
          const b = Math.round(200 + s * 55)

          // Bucket by quantised speed+alpha so we can batch strokes
          const alphaB = Math.round(alpha * 4) / 4  // 5 buckets
          const speedB = Math.round(s * 4) / 4       // 5 buckets
          const key = `${speedB},${alphaB}`
          let grp = groups.get(key)
          if (!grp) {
            grp = { r, g, b, alpha: alphaB, segs: [] }
            groups.set(key, grp)
          }
          grp.segs.push(oldPt.x, oldPt.y, newPt.x, newPt.y)
        }

        // One beginPath/stroke per bucket instead of one per particle
        ctx.lineWidth = 1
        for (const grp of groups.values()) {
          ctx.strokeStyle = `rgba(${grp.r},${grp.g},${grp.b},${grp.alpha})`
          ctx.beginPath()
          const segs = grp.segs
          for (let i = 0; i < segs.length; i += 4) {
            ctx.moveTo(segs[i], segs[i + 1])
            ctx.lineTo(segs[i + 2], segs[i + 3])
          }
          ctx.stroke()
        }
      }

      rafRef.current = requestAnimationFrame(draw)
    }

    rafRef.current = requestAnimationFrame(draw)
    return () => cancelAnimationFrame(rafRef.current)
  }, [map])

  return <canvas ref={canvasRef} />
}
