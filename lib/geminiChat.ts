import type { Bottle } from '@/types'

const MODEL = 'gemini-2.0-flash-lite'
const API_BASE = 'https://generativelanguage.googleapis.com/v1beta/models'

export interface ChatMessage {
  role: 'user' | 'model'
  text: string
}

function buildSystemInstruction(
  bottles: Bottle[],
  selectedBottle: Bottle | null,
  daysElapsed: number,
): string {
  const bottleLines = bottles
    .slice(0, 8)
    .map(
      b =>
        `  • "${b.author_name || 'Anonymous'}": ${Math.abs(b.current_lat).toFixed(1)}°${b.current_lat >= 0 ? 'N' : 'S'} ${Math.abs(b.current_lng).toFixed(1)}°${b.current_lng >= 0 ? 'E' : 'W'}, ${Math.floor(b.days_drifted)} days adrift, ${b.status.replace('_', ' ')}`,
    )
    .join('\n')

  const selectedInfo = selectedBottle
    ? `\nCurrently selected bottle: "${selectedBottle.author_name || 'Anonymous'}" at ${Math.abs(selectedBottle.current_lat).toFixed(2)}°${selectedBottle.current_lat >= 0 ? 'N' : 'S'} ${Math.abs(selectedBottle.current_lng).toFixed(2)}°${selectedBottle.current_lng >= 0 ? 'E' : 'W'}, ${Math.floor(selectedBottle.days_drifted)} days adrift, status: ${selectedBottle.status.replace('_', ' ')}.`
    : ''

  return `You are an ocean science assistant embedded in DropABottle, a browser-based ocean drift simulator. Users drop virtual bottles into the ocean and watch them drift using real oceanographic current data.

Current simulation state:
- Simulation days elapsed: ${Math.floor(daysElapsed)}
- Active bottles: ${bottles.length}
${bottleLines ? `Bottle positions:\n${bottleLines}` : ''}${selectedInfo}

You help users understand ocean currents, gyres, plastic pollution, marine ecosystems, and how the simulation works. Keep answers concise (2–4 sentences). Reference the user's actual bottle data when relevant.`
}

export async function sendChatMessage(
  messages: ChatMessage[],
  bottles: Bottle[],
  selectedBottle: Bottle | null,
  daysElapsed: number,
  apiKey: string,
): Promise<string> {
  if (!apiKey.trim()) {
    return 'Add NEXT_PUBLIC_GEMINI_API_KEY to .env.local to enable chat.'
  }

  const res = await fetch(`${API_BASE}/${MODEL}:generateContent?key=${apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      system_instruction: {
        parts: [{ text: buildSystemInstruction(bottles, selectedBottle, daysElapsed) }],
      },
      contents: messages.map(m => ({
        role: m.role,
        parts: [{ text: m.text }],
      })),
      generationConfig: { maxOutputTokens: 300, temperature: 0.7 },
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
