/**
 * Generates public/data/currentField.json from the ArcGIS Living Atlas
 * "Global Ocean Surface Currents from Drifters, Monthly Climatology" service.
 *
 * Replaces the synthetic gyre approximation with real measured drifter data:
 *   - 0.25° native resolution, sampled at 1° grid
 *   - 12 monthly climatology layers fetched concurrently and averaged → annual mean
 *   - Band 1: magnitude (m/s), Band 2: direction (° CW from north, toward convention)
 *
 * No extra npm packages — uses Node 18+ native fetch.
 *
 * Usage:
 *   npm run gen:field
 */

import { writeFileSync } from 'fs'
import type { FlowField, FlowFieldMeta } from '../types/index'

const SERVICE_URL =
  'https://tiledimageservices.arcgis.com/P3ePLMYs2RVChkJx/arcgis/rest/services/' +
  'Global_Ocean_Surface_Currents_from_Drifters__Monthly_Climatology_/ImageServer'

const meta: FlowFieldMeta = {
  latMin: -80,
  latMax:  80,
  lngMin: -180,
  lngMax:  180,
  latStep:  1,
  lngStep:  1,
  rows: 161,
  cols: 361,
}

// ISO timestamps for the 12 monthly climatology layers (from multiDimensionalInfo)
const MONTH_TIMESTAMPS = [
  '1979-01-16T00:00:00Z',
  '1981-02-16T00:00:00Z',
  '1983-03-18T00:00:00Z',
  '1985-04-18T00:00:00Z',
  '1987-05-18T00:00:00Z',
  '1989-06-18T00:00:00Z',
  '1991-07-18T00:00:00Z',
  '1993-08-18T00:00:00Z',
  '1995-09-18T00:00:00Z',
  '1997-10-18T00:00:00Z',
  '1999-11-18T00:00:00Z',
  '2001-12-18T00:00:00Z',
]

const BATCH_SIZE = 500   // points per getSamples POST
const BATCH_DELAY_MS = 50 // polite pause between batches

interface SamplePoint {
  mag: number
  dir: number
}

async function fetchSamples(
  points: Array<[number, number]>,  // [lat, lng]
  monthISO: string,
): Promise<Array<SamplePoint | null>> {
  const epochMs = new Date(monthISO).getTime()

  const body = new URLSearchParams({
    geometry: JSON.stringify({
      points: points.map(([lat, lng]) => [lng, lat]),  // ArcGIS: [x=lng, y=lat]
      spatialReference: { wkid: 4326 },
    }),
    geometryType: 'esriGeometryMultipoint',
    mosaicRule: JSON.stringify({
      multidimensionalDefinition: [{
        variableName: 'Vector-MagDir',
        dimensionName: 'StdTime',
        values: [epochMs],
        isSlice: true,
      }],
    }),
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

  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  const data = await res.json() as {
    samples?: Array<{ value?: string; locationId?: number }>
    error?: { code: number; message: string }
  }
  if (data.error) throw new Error(`${data.error.code}: ${data.error.message}`)

  return (data.samples ?? []).map((s) => {
    const raw = String(s.value ?? '').trim()
    if (raw === 'NoData' || raw === '') return null
    const parts = raw.split(/\s+/)
    if (parts.length < 2) return null
    const mag = Number(parts[0])
    const dir = Number(parts[1])
    if (!isFinite(mag) || !isFinite(dir) || mag < 0 || mag > 5) return null
    return { mag, dir }
  })
}

async function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

async function main() {
  const totalPoints = meta.rows * meta.cols
  const batches = Math.ceil(totalPoints / BATCH_SIZE)

  console.log('ArcGIS Drifter Currents → currentField.json')
  console.log(`Grid: ${meta.cols}×${meta.rows} = ${totalPoints} points  |  ${batches} batches of ${BATCH_SIZE}`)
  console.log(`Months: ${MONTH_TIMESTAMPS.length} (fetched concurrently per batch, then averaged)\n`)

  // Build flat grid list
  type Cell = { row: number; col: number; lat: number; lng: number }
  const grid: Cell[] = []
  for (let row = 0; row < meta.rows; row++) {
    for (let col = 0; col < meta.cols; col++) {
      grid.push({
        row, col,
        lat: meta.latMin + row * meta.latStep,
        lng: meta.lngMin + col * meta.lngStep,
      })
    }
  }

  // Accumulators for averaging across the 12 months
  const uSum   = new Float64Array(totalPoints)
  const vSum   = new Float64Array(totalPoints)
  const nValid = new Uint8Array(totalPoints)

  let totalFilled = 0

  for (let b = 0; b < batches; b++) {
    const chunk  = grid.slice(b * BATCH_SIZE, (b + 1) * BATCH_SIZE)
    const points = chunk.map((c): [number, number] => [c.lat, c.lng])

    process.stdout.write(`  [${String(b + 1).padStart(3)}/${batches}] `)

    // Fetch all 12 months concurrently; don't let one failure abort the batch
    const monthResults = await Promise.allSettled(
      MONTH_TIMESTAMPS.map((ts) => fetchSamples(points, ts)),
    )

    let failures = 0
    let batchFilled = 0

    for (let i = 0; i < chunk.length; i++) {
      const { row, col } = chunk[i]
      const idx = row * meta.cols + col

      for (const result of monthResults) {
        if (result.status === 'rejected') { failures++; continue }
        const s = result.value[i]
        if (!s) continue

        // Direction: degrees clockwise from north, oceanographic "toward" convention
        // u (eastward)  = mag × sin(dir)
        // v (northward) = mag × cos(dir)
        const dirRad = (s.dir * Math.PI) / 180
        uSum[idx] += s.mag * Math.sin(dirRad)
        vSum[idx] += s.mag * Math.cos(dirRad)
        nValid[idx]++
      }

      if (nValid[idx] > 0) batchFilled++
    }

    totalFilled += batchFilled
    const pct = ((b + 1) / batches * 100).toFixed(1)
    const failNote = failures > 0 ? `  (${failures} month-fetches failed)` : ''
    console.log(`${pct}%  ${batchFilled}/${chunk.length} filled${failNote}`)

    if (b < batches - 1) await sleep(BATCH_DELAY_MS)
  }

  // Build the final grid by dividing accumulators by valid month count
  const field: FlowField = []
  for (let row = 0; row < meta.rows; row++) {
    field[row] = []
    for (let col = 0; col < meta.cols; col++) {
      const idx = row * meta.cols + col
      const n   = nValid[idx]
      field[row][col] = n > 0
        ? { u: uSum[idx] / n, v: vSum[idx] / n }
        : { u: 0, v: 0 }
    }
  }

  writeFileSync('public/data/currentField.json', JSON.stringify({ meta, field }, null, 0))

  const coverage = (totalFilled / totalPoints * 100).toFixed(1)
  console.log(`\n✓  Wrote public/data/currentField.json`)
  console.log(`   ${totalFilled}/${totalPoints} cells (${coverage}%) have measured current data`)
  console.log(`   Land/polar cells default to { u:0, v:0 } — matches existing sampleFlowField behaviour`)
  console.log(`   Source: NOAA GDP drifter climatology via ArcGIS Living Atlas (annual mean, 12 months)`)
}

main().catch((e) => {
  console.error('\n✗  Failed:', e)
  process.exit(1)
})
