const SWATCHES = [
  { name: 'red', r: 200, g: 40, b: 40 },
  { name: 'blue', r: 40, g: 80, b: 200 },
  { name: 'green', r: 40, g: 160, b: 70 },
  { name: 'yellow', r: 230, g: 200, b: 40 },
  { name: 'purple', r: 140, g: 60, b: 180 },
  { name: 'black', r: 20, g: 20, b: 20 },
  { name: 'white', r: 245, g: 245, b: 245 },
]

export interface ArtworkRead {
  colors: string[]
  complexity: number
}

function nearest(r: number, g: number, b: number) {
  let best = SWATCHES[0]
  let bestDist = Number.POSITIVE_INFINITY
  for (const swatch of SWATCHES) {
    const dist = (r - swatch.r) ** 2 + (g - swatch.g) ** 2 + (b - swatch.b) ** 2
    if (dist < bestDist) {
      best = swatch
      bestDist = dist
    }
  }
  return best.name
}

/** `pixels` is RGB triples, row-major. Complexity is the share of neighbouring pixels that change. */
export function analyzeArtwork(pixels: number[], width: number): ArtworkRead {
  const counts = new Map<string, number>()
  let edges = 0
  let compared = 0
  const pixelsPerRow = width
  for (let index = 0; index < pixels.length; index += 3) {
    const pixel = index / 3
    const name = nearest(pixels[index] ?? 0, pixels[index + 1] ?? 0, pixels[index + 2] ?? 0)
    counts.set(name, (counts.get(name) ?? 0) + 1)
    if (pixel % pixelsPerRow === 0) continue
    const prev = index - 3
    const diff =
      Math.abs((pixels[index] ?? 0) - (pixels[prev] ?? 0)) +
      Math.abs((pixels[index + 1] ?? 0) - (pixels[prev + 1] ?? 0)) +
      Math.abs((pixels[index + 2] ?? 0) - (pixels[prev + 2] ?? 0))
    if (diff > 80) edges += 1
    compared += 1
  }
  const colors = [...counts.entries()]
    .filter(([, count]) => count > 0)
    .sort((a, b) => b[1] - a[1])
    .map(([name]) => name)
  return { colors, complexity: compared ? Number((edges / compared).toFixed(2)) : 0 }
}

export function compareArtwork(earlier: ArtworkRead, later: ArtworkRead) {
  const complexityDelta = Number((later.complexity - earlier.complexity).toFixed(2))
  return {
    complexityDelta,
    addedColors: later.colors.filter((color) => !earlier.colors.includes(color)),
    note:
      complexityDelta > 0
        ? 'The later sample has more edge changes.'
        : 'The later sample is simpler in edge changes.',
  }
}

export function flatFill(rgb: [number, number, number], width: number, height: number) {
  const pixels: number[] = []
  for (let i = 0; i < width * height; i += 1) pixels.push(...rgb)
  return pixels
}

export function splitFill(left: [number, number, number], right: [number, number, number], width: number, height: number) {
  const pixels: number[] = []
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) pixels.push(...(x < width / 2 ? left : right))
  }
  return pixels
}
