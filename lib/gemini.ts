import type { Bottle } from '@/types'
import type { MarineZone } from './marineZones'

const MODEL = 'gemini-2.0-flash-lite'
const API_BASE = 'https://generativelanguage.googleapis.com/v1beta/models'

/** Classify the body of water a lat/lng falls in for richer Gemini context. */
function getOceanContext(lat: number, lng: number): string {
  if (lat >= 36 && lat <= 47 && lng >= 49 && lng <= 55) {
    return 'Caspian Sea (landlocked endorheic basin — bottle cannot escape to open ocean)'
  }
  if (lat >= 43 && lat <= 47 && lng >= 28 && lng <= 41) return 'Black Sea'
  if (lat >= 30 && lat <= 47 && lng >= -6 && lng <= 37) return 'Mediterranean Sea'
  if (lat >= 12 && lat <= 30 && lng >= 32 && lng <= 44) return 'Red Sea'
  if (lat >= 22 && lat <= 30 && lng >= 48 && lng <= 60) return 'Persian Gulf'
  if (lat > 70) return 'Arctic Ocean'
  if (lat < -60) return 'Southern Ocean (Antarctic)'
  if (lat >= 20 && lat <= 66 && lng >= -180 && lng <= -100) return 'North Pacific Ocean'
  if (lat >= -60 && lat <= 20 && (lng <= -70 || lng >= 120)) return 'South Pacific Ocean'
  if (lat >= 0 && lat <= 66 && lng >= -70 && lng <= 20) return 'North Atlantic Ocean'
  if (lat >= -60 && lat <= 0 && lng >= -70 && lng <= 20) return 'South Atlantic Ocean'
  if (lat >= -60 && lat <= 30 && lng >= 20 && lng <= 120) return 'Indian Ocean'
  if (lat >= 0 && lng >= 100 && lng <= 140) return 'South China Sea / West Pacific'
  return 'Open Ocean'
}

export async function analyzeBottleImpact(
  bottle: Bottle,
  zones: MarineZone[],
  apiKey: string,
): Promise<string> {
  if (!apiKey.trim()) {
    return 'Set NEXT_PUBLIC_GEMINI_API_KEY in .env.local to enable AI analysis.'
  }

  const latStr = `${Math.abs(bottle.current_lat).toFixed(2)}°${bottle.current_lat >= 0 ? 'N' : 'S'}`
  const lngStr = `${Math.abs(bottle.current_lng).toFixed(2)}°${bottle.current_lng >= 0 ? 'E' : 'W'}`
  const originLat = `${Math.abs(bottle.start_lat).toFixed(1)}°${bottle.start_lat >= 0 ? 'N' : 'S'}`
  const originLng = `${Math.abs(bottle.start_lng).toFixed(1)}°${bottle.start_lng >= 0 ? 'E' : 'W'}`
  const ocean = getOceanContext(bottle.current_lat, bottle.current_lng)

  const zoneText =
    zones.length === 0
      ? 'None — bottle is not currently within any tracked sensitive zone.'
      : zones.map(z => `• ${z.name} [${z.severity}]: ${z.description}`).join('\n')

  const prompt = `You are a marine environmental analyst reviewing a virtual ocean drift simulation.

Bottle context:
- Current position: ${latStr}, ${lngStr}
- Ocean / body of water: ${ocean}
- Days adrift: ${Math.floor(bottle.days_drifted)}
- Origin: ${originLat}, ${originLng}
- Status: ${bottle.status.replace('_', ' ')}

Sensitive marine zones currently intersected:
${zoneText}

Write exactly 3 bullet points (• symbol), each 1–2 sentences, covering:
1. Ecosystem risks at this specific location and trajectory
2. Key species or habitats at risk (be specific to the region)
3. What the origin→current drift path reveals about ocean connectivity or debris accumulation

Rules: be specific to the region/ocean, no generic advice, total response ≤ 130 words. If bottle is in a landlocked body of water, focus on why it cannot impact open ocean ecosystems.`

  const res = await fetch(`${API_BASE}/${MODEL}:generateContent?key=${apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { maxOutputTokens: 220, temperature: 0.4 },
    }),
  })

  if (!res.ok) {
    const err = await res.text().catch(() => res.statusText)
    throw new Error(`Gemini ${res.status}: ${err}`)
  }

  const data = await res.json()
  const text: string | undefined = data?.candidates?.[0]?.content?.parts?.[0]?.text
  if (!text) throw new Error('Empty response from Gemini')
  return text.trim()
}
