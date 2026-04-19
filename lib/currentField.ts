/**
 * PERSON 2 — Flow Field + Simulation Engine
 *
 * Loads and samples the ocean current vector field.
 * The field is a grid of (u, v) vectors where:
 *   u = eastward velocity (m/s)
 *   v = northward velocity (m/s)
 *
 * Priority for data source:
 *   1. HYCOM THREDDS API (live, global daily data)
 *   2. Copernicus Marine API (requires free account)
 *   3. OSCAR dataset
 *   4. /data/currentField.json (pre-baked fallback — start here)
 */

import type { CurrentVector, FlowField, FlowFieldMeta } from '@/types'

// TODO: Load from /data/currentField.json initially.
// Shape: { meta: FlowFieldMeta, field: FlowField }
let cachedField: FlowField | null = null
let cachedMeta: FlowFieldMeta | null = null

export async function loadFlowField(): Promise<{ field: FlowField; meta: FlowFieldMeta }> {
  if (cachedField && cachedMeta) return { field: cachedField, meta: cachedMeta }

  const res = await fetch('/data/currentField.json')
  if (!res.ok) throw new Error(`Failed to load flow field: ${res.status} ${res.url}`)
  const data = await res.json()

  cachedField = data.field
  cachedMeta = data.meta
  return { field: cachedField!, meta: cachedMeta! }
}

/**
 * Bilinearly interpolate the flow field at an arbitrary (lat, lng).
 * Returns { u: 0, v: 0 } for points over land or out of bounds.
 */
export function sampleFlowField(
  field: FlowField,
  meta: FlowFieldMeta,
  lat: number,
  lng: number,
): CurrentVector {
  const { latMin, latMax, lngMin, lngMax, latStep, lngStep } = meta

  if (lat < latMin || lat > latMax || lng < lngMin || lng > lngMax) {
    return { u: 0, v: 0 }
  }

  // Grid indices (fractional)
  const row = (lat - latMin) / latStep
  const col = (lng - lngMin) / lngStep

  const r0 = Math.floor(row)
  const c0 = Math.floor(col)
  const r1 = Math.min(r0 + 1, meta.rows - 1)
  const c1 = Math.min(c0 + 1, meta.cols - 1)

  const dr = row - r0
  const dc = col - c0

  // Bilinear interpolation
  const interp = (key: keyof CurrentVector) =>
    field[r0][c0][key] * (1 - dr) * (1 - dc) +
    field[r1][c0][key] * dr * (1 - dc) +
    field[r0][c1][key] * (1 - dr) * dc +
    field[r1][c1][key] * dr * dc

  return { u: interp('u'), v: interp('v') }
}
