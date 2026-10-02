/** Apps blocked in India by the I&B Ministry (Mar 2024, Jul 2025, Feb 2026 orders). Willow never links them. */
export const BLOCKED_PLATFORMS: readonly string[] = [
  'altt',
  'altbalaji',
  'ullu',
  'bigshots',
  'desiflix',
  'boomex',
  'neonx',
  'gulab',
  'kangan',
  'jalva',
  'hitprime',
  'fugi',
  'feneo',
  'showx',
  'moodx',
  'triflicks',
  'mojflix',
  'hulchul',
  'primeplay',
  'besharams',
  'voovi',
  'yessma',
  'uncutadda',
  'koyal',
  'jugnu',
]

export function mentionsBlockedPlatform(text: string) {
  const squashed = text.toLowerCase().replace(/[^a-z0-9]/g, '')
  return BLOCKED_PLATFORMS.some((id) => squashed.includes(id))
}
