const FULL_WORLD_DEGREES = 360
const HALF_WORLD_DEGREES = FULL_WORLD_DEGREES / 2

export function normalizeLongitude(lng: number) {
  return ((lng + HALF_WORLD_DEGREES) % FULL_WORLD_DEGREES + FULL_WORLD_DEGREES) % FULL_WORLD_DEGREES - HALF_WORLD_DEGREES
}

export function wrapLongitudeNear(lng: number, referenceLng: number) {
  let wrapped = normalizeLongitude(lng)

  while (wrapped - referenceLng > HALF_WORLD_DEGREES) wrapped -= FULL_WORLD_DEGREES
  while (wrapped - referenceLng < -HALF_WORLD_DEGREES) wrapped += FULL_WORLD_DEGREES

  return wrapped
}

export function unwrapPathFromEnd(path: [number, number][], endReferenceLng: number): [number, number][] {
  if (path.length === 0) return []

  const unwrapped = new Array<[number, number]>(path.length)
  let referenceLng = endReferenceLng

  for (let i = path.length - 1; i >= 0; i--) {
    const [lat, lng] = path[i]
    const unwrappedLng = wrapLongitudeNear(lng, referenceLng)
    unwrapped[i] = [lat, unwrappedLng]
    referenceLng = unwrappedLng
  }

  return unwrapped
}
