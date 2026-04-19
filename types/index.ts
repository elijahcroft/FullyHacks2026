// Shared types — everyone imports from here

export interface SpillMarker {
  id: string
  lat: number
  lng: number
  placed_at: string
  /** Predicted positions at day 0, 1, 2, …  (index == day number, no turbulence) */
  driftPath: [number, number][]
}

export type BottleStatus = 'drifting' | 'garbage_patch' | 'ashore'

export type IncidentType = 'oil_spill' | 'plastic' | 'chemical' | 'sewage'

export interface IncidentConfig {
  label: string
  emoji: string
  description: string
  color: [number, number, number]
  urgency: 'critical' | 'high' | 'medium' | 'low'
  /** Multiplier on ocean current speed (1 = normal) */
  driftScale: number
  /** Multiplier on turbulence noise */
  turbulenceScale: number
}

export const INCIDENT_CONFIGS: Record<IncidentType, IncidentConfig> = {
  oil_spill:  { label: 'Oil Spill',          emoji: '🛢',  description: 'High toxicity — large response needed',  color: [220, 110, 15],  urgency: 'critical', driftScale: 0.5,  turbulenceScale: 0.6 },
  plastic:    { label: 'Plastic / Debris',   emoji: '🧴',  description: 'Broad area, slower urgency',             color: [80,  180, 255], urgency: 'medium',   driftScale: 1.0,  turbulenceScale: 1.0 },
  chemical:   { label: 'Chemical Discharge', emoji: '⚗️',  description: 'Rapid response, localized hazard',       color: [190, 60,  230], urgency: 'high',     driftScale: 1.3,  turbulenceScale: 1.8 },
  sewage:     { label: 'Sewage Outflow',     emoji: '💧',  description: 'Lower priority, measurable impact',      color: [60,  175, 90],  urgency: 'low',      driftScale: 0.7,  turbulenceScale: 0.8 },
}

export interface Bottle {
  id: string
  message: string
  author_name: string
  incidentType: IncidentType
  start_lat: number
  start_lng: number
  current_lat: number
  current_lng: number
  path: [number, number][]   // array of [lat, lng] waypoints
  status: BottleStatus
  dropped_at: string
  days_drifted: number
  destination: string | null
}

// A 2D vector from the flow field: u = east/west, v = north/south (m/s)
export interface CurrentVector {
  u: number
  v: number
}

export interface TickOptions {
  dtDays: number
  speedMultiplier: number
  turbulence: number
}

export interface MapController {
  flyTo: (lat: number, lng: number, zoom?: number) => void
}

// Flow field is a grid: lat index → lng index → vector
export type FlowField = CurrentVector[][]

export interface FlowFieldMeta {
  latMin: number
  latMax: number
  lngMin: number
  lngMax: number
  latStep: number
  lngStep: number
  rows: number
  cols: number
}
