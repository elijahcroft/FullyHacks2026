/**
 * PERSON 2 — Flow Field + Simulation Engine
 *
 * Core physics tick for bottle drift simulation.
 * This module is pure (no I/O, no DB calls) — easy to unit test.
 *
 * Time model:
 *   Each tick advances the simulation by `dtDays` simulated days.
 *   1 real second ≈ 1 simulated day at default speed.
 *   Speed multiplier (1x, 10x, 100x, 1000x) is applied by the caller.
 */

import { sampleFlowField } from './flowField'
import { isOnLand } from '@/lib/landPolygons'
import type { Bottle, BottleStatus, FlowField, FlowFieldMeta, TickOptions } from '@/types'

// Great Pacific Garbage Patch bounding box
const GARBAGE_PATCH = { latMin: 25, latMax: 45, lngMin: -155, lngMax: -135 }

// Degrees per meter (approx)
const DEG_PER_METER = 1 / 111_000

// How often to record a path waypoint (simulated days)
const PATH_SAMPLE_INTERVAL = 1

const DEFAULT_OPTIONS: TickOptions = {
  dtDays: 1,
  speedMultiplier: 1,
  turbulence: 0.05,
}

/**
 * Advance a single bottle by one tick.
 * Returns the updated bottle (does not mutate the original).
 */
export function tickBottle(
  bottle: Bottle,
  field: FlowField,
  meta: FlowFieldMeta,
  options: Partial<TickOptions> = {},
): Bottle {
  const opts = { ...DEFAULT_OPTIONS, ...options }

  if (bottle.status !== 'drifting') return bottle

  const dt = opts.dtDays * opts.speedMultiplier

  // Sample current at current position
  const current = sampleFlowField(field, meta, bottle.current_lat, bottle.current_lng)

  // Scale current from m/s → degrees/day  (86400 s/day * DEG_PER_METER)
  const scale = 86_400 * DEG_PER_METER * dt
  const turbU = (Math.random() - 0.5) * opts.turbulence
  const turbV = (Math.random() - 0.5) * opts.turbulence

  const newLat = bottle.current_lat + (current.v + turbV) * scale
  const newLng = bottle.current_lng + (current.u + turbU) * scale
  const newDays = bottle.days_drifted + dt

  // Determine new status
  const newStatus = detectStatus(newLat, newLng)

  // Record path waypoint every PATH_SAMPLE_INTERVAL days
  const shouldSample =
    Math.floor(newDays / PATH_SAMPLE_INTERVAL) >
    Math.floor(bottle.days_drifted / PATH_SAMPLE_INTERVAL)

  const newPath: [number, number][] = shouldSample
    ? [...bottle.path, [newLat, newLng]]
    : bottle.path

  return {
    ...bottle,
    current_lat: newLat,
    current_lng: newLng,
    days_drifted: newDays,
    status: newStatus,
    path: newPath,
    destination: newStatus !== 'drifting' ? statusToDestination(newStatus, newLat, newLng) : bottle.destination,
  }
}

/** Advance all bottles by one tick. */
export function tickAll(
  bottles: Bottle[],
  field: FlowField,
  meta: FlowFieldMeta,
  options?: Partial<TickOptions>,
): Bottle[] {
  return bottles.map((b) => tickBottle(b, field, meta, options))
}

function detectStatus(lat: number, lng: number): BottleStatus {
  if (
    lat >= GARBAGE_PATCH.latMin &&
    lat <= GARBAGE_PATCH.latMax &&
    lng >= GARBAGE_PATCH.lngMin &&
    lng <= GARBAGE_PATCH.lngMax
  ) {
    return 'garbage_patch'
  }
  if (isOnLand(lat, lng)) return 'ashore'
  return 'drifting'
}

function statusToDestination(status: BottleStatus, lat: number, lng: number): string {
  if (status === 'garbage_patch') return 'Great Pacific Garbage Patch'
  if (status === 'ashore') return `Coastline (${lat.toFixed(2)}°, ${lng.toFixed(2)}°)`
  return ''
}
