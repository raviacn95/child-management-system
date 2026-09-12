import { LOOK_PALETTES } from './tokens'

export const LOOK_IDS = ['grove', 'cinema', 'harbor', 'atelier', 'arcade', 'pulse', 'rang'] as const
export type LookId = (typeof LOOK_IDS)[number]

export type LookPreview = {
  id: LookId
  name: string
  tagline: string
  bestFor: string
  swatches: [string, string, string]
}

function swatch(id: LookId): [string, string, string] {
  const palette = LOOK_PALETTES[id]
  return [palette.sand, palette.pine, palette.paper]
}

export const LOOKS: LookPreview[] = [
  {
    id: 'grove',
    name: 'Grove',
    tagline: 'Warm linen and pine — easy on the eyes for a full care day.',
    bestFor: 'Parents · phone',
    swatches: swatch('grove'),
  },
  {
    id: 'cinema',
    name: 'Cinema',
    tagline: 'Warm charcoal and gold — living-room movies without OLED glare.',
    bestFor: 'Fire Stick · TV',
    swatches: swatch('cinema'),
  },
  {
    id: 'harbor',
    name: 'Harbor',
    tagline: 'Soft studio blue — reports you can read for hours.',
    bestFor: 'Directors · Windows',
    swatches: swatch('harbor'),
  },
  {
    id: 'atelier',
    name: 'Atelier',
    tagline: 'Quiet type and warm paper — parent calm.',
    bestFor: 'Finance · reports',
    swatches: swatch('atelier'),
  },
  {
    id: 'arcade',
    name: 'Arcade',
    tagline: 'Soft amber badges — kids’ learning without neon.',
    bestFor: 'Learning packs',
    swatches: swatch('arcade'),
  },
  {
    id: 'pulse',
    name: 'Pulse',
    tagline: 'Muted teal charts — director nights without eye strain.',
    bestFor: 'Harbor nights',
    swatches: swatch('pulse'),
  },
  {
    id: 'rang',
    name: 'Rang',
    tagline: 'Soft marigold — family festivals, not firework contrast.',
    bestFor: 'Household Hub',
    swatches: swatch('rang'),
  },
]

export function isLookId(value: string | null | undefined): value is LookId {
  return LOOK_IDS.includes(value as LookId)
}

export function isDarkLook(look: LookId) {
  return look === 'cinema' || look === 'pulse'
}

/** Older light/dark/system settings become a named look. */
export function migrateLook(saved: string | null, fireTv = false): LookId {
  if (isLookId(saved)) return saved
  if (saved === 'dark') return 'cinema'
  if (saved === 'light' || saved === 'system') return 'grove'
  return fireTv ? 'cinema' : 'grove'
}

export function nextLook(current: LookId): LookId {
  const i = LOOK_IDS.indexOf(current)
  return LOOK_IDS[(i + 1) % LOOK_IDS.length]
}

export function lookLead(look: LookId) {
  if (look === 'cinema') return 'family movies'
  if (look === 'harbor' || look === 'pulse') return 'reports and ratios'
  if (look === 'arcade') return 'learning streaks'
  if (look === 'atelier') return 'parent calm and finance'
  if (look === 'rang') return 'family night and festivals'
  return 'care and learning'
}
