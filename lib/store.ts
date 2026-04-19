/**
 * Local bottle storage backed by localStorage.
 * No server, no DB — everything lives in the browser.
 */

import type { Bottle } from '@/types'

const KEY = 'dab_bottles'

export function loadBottles(): Bottle[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(KEY)
    return raw ? (JSON.parse(raw) as Bottle[]) : []
  } catch {
    return []
  }
}

export function saveBottles(bottles: Bottle[]): void {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(KEY, JSON.stringify(bottles))
  } catch (e) {
    console.warn('saveBottles: localStorage quota exceeded — paths may be too long', e)
  }
}

export function clearBottles(): void {
  if (typeof window === 'undefined') return
  localStorage.removeItem(KEY)
}
