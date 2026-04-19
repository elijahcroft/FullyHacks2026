/**
 * PERSON 3 — Backend + Database
 *
 * POST /api/simulate  → advance all drifting bottles one tick
 *
 * Call this from a cron job (e.g. Vercel cron or Supabase edge function)
 * every N seconds to drive the server-side simulation.
 *
 * MVP fallback: skip this entirely and run simulation client-side via
 * hooks/useSimulation.ts — Person 2 controls that.
 */

import { NextResponse } from 'next/server'
import { getAllBottles, updateBottles } from '@/lib/supabase'
import { loadFlowField } from '@/lib/currentField'
import { tickAll } from '@/lib/simulation'

export async function POST() {
  const [bottles, { field, meta }] = await Promise.all([
    getAllBottles(),
    loadFlowField(),
  ])

  const drifting = bottles.filter((b) => b.status === 'drifting')
  if (drifting.length === 0) return NextResponse.json({ ticked: 0 })

  const updated = tickAll(drifting, field, meta, { dtDays: 1, speedMultiplier: 1 })
  await updateBottles(updated)

  return NextResponse.json({ ticked: updated.length })
}
