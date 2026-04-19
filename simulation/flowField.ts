import type { CurrentVector, FlowField, FlowFieldMeta } from '@/types'

const SERVICE_URL =
  'https://tiledimageservices.arcgis.com/P3ePLMYs2RVChkJx/arcgis/rest/services/' +
  'Global_Ocean_Surface_Currents_from_Drifters__Monthly_Climatology_/ImageServer'

const ARCGIS_META: FlowFieldMeta = {
  latMin: -80,
  latMax: 80,
  lngMin: -180,
  lngMax: 180,
  latStep: 1,
  lngStep: 1,
  rows: 161,
  cols: 361,
}

const BATCH_SIZE = 500

let cachedField: FlowField | null = null
let cachedMeta: FlowFieldMeta | null = null
let fieldUpdateCallback: ((f: { field: FlowField; meta: FlowFieldMeta }) => void) | null = null
let arcgisFetchStarted = false

export function onLiveFieldReady(cb: typeof fieldUpdateCallback): void {
  fieldUpdateCallback = cb
}

export async function loadFlowField(): Promise<{ field: FlowField; meta: FlowFieldMeta }> {
  if (cachedField && cachedMeta) return { field: cachedField, meta: cachedMeta }

  const res = await fetch('/data/currentField.json')
  if (!res.ok) throw new Error(`Failed to load flow field: ${res.status} ${res.url}`)
  const data = await res.json()

  cachedField = data.field
  cachedMeta = data.meta

  fetchArcGISField()

  return { field: cachedField!, meta: cachedMeta! }
}

async function fetchArcGISField(): Promise<void> {
  if (arcgisFetchStarted) return
  arcgisFetchStarted = true

  try {
    const { rows, cols, latMin, lngMin, latStep, lngStep } = ARCGIS_META
    const totalPoints = rows * cols

    const field: FlowField = []
    for (let r = 0; r < rows; r++) {
      field[r] = []
      for (let c = 0; c < cols; c++) {
        field[r][c] = { u: 0, v: 0 }
      }
    }

    type GridCell = { row: number; col: number; lat: number; lng: number }
    const grid: GridCell[] = []
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        grid.push({
          row,
          col,
          lat: latMin + row * latStep,
          lng: lngMin + col * lngStep,
        })
      }
    }

    const batches = Math.ceil(totalPoints / BATCH_SIZE)

    for (let b = 0; b < batches; b++) {
      const chunk = grid.slice(b * BATCH_SIZE, (b + 1) * BATCH_SIZE)
      try {
        const body = new URLSearchParams({
          geometry: JSON.stringify({
            points: chunk.map((c) => [c.lng, c.lat]),
            spatialReference: { wkid: 4326 },
          }),
          geometryType: 'esriGeometryMultipoint',
          mosaicRule: JSON.stringify({ mosaicMethod: 'esriMosaicBlend' }),
          returnFirstValueOnly: 'true',
          interpolation: 'RSP_BilinearInterpolation',
          outFields: '*',
          f: 'json',
        })

        const res = await fetch(`${SERVICE_URL}/getSamples`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: body.toString(),
        })

        if (!res.ok) continue

        const data = await res.json() as {
          samples?: Array<{ value?: string; locationId?: number }>
          error?: { code: number; message: string }
        }

        if (data.error || !data.samples) continue

        for (const s of data.samples) {
          const idx = s.locationId ?? -1
          if (idx < 0 || idx >= chunk.length) continue
          const raw = String(s.value ?? '').trim()
          if (raw === 'NoData' || raw === '') continue
          const parts = raw.split(/\s+/)
          if (parts.length < 2) continue
          const mag = Number(parts[0])
          const dir = Number(parts[1])
          if (!isFinite(mag) || !isFinite(dir) || mag < 0 || mag > 5) continue
          const dirRad = (dir * Math.PI) / 180
          const { row, col } = chunk[idx]
          field[row][col] = {
            u: mag * Math.sin(dirRad),
            v: mag * Math.cos(dirRad),
          }
        }
      } catch {
        // skip failed batch
      }
    }

    cachedField = field
    cachedMeta = ARCGIS_META
    if (fieldUpdateCallback) fieldUpdateCallback({ field, meta: ARCGIS_META })
  } catch {
    // bail out silently
  }
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
