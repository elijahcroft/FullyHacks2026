import type { CurrentVector, FlowField, FlowFieldMeta } from '@/types'

export const FLOW_FIELD_META: FlowFieldMeta = {
  latMin: -80, latMax: 80,
  lngMin: -180, lngMax: 180,
  latStep: 1, lngStep: 1,
  rows: 161, cols: 361,
}

let cachedField: FlowField | null = null

export async function loadFlowField(): Promise<{ field: FlowField; meta: FlowFieldMeta }> {
  if (cachedField) return { field: cachedField, meta: FLOW_FIELD_META }
  const res = await fetch('/data/currentField.json')
  if (!res.ok) throw new Error(`Failed to load flow field: ${res.status}`)
  const data = await res.json() as { field: FlowField }
  cachedField = data.field
  return { field: cachedField, meta: FLOW_FIELD_META }
}

export function getFieldForMonth(_month: number): FlowField | null {
  return cachedField
}

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

  const row = (lat - latMin) / latStep
  const col = (lng - lngMin) / lngStep

  const r0 = Math.floor(row)
  const c0 = Math.floor(col)
  const r1 = Math.min(r0 + 1, meta.rows - 1)
  const c1 = Math.min(c0 + 1, meta.cols - 1)

  const dr = row - r0
  const dc = col - c0

  const interp = (key: keyof CurrentVector) =>
    field[r0][c0][key] * (1 - dr) * (1 - dc) +
    field[r1][c0][key] * dr * (1 - dc) +
    field[r0][c1][key] * (1 - dr) * dc +
    field[r1][c1][key] * dr * dc

  return { u: interp('u'), v: interp('v') }
}
