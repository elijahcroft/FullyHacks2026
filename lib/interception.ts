import { haversineDistanceKm, simulateSpillDrift, findInterceptionPoint } from '@/lib/spillInterception'
import { INCIDENT_CONFIGS } from '@/types'
import type { Bottle, FlowField, FlowFieldMeta } from '@/types'

export const RESPONSE_BASES = [
  { id: 'uscg-honolulu',  name: 'USCG Honolulu',       lat: 21.31,  lng: -157.87, country: 'US' },
  { id: 'uscg-sf',        name: 'USCG San Francisco',  lat: 37.81,  lng: -122.48, country: 'US' },
  { id: 'uscg-seattle',   name: 'USCG District 13',    lat: 47.60,  lng: -122.34, country: 'US' },
  { id: 'uscg-miami',     name: 'USCG Miami',          lat: 25.77,  lng: -80.19,  country: 'US' },
  { id: 'uscg-ny',        name: 'USCG New York',       lat: 40.61,  lng: -74.05,  country: 'US' },
  { id: 'jmsdf-yoko',     name: 'JMSDF Yokosuka',      lat: 35.29,  lng: 139.67,  country: 'JP' },
  { id: 'sg-mpa',         name: 'Singapore MPA',       lat: 1.26,   lng: 103.82,  country: 'SG' },
  { id: 'ran-darwin',     name: 'RAN Darwin',           lat: -12.46, lng: 130.84,  country: 'AU' },
  { id: 'ccg-victoria',   name: 'CCG Victoria BC',     lat: 48.43,  lng: -123.37, country: 'CA' },
  { id: 'eu-vigo',        name: 'MRCC Finisterre',     lat: 42.24,  lng: -8.71,   country: 'ES' },
  { id: 'imo-cape',       name: 'SA MRCC Cape Town',   lat: -33.90, lng: 18.42,   country: 'ZA' },
] as const

export type ResponseBase = (typeof RESPONSE_BASES)[number]

export const FLEET_PRESETS = [
  { id: 'emergency',  label: 'Emergency',    icon: '⚡', description: 'Fast patrol, ~25 kn', speedKmDay: 1110 },
  { id: 'coastguard', label: 'Coast Guard',  icon: '🚢', description: 'Offshore cutter, ~18 kn', speedKmDay: 800  },
  { id: 'research',   label: 'Research',     icon: '🔬', description: 'Research vessel, ~12 kn', speedKmDay: 533  },
  { id: 'cargo',      label: 'Cargo Ship',   icon: '🏗',  description: 'Diverted freighter, ~8 kn', speedKmDay: 355 },
] as const

export type FleetPreset = typeof FLEET_PRESETS[number]

export interface IncidentInterception {
  /** Predicted positions [lat,lng] at days 0,1,…,N from current position */
  futurePath: [number, number][]
  /** Interception point [lat,lng] */
  point: [number, number]
  /** Simulated days until intercept (from now) */
  daysToIntercept: number
  /** Calendar date of interception */
  interceptDate: Date
  /** km the vessel must travel */
  vesselDistanceKm: number
  /** Nearest response base used */
  base: ResponseBase
  /** km from base to incident */
  baseDistanceKm: number
  /** Whether interception is feasible within the 90-day window */
  feasible: boolean
  /** Path of vessel from base to interception point (straight line pair) */
  vesselPath: [number, number][]
  /** Fleet preset used */
  fleet: FleetPreset
}

export function findNearestBase(lat: number, lng: number): ResponseBase {
  let nearest: ResponseBase = RESPONSE_BASES[0]
  let minDist = Infinity
  for (const base of RESPONSE_BASES) {
    const d = haversineDistanceKm(lat, lng, base.lat, base.lng)
    if (d < minDist) { minDist = d; nearest = base }
  }
  return nearest
}

export function computeIncidentInterception(
  bottle: Bottle,
  fleet: FleetPreset,
  field: FlowField,
  meta: FlowFieldMeta,
  simDays = 90,
): IncidentInterception {
  const cfg = INCIDENT_CONFIGS[bottle.incidentType ?? 'plastic']

  // Simulate future drift from current position, applying incident drift scale
  const rawPath = simulateSpillDrift(
    bottle.current_lat, bottle.current_lng,
    field, meta, simDays,
  )
  // Apply per-incident drift scale to each step
  const futurePath = applyDriftScale(
    bottle.current_lat, bottle.current_lng,
    rawPath, cfg.driftScale,
  )

  const base = findNearestBase(bottle.current_lat, bottle.current_lng)
  const baseDistanceKm = Math.round(
    haversineDistanceKm(bottle.current_lat, bottle.current_lng, base.lat, base.lng),
  )

  const result = findInterceptionPoint(futurePath, [base.lat, base.lng], fleet.speedKmDay)

  const interceptDate = new Date(Date.now() + result.daysToIntercept * 86_400_000)

  return {
    futurePath,
    point: result.interceptionPoint,
    daysToIntercept: result.daysToIntercept,
    interceptDate,
    vesselDistanceKm: result.vesselDistanceKm,
    base,
    baseDistanceKm,
    feasible: result.feasible,
    vesselPath: [[base.lat, base.lng], result.interceptionPoint],
    fleet,
  }
}

/** Scale drift steps so the total displacement matches driftScale×original */
function applyDriftScale(
  startLat: number, startLng: number,
  rawPath: [number, number][],
  scale: number,
): [number, number][] {
  if (rawPath.length === 0) return [[startLat, startLng]]
  return rawPath.map(([lat, lng]) => {
    const dLat = (lat - startLat) * scale
    const dLng = (lng - startLng) * scale
    return [startLat + dLat, startLng + dLng] as [number, number]
  })
}
