// PERSON 1 — Map + UI
import { OceanMap } from '@/components/OceanMap'
import { SimulationProvider } from '@/context/SimulationContext'

export default function Home() {
  return (
    <SimulationProvider>
      <OceanMap />
    </SimulationProvider>
  )
}
