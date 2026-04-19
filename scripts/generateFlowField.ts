/**
 * Generates flow field JSON files from ArcGIS ocean current services.
 *
 * Outputs:
 *   public/data/currentField.json       — annual mean (fast initial fallback)
 *   public/data/currents-01.json        — January climatology
 *   ...
 *   public/data/currents-12.json        — December climatology
 *
 * Usage:
 *   npm run gen:field
 */

import { writeFileSync } from 'fs'
import { decode as lercDecode, load as lercLoad } from 'lerc'
import type { FlowField, FlowFieldMeta } from '../types/index'

const ANNUAL_SERVICE =
  'https://tiledimageservices.arcgis.com/P3ePLMYs2RVChkJx/arcgis/rest/services/' +
  'annual_drifter_mean_v3/ImageServer'

const MONTHLY_SERVICE =
  'https://tiledimageservices.arcgis.com/P3ePLMYs2RVChkJx/arcgis/rest/services/' +
  'Global_Ocean_Surface_Currents_from_Drifters__Monthly_Climatology_/ImageServer'

const LEVEL = 2
const PIXEL_SIZE = 0.25
const TILE_PX = 256
const ORIGIN_LNG = -180
const ORIGIN_LAT = 85
const N_COLS = 6
const N_ROWS = 3

const MONTH_NAMES = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']

const meta: FlowFieldMeta = {
  latMin: -80, latMax: 80,
  lngMin: -180, lngMax: 180,
  latStep: 1, lngStep: 1,
  rows: 161, cols: 361,
}

function monthTimestamp(m: number): number {
  return new Date(2001, m, 15).getTime()
}

interface TilePixels {
  mag: Float64Array | Float32Array
  dir: Float64Array | Float32Array
  width: number
  height: number
}

async function fetchTile(
  serviceUrl: string,
  row: number,
  col: number,
  time?: number,
): Promise<TilePixels | null> {
  try {
    const url = time !== undefined
      ? `${serviceUrl}/tile/${LEVEL}/${row}/${col}?time=${time}`
      : `${serviceUrl}/tile/${LEVEL}/${row}/${col}`
    const res = await fetch(url)
    if (!res.ok) { console.warn(`  tile ${row}/${col}: HTTP ${res.status}`); return null }
    const buf = await res.arrayBuffer()
    const decoded = lercDecode(buf)
    return {
      mag: decoded.pixels[0] as Float64Array,
      dir: decoded.pixels[1] as Float64Array,
      width: decoded.width,
      height: decoded.height,
    }
  } catch (e) {
    console.warn(`  tile ${row}/${col} failed: ${e}`)
    return null
  }
}

async function buildField(serviceUrl: string, time?: number): Promise<{ field: FlowField; filled: number }> {
  const tileFetches = Array.from({ length: N_ROWS }, (_, r) =>
    Array.from({ length: N_COLS }, (_, c) => fetchTile(serviceUrl, r, c, time))
  )
  const tiles: (TilePixels | null)[][] = await Promise.all(
    tileFetches.map(row => Promise.all(row))
  )

  const field: FlowField = []
  let filled = 0

  for (let row = 0; row < meta.rows; row++) {
    field[row] = []
    const lat = meta.latMin + row * meta.latStep

    for (let col = 0; col < meta.cols; col++) {
      const lng = meta.lngMin + col * meta.lngStep

      const gPixY = (ORIGIN_LAT - lat) / PIXEL_SIZE
      const gPixX = (lng - ORIGIN_LNG) / PIXEL_SIZE
      const tRow = Math.floor(gPixY / TILE_PX)
      const tCol = Math.floor(gPixX / TILE_PX)
      const pY = Math.floor(gPixY) % TILE_PX
      const pX = Math.floor(gPixX) % TILE_PX

      const tile = (tRow >= 0 && tRow < N_ROWS && tCol >= 0 && tCol < N_COLS)
        ? tiles[tRow][tCol]
        : null

      if (!tile || pX >= tile.width || pY >= tile.height) {
        field[row][col] = { u: 0, v: 0 }
        continue
      }

      const mag = tile.mag[pY * tile.width + pX]
      const dir = tile.dir[pY * tile.width + pX]

      if (!isFinite(mag) || !isFinite(dir) || mag < 0 || mag > 5) {
        field[row][col] = { u: 0, v: 0 }
        continue
      }

      const dirRad = (dir * Math.PI) / 180
      field[row][col] = {
        u: mag * Math.sin(dirRad),
        v: mag * Math.cos(dirRad),
      }
      filled++
    }
  }

  return { field, filled }
}

async function main() {
  await lercLoad()
  const total = meta.rows * meta.cols

  // Primary flow field — use the monthly climatology service (same source as the visual renderer).
  // The tile cache serves a single baked dataset regardless of time parameter, so one file covers all months.
  console.log('Generating flow field (Monthly_Climatology_)...')
  const { field, filled } = await buildField(MONTHLY_SERVICE)
  writeFileSync('public/data/currentField.json', JSON.stringify({ meta, field }, null, 0))
  console.log(`✓  ${filled}/${total} cells (${(filled/total*100).toFixed(1)}%) → public/data/currentField.json`)
}

main().catch(e => { console.error('✗  Failed:', e); process.exit(1) })
