export const LOOK_IDS = ['grove', 'cinema', 'harbor'] as const
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
    tagline: 'Warm linen and pine — the childcare daylight look.',
    bestFor: 'Phone & Windows',
    swatches: ['#f3eee6', '#1c6b57', '#fffaf4'],
  },
  {
    id: 'cinema',
    name: 'Cinema',
    tagline: 'OLED dark with gold — built for Fire Stick and movies.',
    bestFor: 'Fire Stick & TV',
    swatches: ['#0c0d11', '#d4a853', '#181b22'],
  },
  {
    id: 'harbor',
    name: 'Harbor',
    tagline: 'Cool studio light — crisp for reports and directors.',
    bestFor: 'Windows & tablet',
    swatches: ['#eef3f7', '#1f6f8b', '#ffffff'],
  },
]

export function isLookId(value: string | null | undefined): value is LookId {
  return value === 'grove' || value === 'cinema' || value === 'harbor'
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
