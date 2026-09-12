export type LookPalette = {
  sand: string
  paper: string
  ink: string
  muted: string
  pine: string
}

/** Long-hour palettes: no pure white/black, no neon, warm bias for night looks. */
export const LOOK_PALETTES = {
  grove: { sand: '#efe8dc', paper: '#f6f1e8', ink: '#2c261f', muted: '#5c544c', pine: '#1a6554' },
  cinema: { sand: '#16151a', paper: '#22212a', ink: '#e6dfd2', muted: '#b3aa9c', pine: '#6aa888' },
  harbor: { sand: '#e8eef2', paper: '#f4f7f9', ink: '#1c2832', muted: '#4f5d69', pine: '#1d6480' },
  atelier: { sand: '#f0ebe4', paper: '#f6f3ee', ink: '#3a3530', muted: '#6a635c', pine: '#4a4540' },
  arcade: { sand: '#f3ead6', paper: '#f8f3e6', ink: '#3a2a18', muted: '#6e5340', pine: '#2a8f5e' },
  pulse: { sand: '#14161e', paper: '#1d2030', ink: '#e4e6ef', muted: '#a8adc2', pine: '#4db89a' },
  rang: { sand: '#f6ead8', paper: '#fbf3e8', ink: '#3d1e14', muted: '#7a4e38', pine: '#c46d24' },
} as const satisfies Record<string, LookPalette>

export function hexToRgb(hex: string) {
  const value = hex.replace('#', '')
  return {
    r: Number.parseInt(value.slice(0, 2), 16),
    g: Number.parseInt(value.slice(2, 4), 16),
    b: Number.parseInt(value.slice(4, 6), 16),
  }
}

function channel(n: number) {
  const c = n / 255
  return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4
}

export function luminance(hex: string) {
  const { r, g, b } = hexToRgb(hex)
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b)
}

export function contrastRatio(a: string, b: string) {
  const light = Math.max(luminance(a), luminance(b))
  const dark = Math.min(luminance(a), luminance(b))
  return (light + 0.05) / (dark + 0.05)
}

export function isLongHourSafe(hex: string) {
  const n = hex.toLowerCase()
  return n !== '#ffffff' && n !== '#fff' && n !== '#000000' && n !== '#000'
}
