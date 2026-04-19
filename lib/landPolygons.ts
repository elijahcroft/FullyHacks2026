/**
 * Simplified continent polygons for coastline collision detection.
 * Each polygon is [[lat, lng], ...] pairs — no antimeridian crossings.
 * Ray casting works on a flat plane at this resolution (~1° accuracy ≈ 111 km).
 */

const LAND_POLYGONS: Array<[number, number][]> = [
  // North America
  [
    [71,-138],[71,-95],[68,-62],[47,-53],[44,-66],[25,-80],
    [10,-83],[8,-77],[12,-72],[15,-62],[20,-87],[22,-80],
    [25,-98],[30,-117],[49,-124],[60,-137],[60,-147],[62,-165],[68,-168],[71,-138],
  ],
  // South America
  [
    [-5,-80],[12,-72],[12,-61],[5,-51],[0,-50],[-5,-35],
    [-33,-53],[-55,-68],[-56,-67],[-40,-62],[-23,-44],[-10,-36],[-5,-80],
  ],
  // Greenland
  [[60,-45],[70,-22],[76,-18],[83,-30],[83,-50],[76,-65],[65,-55],[60,-45]],
  // Europe (mainland, rough)
  [[36,-10],[36,36],[45,42],[52,38],[60,28],[65,25],[62,5],[55,-5],[50,-5],[36,-5],[36,-10]],
  // Scandinavia
  [[55,5],[58,5],[65,14],[72,28],[70,32],[65,28],[58,5],[55,5]],
  // Africa
  [[38,-5],[38,36],[22,44],[12,51],[0,42],[-12,44],[-35,18],[-35,-18],[28,-18],[38,-5]],
  // Asia (main body, very simplified — Eurasia east of Europe)
  [[70,26],[72,75],[65,142],[43,145],[25,122],[5,100],[8,78],[22,60],[25,55],[37,42],[68,30],[70,26]],
  // Indian subcontinent
  [[28,68],[28,82],[8,76],[8,80],[22,88],[28,90],[28,68]],
  // Indochina peninsula
  [[22,98],[22,108],[5,103],[1,104],[5,100],[10,98],[22,98]],
  // Australia
  [[-22,114],[-22,154],[-38,148],[-40,148],[-38,140],[-35,115],[-22,114]],
]

function pointInPolygon(lat: number, lng: number, poly: [number, number][]): boolean {
  let inside = false
  const n = poly.length
  for (let i = 0, j = n - 1; i < n; j = i++) {
    const [yi, xi] = poly[i]
    const [yj, xj] = poly[j]
    if ((yi > lat) !== (yj > lat) && lng < ((xj - xi) * (lat - yi)) / (yj - yi) + xi) {
      inside = !inside
    }
  }
  return inside
}

export function isOnLand(lat: number, lng: number): boolean {
  if (lat < -70) return true // Antarctica
  return LAND_POLYGONS.some((poly) => pointInPolygon(lat, lng, poly))
}
