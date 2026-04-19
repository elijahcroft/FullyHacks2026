export type OverlayType =
  | 'turtle-nesting'
  | 'coral-reef'
  | 'whale-migration'
  | 'fishing-ground'
  | 'marine-protected'
  | 'coastline'

export interface MarineZone {
  id: string
  type: OverlayType
  name: string
  description: string
  severity: 'low' | 'medium' | 'high' | 'critical'
  /** [south, west, north, east] in decimal degrees */
  bounds: [number, number, number, number]
  color: string
}

export const MARINE_ZONES: MarineZone[] = [
  // ── Sea Turtle Nesting Grounds ──────────────────────────────────────
  {
    id: 'turtle-caribbean',
    type: 'turtle-nesting',
    name: 'Florida / Caribbean Turtle Nesting',
    description: 'Critical nesting grounds for loggerhead, green, and leatherback sea turtles. Peak season May–October.',
    severity: 'high',
    bounds: [24, -82, 31, -66],
    color: '#22c55e',
  },
  {
    id: 'turtle-costarica',
    type: 'turtle-nesting',
    name: 'Tortuguero / Costa Rica Nesting Beaches',
    description: "One of the world's most important green turtle nesting sites. Peak season July–October.",
    severity: 'critical',
    bounds: [8, -86, 12, -80],
    color: '#22c55e',
  },
  {
    id: 'turtle-gbr',
    type: 'turtle-nesting',
    name: 'Great Barrier Reef Turtle Grounds',
    description: 'Major green and loggerhead turtle nesting and foraging area within the reef system.',
    severity: 'high',
    bounds: [-24, 145, -10, 155],
    color: '#22c55e',
  },
  {
    id: 'turtle-oman',
    type: 'turtle-nesting',
    name: 'Oman / Arabian Sea Nesting Coast',
    description: 'Vital loggerhead nesting beaches along the Oman and Indian coastlines.',
    severity: 'medium',
    bounds: [19, 55, 25, 62],
    color: '#22c55e',
  },
  {
    id: 'turtle-indonesia',
    type: 'turtle-nesting',
    name: 'Indonesian Leatherback Nesting Sites',
    description: 'Critical leatherback nesting beaches on Irian Jaya coast — among the last large leatherback rookeries.',
    severity: 'critical',
    bounds: [-5, 130, 2, 140],
    color: '#22c55e',
  },

  // ── Coral Reef Zones ─────────────────────────────────────────────────
  {
    id: 'coral-gbr',
    type: 'coral-reef',
    name: 'Great Barrier Reef',
    description: "World's largest coral reef system. Extremely sensitive to water quality and temperature changes.",
    severity: 'critical',
    bounds: [-25, 142, -10, 155],
    color: '#ec4899',
  },
  {
    id: 'coral-triangle',
    type: 'coral-reef',
    name: 'Coral Triangle',
    description: 'Global center of marine biodiversity spanning Indonesia, Philippines, and Papua New Guinea.',
    severity: 'critical',
    bounds: [-10, 110, 15, 150],
    color: '#ec4899',
  },
  {
    id: 'coral-caribbean',
    type: 'coral-reef',
    name: 'Caribbean Reef System',
    description: 'Second-largest coral reef ecosystem including Florida Keys, Bahamas, and Mesoamerican Barrier Reef.',
    severity: 'high',
    bounds: [10, -85, 25, -65],
    color: '#ec4899',
  },
  {
    id: 'coral-redsea',
    type: 'coral-reef',
    name: 'Red Sea Coral Reefs',
    description: "Among the world's most thermally resilient reef systems, hosting over 1,000 fish species.",
    severity: 'high',
    bounds: [12, 32, 27, 44],
    color: '#ec4899',
  },
  {
    id: 'coral-maldives',
    type: 'coral-reef',
    name: 'Maldives / Indian Ocean Atolls',
    description: 'Unique atoll reef systems at severe risk from sea-level rise and warming ocean temperatures.',
    severity: 'critical',
    bounds: [-5, 72, 8, 74],
    color: '#ec4899',
  },

  // ── Whale Migration Corridors ─────────────────────────────────────────
  {
    id: 'whale-npacific',
    type: 'whale-migration',
    name: 'North Pacific Humpback Corridor',
    description: 'Major humpback whale migration route between Hawaiian wintering grounds and Alaskan feeding areas. Active March–November.',
    severity: 'medium',
    bounds: [20, -165, 62, -130],
    color: '#3b82f6',
  },
  {
    id: 'whale-natlantic',
    type: 'whale-migration',
    name: 'North Atlantic Humpback Corridor',
    description: 'Key humpback migration path from Caribbean breeding grounds to North Atlantic feeding areas. Active April–October.',
    severity: 'medium',
    bounds: [10, -70, 65, -15],
    color: '#3b82f6',
  },
  {
    id: 'whale-southern-atlantic',
    type: 'whale-migration',
    name: 'Southern Ocean Blue Whale Zone (Atlantic)',
    description: 'Critical Antarctic krill feeding grounds and blue whale territory in the Southern Ocean.',
    severity: 'high',
    bounds: [-65, -60, -35, 30],
    color: '#3b82f6',
  },
  {
    id: 'whale-southern-pacific',
    type: 'whale-migration',
    name: 'Southern Ocean Blue Whale Zone (Pacific)',
    description: 'High-density blue whale feeding zone in the Pacific sector of the Southern Ocean.',
    severity: 'high',
    bounds: [-65, 150, -35, 180],
    color: '#3b82f6',
  },
  {
    id: 'whale-wpacific',
    type: 'whale-migration',
    name: 'West Pacific Sperm & Blue Whale Range',
    description: 'Active sperm and pygmy blue whale territory through tropical and subtropical West Pacific.',
    severity: 'low',
    bounds: [-10, 115, 25, 165],
    color: '#3b82f6',
  },

  // ── Commercial Fishing Grounds ────────────────────────────────────────
  {
    id: 'fishing-bering-west',
    type: 'fishing-ground',
    name: 'Bering Sea Fisheries (Western)',
    description: "One of the world's most productive fishing grounds. Pollock, salmon, halibut, and crab.",
    severity: 'medium',
    bounds: [50, 155, 66, 180],
    color: '#eab308',
  },
  {
    id: 'fishing-bering-east',
    type: 'fishing-ground',
    name: 'Bering Sea Fisheries (Eastern / Alaskan)',
    description: 'Eastern Bering Sea and Gulf of Alaska — major pollock and salmon trawl fisheries.',
    severity: 'medium',
    bounds: [50, -180, 66, -155],
    color: '#eab308',
  },
  {
    id: 'fishing-northsea',
    type: 'fishing-ground',
    name: 'North Sea Fishing Grounds',
    description: 'Historically the world\'s most intensively fished sea. Cod, herring, mackerel, and flatfish.',
    severity: 'medium',
    bounds: [50, -2, 62, 10],
    color: '#eab308',
  },
  {
    id: 'fishing-grandbanks',
    type: 'fishing-ground',
    name: 'Grand Banks (Newfoundland)',
    description: 'Historic Atlantic cod and groundfish fishery — significantly depleted by overfishing.',
    severity: 'low',
    bounds: [42, -56, 48, -46],
    color: '#eab308',
  },
  {
    id: 'fishing-eastchina',
    type: 'fishing-ground',
    name: 'East China / Yellow Sea Fisheries',
    description: 'High-intensity trawling zone. Significant bycatch, ghost gear, and debris risk.',
    severity: 'high',
    bounds: [25, 120, 40, 132],
    color: '#eab308',
  },
  {
    id: 'fishing-humboldt',
    type: 'fishing-ground',
    name: 'Humboldt Current Fisheries',
    description: "World's largest single-species fishery by volume. Anchovy and jack mackerel.",
    severity: 'medium',
    bounds: [-40, -85, -5, -70],
    color: '#eab308',
  },

  // ── Marine Protected Areas ────────────────────────────────────────────
  {
    id: 'mpa-papahanaumokuakea',
    type: 'marine-protected',
    name: 'Papahānaumokuākea Marine National Monument',
    description: "One of the world's largest marine protected areas. Northwestern Hawaiian Islands chain.",
    severity: 'critical',
    bounds: [23, -180, 29, -162],
    color: '#8b5cf6',
  },
  {
    id: 'mpa-chagos',
    type: 'marine-protected',
    name: 'Chagos / BIOT Marine Reserve',
    description: 'Largest fully protected marine reserve in the Indian Ocean.',
    severity: 'critical',
    bounds: [-8, 70, 0, 75],
    color: '#8b5cf6',
  },
  {
    id: 'mpa-pacific-remote',
    type: 'marine-protected',
    name: 'Pacific Remote Islands National Monument',
    description: 'Remote US Pacific territories including Palmyra, Howland, Baker, and Jarvis islands with strict no-take protection.',
    severity: 'high',
    bounds: [-5, 160, 10, 175],
    color: '#8b5cf6',
  },
  {
    id: 'mpa-gbr-park',
    type: 'marine-protected',
    name: 'Great Barrier Reef Marine Park',
    description: 'UNESCO World Heritage marine park with strict zone management across 344,000 km².',
    severity: 'high',
    bounds: [-24, 142, -10, 154],
    color: '#8b5cf6',
  },
  {
    id: 'mpa-galapagos',
    type: 'marine-protected',
    name: 'Galápagos Marine Reserve',
    description: 'UNESCO World Heritage site with unique endemic species and strict marine protection.',
    severity: 'critical',
    bounds: [-2, -93, 2, -88],
    color: '#8b5cf6',
  },

  // ── Populated Coastlines / Tourist Beaches ────────────────────────────
  {
    id: 'coast-useast',
    type: 'coastline',
    name: 'US East Coast (Florida to New England)',
    description: 'High-density population centers and major tourist beaches. Debris reaches these shores quickly via Gulf Stream.',
    severity: 'high',
    bounds: [25, -82, 45, -70],
    color: '#f87171',
  },
  {
    id: 'coast-mediterranean',
    type: 'coastline',
    name: 'Mediterranean Tourist Coastlines',
    description: 'Densely populated tourist beaches from Spain to Turkey. Enclosed sea — debris accumulates rapidly.',
    severity: 'high',
    bounds: [30, -6, 46, 37],
    color: '#f87171',
  },
  {
    id: 'coast-seasia',
    type: 'coastline',
    name: 'SE Asia Resort Coasts (Bali, Thailand, Vietnam)',
    description: 'Major tourism destinations and fishing communities. Debris directly impacts livelihoods and ecosystems.',
    severity: 'high',
    bounds: [-10, 98, 15, 115],
    color: '#f87171',
  },
  {
    id: 'coast-gulf',
    type: 'coastline',
    name: 'Gulf of Mexico Coastlines',
    description: 'Tourism, fishing communities, and sensitive wetland ecosystems across the Gulf.',
    severity: 'medium',
    bounds: [18, -98, 30, -80],
    color: '#f87171',
  },
  {
    id: 'coast-australia-east',
    type: 'coastline',
    name: 'Australian East Coast (Gold Coast to Cairns)',
    description: "Major tourism corridor. Proximity to Great Barrier Reef amplifies debris impact on marine life.",
    severity: 'high',
    bounds: [-27, 152, -16, 157],
    color: '#f87171',
  },
]

/** Returns all zones whose bounding box contains the given lat/lng. */
export function getZonesAtPosition(lat: number, lng: number): MarineZone[] {
  return MARINE_ZONES.filter(({ bounds: [south, west, north, east] }) =>
    lat >= south && lat <= north && lng >= west && lng <= east
  )
}

export function getZonesByType(type: OverlayType): MarineZone[] {
  return MARINE_ZONES.filter(z => z.type === type)
}

export const OVERLAY_CONFIGS: Array<{ type: OverlayType; label: string; color: string }> = [
  { type: 'turtle-nesting',  label: 'Sea Turtle Nesting',    color: '#22c55e' },
  { type: 'coral-reef',      label: 'Coral Reef Zones',       color: '#ec4899' },
  { type: 'whale-migration', label: 'Whale Migration',        color: '#3b82f6' },
  { type: 'fishing-ground',  label: 'Fishing Grounds',        color: '#eab308' },
  { type: 'marine-protected',label: 'Marine Protected Areas', color: '#8b5cf6' },
  { type: 'coastline',       label: 'Populated Coastlines',   color: '#f87171' },
]
