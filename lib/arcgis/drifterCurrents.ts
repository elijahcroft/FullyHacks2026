import ImageryTileLayer from '@arcgis/core/layers/ImageryTileLayer.js'

export const DRIFTER_CURRENTS_SERVICE_URL =
  'https://tiledimageservices.arcgis.com/P3ePLMYs2RVChkJx/arcgis/rest/services/Global_Ocean_Surface_Currents_from_Drifters__Monthly_Climatology_/ImageServer'

export const DRIFTER_CURRENTS_PORTAL_ITEM_ID = 'e933553b03e74d15b6ccb14e6c886fef'

/**
 * Maps a simulation speed multiplier to a visual flow speed for the ArcGIS flow renderer.
 * Uses a logarithmic scale: 1× → 0.4, 10× → ~2.7, 100× → 5.0
 */
export function flowSpeedForMultiplier(multiplier: number): number {
  const t = Math.log10(Math.max(1, multiplier)) / 2
  return 0.4 + t * 4.6
}

export function buildFlowRenderer(flowSpeed: number) {
  return {
    type: 'flow' as const,
    density: 0.8,
    flowSpeed,
    maxPathLength: 80,
    trailLength: 25,
    trailWidth: '1.4px',
    visualVariables: [
      {
        type: 'color' as const,
        field: 'Magnitude',
        stops: [
          { value: 0, color: [56, 121, 255, 0.45] },
          { value: 0.2, color: [60, 196, 214, 0.7] },
          { value: 0.4, color: [123, 243, 196, 0.85] },
          { value: 0.8, color: [239, 255, 255, 0.95] },
        ],
      },
    ],
  }
}

export function createDrifterCurrentsLayer(speedMultiplier = 1) {
  return new ImageryTileLayer({
    url: DRIFTER_CURRENTS_SERVICE_URL,
    title: 'Monthly Ocean Surface Currents',
    opacity: 0.95,
    effect: 'bloom(1.3, 0.4px, 0)',
    renderer: buildFlowRenderer(flowSpeedForMultiplier(speedMultiplier)),
  })
}
