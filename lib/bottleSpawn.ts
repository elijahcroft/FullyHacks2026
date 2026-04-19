import { normalizeLongitude } from '@/lib/longitude'
import type { Bottle } from '@/types'

interface CreateBottleBatchOptions {
  lat: number
  lng: number
  count: number
  radiusKm: number
  message: string
  authorName: string
}

const KM_PER_LAT_DEGREE = 111

export function createBottleBatch({
  lat,
  lng,
  count,
  radiusKm,
  message,
  authorName,
}: CreateBottleBatchOptions): Bottle[] {
  const safeCount = clampNumber(count, { min: 1, max: 100, fallback: 1, round: 'floor' })
  const safeRadiusKm = clampNumber(radiusKm, { min: 0, max: 500, fallback: 0 })
  const trimmedMessage = message.trim()
  const trimmedAuthorName = authorName.trim() || 'Anonymous'
  const droppedAt = new Date().toISOString()

  return Array.from({ length: safeCount }, () => {
    const { lat: spawnLat, lng: spawnLng } = randomPointInRadius(lat, lng, safeRadiusKm)

    return {
      id: crypto.randomUUID(),
      message: trimmedMessage,
      author_name: trimmedAuthorName,
      start_lat: spawnLat,
      start_lng: spawnLng,
      current_lat: spawnLat,
      current_lng: spawnLng,
      path: [],
      status: 'drifting',
      dropped_at: droppedAt,
      days_drifted: 0,
      destination: null,
    }
  })
}

function randomPointInRadius(centerLat: number, centerLng: number, radiusKm: number) {
  if (radiusKm <= 0) {
    return {
      lat: clampLatitude(centerLat),
      lng: normalizeLongitude(centerLng),
    }
  }

  const angle = Math.random() * Math.PI * 2
  const distanceKm = radiusKm * Math.sqrt(Math.random())
  const northKm = Math.sin(angle) * distanceKm
  const eastKm = Math.cos(angle) * distanceKm

  const lat = clampLatitude(centerLat + northKm / KM_PER_LAT_DEGREE)
  const kmPerLngDegree = Math.max(0.1, KM_PER_LAT_DEGREE * Math.cos((lat * Math.PI) / 180))
  const lng = normalizeLongitude(centerLng + eastKm / kmPerLngDegree)

  return { lat, lng }
}

function clampLatitude(lat: number) {
  return Math.max(-80, Math.min(80, lat))
}

function clampNumber(
  value: number,
  options: { min: number; max: number; fallback: number; round?: 'floor' },
) {
  const finiteValue = Number.isFinite(value) ? value : options.fallback
  const rounded = options.round === 'floor' ? Math.floor(finiteValue) : finiteValue
  return Math.max(options.min, Math.min(options.max, rounded))
}
