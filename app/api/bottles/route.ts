/**
 * PERSON 3 — Backend + Database
 *
 * GET  /api/bottles  → return all bottles
 * POST /api/bottles  → drop a new bottle
 */

import { NextRequest, NextResponse } from 'next/server'
import { getAllBottles, createBottle } from '@/lib/supabase'

export async function GET() {
  const bottles = await getAllBottles()
  return NextResponse.json(bottles)
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { message, author_name, lat, lng } = body

  if (!message || lat == null || lng == null) {
    return NextResponse.json({ error: 'message, lat, and lng are required' }, { status: 400 })
  }

  const bottle = await createBottle({
    message,
    author_name: author_name ?? 'Anonymous',
    start_lat: lat,
    start_lng: lng,
  })

  return NextResponse.json(bottle, { status: 201 })
}
