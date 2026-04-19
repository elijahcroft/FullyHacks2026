// Shared types — everyone imports from here

export type BottleStatus = 'drifting' | 'garbage_patch' | 'ashore'

export interface Bottle {
  id: string
  message: string
  author_name: string
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
