// PERSON 1 — Map + UI
import { OceanMap } from '@/ui/OceanMap'
import { SimulationProvider } from '@/simulation/context'

export default function Home() {
  return (
    <SimulationProvider>
      <OceanMap />
    </SimulationProvider>
  )
}
