// simulation.worker.ts - Runs simulation in background thread
import { loadFlowField, getFieldForMonth, FLOW_FIELD_META } from './flowField'
import { tickAll } from './engine'
import type { Bottle } from '@/types'

let cachedField: any = null
let bottles: Bottle[] = []
let running = false
let speedMultiplier = 1
let simDays = 0
let startDate: Date

const TICK_INTERVAL_MS = 100

async function init() {
  const { field } = await loadFlowField()
  cachedField = field
}

function tick() {
  if (!running || !cachedField) return

  simDays += speedMultiplier * 0.1
  const simDate = new Date(startDate.getTime() + simDays * 86_400_000)

  const field = getFieldForMonth(simDate.getMonth())
  if (!field) return

  const drifting = bottles.filter((b) => b.status === 'drifting')
  if (drifting.length === 0) return

  bottles = tickAll(drifting, field, FLOW_FIELD_META, {
    dtDays: speedMultiplier * 0.1,
    speedMultiplier: 1,
    turbulence: 0.05,
  })

  // Send updated bottles back to main thread
  self.postMessage({ type: 'update', bottles, simDate })
}

self.onmessage = (e) => {
  const { type, data } = e.data

  switch (type) {
    case 'init':
      startDate = new Date(data.startDate)
      simDays = 0
      init()
      break
    case 'start':
      running = true
      speedMultiplier = data.speedMultiplier
      setInterval(tick, TICK_INTERVAL_MS)
      break
    case 'stop':
      running = false
      break
    case 'updateBottles':
      bottles = data.bottles
      break
    case 'setSpeed':
      speedMultiplier = data.speedMultiplier
      break
  }
}