/**
 * Generates public/data/currentField.json from ArcGIS annual_drifter_mean_v3.
 *
 * Fetches 18 LERC2D tiles that cover the globe at level 2 (0.25°/pixel),
 * decodes the raw F64 magnitude+direction values, then samples the decoded
 * data at our 1° grid. No authentication, no getSamples — just public tiles.
 *
 * Usage:
 *   npm run gen:field
 */

import { writeFileSync } from 'fs'
import Lerc from 'lerc'
import type { FlowField, FlowFieldMeta } from '../types/index'

const SERVICE =
  'https://tiledimageservices.arcgis.com/P3ePLMYs2RVChkJx/arcgis/rest/services/' +
  'annual_drifter_mean_v3/ImageServer'

// Level 2: 0.25° per pixel, 256×256 pixels per tile
const LEVEL      = 2
const PIXEL_SIZE = 0.25
const TILE_PX    = 256
const ORIGIN_LNG = -180   // tile grid top-left
const ORIGIN_LAT =   85

// 6 cols × 3 rows = 18 tiles cover -180→204°lng, 85→-107°lat
// (service valid extent is -180→180lng, -73→85lat — edge tiles have NoData outside)
const N_COLS = 6
const N_ROWS = 3

const meta: FlowFieldMeta = {
  latMin: -80, latMax: 80,
  lngMin: -180, lngMax: 180,
  latStep: 1, lngStep: 1,
  rows: 161, cols: 361,
}

interface TilePixels {
  mag: Float64Array
  dir: Float64Array
  width: number
  height: number
}

async function fetchTile(row: number, col: number): Promise<TilePixels | null> {
  try {
    const res = await fetch(`${SERVICE}/tile/${LEVEL}/${row}/${col}`)
    if (!res.ok) { console.warn(`  tile ${row}/${col}: HTTP ${res.status}`); return null }
    const buf = await res.arrayBuffer()
    const decoded = Lerc.decode(new Uint8Array(buf).buffer)
    return {
      mag:    decoded.pixels[0] as Float64Array,
      dir:    decoded.pixels[1] as Float64Array,
      width:  decoded.width,
      height: decoded.height,
    }
  } catch (e) {
    console.warn(`  tile ${row}/${col} failed: ${e}`)
    return null
  }
}

async function main() {
  console.log(`Fetching ${N_ROWS * N_COLS} LERC2D tiles (level ${LEVEL}, ${PIXEL_SIZE}°/px)...`)

  // Fetch all 18 tiles concurrently
  const tileFetches = Array.from({ length: N_ROWS }, (_, r) =>
    Array.from({ length: N_COLS }, (_, c) => fetchTile(r, c))
  )
  const tiles: (TilePixels | null)[][] = await Promise.all(
    tileFetches.map(row => Promise.all(row))
  )
  console.log('Tiles fetched. Building 1° flow field...\n')

  const field: FlowField = []
  let filled = 0

  for (let row = 0; row < meta.rows; row++) {
    field[row] = []
    const lat = meta.latMin + row * meta.latStep

    for (let col = 0; col < meta.cols; col++) {
      const lng = meta.lngMin + col * meta.lngStep

      // Map (lat, lng) → global pixel index (origin top-left at ORIGIN_LNG, ORIGIN_LAT)
      const gPixY = (ORIGIN_LAT - lat) / PIXEL_SIZE
      const gPixX = (lng - ORIGIN_LNG) / PIXEL_SIZE

      const tRow = Math.floor(gPixY / TILE_PX)
      const tCol = Math.floor(gPixX / TILE_PX)
      const pY   = Math.floor(gPixY) % TILE_PX
      const pX   = Math.floor(gPixX) % TILE_PX

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

      // MagDir → u/v: direction is degrees CW from north (oceanographic "toward")
      const dirRad = (dir * Math.PI) / 180
      field[row][col] = {
        u: mag * Math.sin(dirRad),
        v: mag * Math.cos(dirRad),
      }
      filled++
    }
  }

  writeFileSync('public/data/currentField.json', JSON.stringify({ meta, field }, null, 0))

  const total = meta.rows * meta.cols
  console.log(`✓  Wrote public/data/currentField.json`)
  console.log(`   ${filled}/${total} cells (${(filled / total * 100).toFixed(1)}%) have current data`)
  console.log(`   Source: ArcGIS annual_drifter_mean_v3 (annual mean drifters, LERC2D)`)
}

main().catch(e => { console.error('✗  Failed:', e); process.exit(1) })
