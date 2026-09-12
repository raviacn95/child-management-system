export const LOOK_IDS = ['grove', 'cinema', 'harbor', 'atelier', 'arcade', 'pulse', 'rang'] as const
export type LookId = (typeof LOOK_IDS)[number]

export type LookPreview = {
  id: LookId
  name: string
  tagline: string
  bestFor: string
  swatches: [string, string, string]
}

export const LOOKS: LookPreview[] = [
  {
    id: 'grove',
    name: 'Grove',
    tagline: 'Warm linen and pine — adaptive daily care.',
    bestFor: 'Parents · phone',
    swatches: ['#f3eee6', '#1c6b57', '#fffaf4'],
  },
  {
    id: 'cinema',
    name: 'Cinema',
    tagline: 'OLED black and gold — living-room movies.',
    bestFor: 'Fire Stick · TV',
    swatches: ['#0c0d11', '#d4a853', '#181b22'],
  },
  {
    id: 'harbor',
    name: 'Harbor',
    tagline: 'Cool studio light — reports and ratios.',
    bestFor: 'Directors · Windows',
    swatches: ['#eef3f7', '#1f6f8b', '#ffffff'],
  },
  {
    id: 'atelier',
    name: 'Atelier',
    tagline: 'Quiet type and white space — parent calm.',
    bestFor: 'Finance · reports',
    swatches: ['#f7f5f2', '#3f3a36', '#ffffff'],
  },
  {
    id: 'arcade',
    name: 'Arcade',
    tagline: 'Sunny badges and streaks — kids’ learning.',
    bestFor: 'Learning packs',
    swatches: ['#fff6d9', '#f4a259', '#2bb673'],
  },
  {
    id: 'pulse',
    name: 'Pulse',
    tagline: 'Neon charts on ink — director analytics.',
    bestFor: 'Harbor nights',
    swatches: ['#07060f', '#39f2c7', '#ff3d8f'],
  },
  {
    id: 'rang',
    name: 'Rang',
    tagline: 'Marigold and vermilion — family festivals.',
    bestFor: 'Household Hub',
    swatches: ['#fff4e4', '#e07a1f', '#9b1d2e'],
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
