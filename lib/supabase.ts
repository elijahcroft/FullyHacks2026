/**
 * PERSON 3 — Backend + Database
 *
 * Supabase client. Falls back to no-op helpers when env vars aren't set
 * so the app renders locally without a database connection.
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js'
import type { Bottle } from '@/types'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

export const supabase: SupabaseClient | null =
  supabaseUrl && supabaseAnonKey
    ? createClient(supabaseUrl, supabaseAnonKey)
    : null

// ---- Bottle helpers --------------------------------------------------------

export async function getAllBottles(): Promise<Bottle[]> {
  if (!supabase) return []
  const { data, error } = await supabase
    .from('bottles')
    .select('*')
    .order('dropped_at', { ascending: false })
  if (error) throw error
  return data as Bottle[]
}

export async function createBottle(
  params: Pick<Bottle, 'message' | 'author_name' | 'start_lat' | 'start_lng'>,
): Promise<Bottle | null> {
  if (!supabase) {
    console.warn('Supabase not configured — bottle not saved')
    return null
  }
  const { data, error } = await supabase
    .from('bottles')
    .insert({ ...params, current_lat: params.start_lat, current_lng: params.start_lng })
    .select()
    .single()
  if (error) throw error
  return data as Bottle
}

export async function updateBottle(id: string, patch: Partial<Bottle>): Promise<void> {
  if (!supabase) return
  const { error } = await supabase.from('bottles').update(patch).eq('id', id)
  if (error) throw error
}

export async function updateBottles(bottles: Bottle[]): Promise<void> {
  if (!supabase) return
  const { error } = await supabase.from('bottles').upsert(bottles)
  if (error) throw error
}
