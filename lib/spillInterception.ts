import { sampleFlowField } from '@/simulation/flowField'
import { isOnLand } from '@/lib/landPolygons'
import type { FlowField, FlowFieldMeta } from '@/types'

const DEG_PER_METER = 1 / 111_000

// Realistic open-ocean response vessel: ~8–9 knots average speed
export const DEFAULT_VESSEL_SPEED_KM_PER_DAY = 400
export const SPILL_SIM_DAYS = 90

export interface InterceptionResult {
  interceptionPoint: [number, number]
  daysToIntercept: number
  vesselDistanceKm: number
  feasible: boolean
  spillPathToIntercept: [number, number][]
}

export function haversineDistanceKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371
  const dLat = (lat2 - lat1) * (Math.PI / 180)
  const dLng = (lng2 - lng1) * (Math.PI / 180)
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) * Math.sin(dLng / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

/**
 * Deterministic (no turbulence) forward-simulation of a spill.
 * Returns positions at day 0, 1, 2, ... (index == day number).
 */
export function simulateSpillDrift(
  lat: number,
  lng: number,
  field: FlowField,
  meta: FlowFieldMeta,
  days = SPILL_SIM_DAYS,
): [number, number][] {
  const path: [number, number][] = [[lat, lng]]
  let curLat = lat
  let curLng = lng
  const scale = 86_400 * DEG_PER_METER // 1 day, no turbulence

  for (let d = 0; d < days; d++) {
    if (isOnLand(curLat, curLng)) break
    const current = sampleFlowField(field, meta, curLat, curLng)
    curLat += current.v * scale
    curLng += current.u * scale
    path.push([curLat, curLng])
  }
  return path
}

/**
 * Finds the earliest day on which a vessel starting at vesselStart can
 * intercept the drifting spill.  The vessel travels in a straight line at
 * vesselSpeedKmPerDay.  Returns the first day T where travel_time ≤ T.
 */
export function findInterceptionPoint(
  driftPath: [number, number][],
  vesselStart: [number, number],
  vesselSpeedKmPerDay = DEFAULT_VESSEL_SPEED_KM_PER_DAY,
): InterceptionResult {
  for (let day = 0; day < driftPath.length; day++) {
    const [spillLat, spillLng] = driftPath[day]
    const distKm = haversineDistanceKm(vesselStart[0], vesselStart[1], spillLat, spillLng)
    if (distKm / vesselSpeedKmPerDay <= day) {
      return {
        interceptionPoint: [spillLat, spillLng],
        daysToIntercept: day,
        vesselDistanceKm: Math.round(distKm),
        feasible: true,
        spillPathToIntercept: driftPath.slice(0, day + 1),
      }
    }
  }

  // Cannot intercept within the simulation window
  const last = driftPath[driftPath.length - 1]
  return {
    interceptionPoint: last,
    daysToIntercept: -1,
    vesselDistanceKm: Math.round(
      haversineDistanceKm(vesselStart[0], vesselStart[1], last[0], last[1]),
    ),
    feasible: false,
    spillPathToIntercept: driftPath,
  }
}
