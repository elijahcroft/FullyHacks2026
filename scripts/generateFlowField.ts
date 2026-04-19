/**
 * PERSON 2 — Flow Field + Simulation Engine
 *
 * Generates a pre-baked ocean current vector field JSON using
 * known major ocean gyre patterns. Run once to produce data/currentField.json.
 *
 * Usage:
 *   npx tsx scripts/generateFlowField.ts
 *
 * Gyres modeled (simplified circular flows):
 *   - North Pacific Gyre (clockwise):   center ~35°N, 160°W
 *   - South Pacific Gyre (counter-CW):  center ~30°S, 130°W
 *   - North Atlantic Gyre (clockwise):  center ~30°N, 40°W
 *   - South Atlantic Gyre (counter-CW): center ~25°S, 15°W
 *   - Indian Ocean Gyre (counter-CW):   center ~30°S, 80°E
 */

import { writeFileSync } from 'fs'
import type { CurrentVector, FlowField, FlowFieldMeta } from '../types/index'

const meta: FlowFieldMeta = {
  latMin: -80,
  latMax: 80,
  lngMin: -180,
  lngMax: 180,
  latStep: 1,
  lngStep: 1,
  rows: 161,
  cols: 361,
}

interface Gyre {
  centerLat: number
  centerLng: number
  radiusDeg: number
  strength: number   // m/s at peak
  clockwise: boolean
}

const GYRES: Gyre[] = [
  { centerLat: 35,  centerLng: -160, radiusDeg: 35, strength: 0.3, clockwise: true  }, // N Pacific
  { centerLat: -30, centerLng: -130, radiusDeg: 30, strength: 0.2, clockwise: false }, // S Pacific
  { centerLat: 30,  centerLng: -40,  radiusDeg: 30, strength: 0.3, clockwise: true  }, // N Atlantic
  { centerLat: -25, centerLng: -15,  radiusDeg: 25, strength: 0.2, clockwise: false }, // S Atlantic
  { centerLat: -30, centerLng: 80,   radiusDeg: 30, strength: 0.2, clockwise: false }, // Indian
]

function gyreVector(lat: number, lng: number, gyre: Gyre): CurrentVector {
  const dlat = lat - gyre.centerLat
  let dlng = lng - gyre.centerLng
  // Wrap longitude
  if (dlng > 180) dlng -= 360
  if (dlng < -180) dlng += 360

  const dist = Math.sqrt(dlat ** 2 + dlng ** 2)
  if (dist > gyre.radiusDeg || dist < 0.5) return { u: 0, v: 0 }

  // Gaussian falloff
  const magnitude = gyre.strength * Math.exp(-((dist / (gyre.radiusDeg * 0.5)) ** 2))

  // Perpendicular to radial direction (tangent)
  const sign = gyre.clockwise ? 1 : -1
  const nx = dlat / dist
  const ny = dlng / dist

  return {
    u: sign * nx * magnitude,  // eastward = perpendicular to north component
    v: -sign * ny * magnitude, // northward = perpendicular to east component
  }
}

const field: FlowField = []
for (let r = 0; r < meta.rows; r++) {
  const lat = meta.latMin + r * meta.latStep
  field[r] = []
  for (let c = 0; c < meta.cols; c++) {
    const lng = meta.lngMin + c * meta.lngStep
    let u = 0
    let v = 0
    for (const gyre of GYRES) {
      const vec = gyreVector(lat, lng, gyre)
      u += vec.u
      v += vec.v
    }
    field[r][c] = { u, v }
  }
}

writeFileSync(
  'data/currentField.json',
  JSON.stringify({ meta, field }, null, 0),
)
console.log('✓ Wrote data/currentField.json')
