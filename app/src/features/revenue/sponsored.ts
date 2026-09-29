import raw from '../../data/sponsored.json'

export type SponsoredSlot = {
  id: string
  brand: string
  title: string
  blurb: string
  url: string
  until: string
}

const PII_RE = /\bPIN\b|\ballerg|@|childId|medical/i

function isSlot(value: unknown): value is SponsoredSlot {
  if (!value || typeof value !== 'object') return false
  const row = value as Record<string, unknown>
  return ['id', 'brand', 'title', 'blurb', 'url', 'until'].every((key) => typeof row[key] === 'string')
}

export function liveSponsored(list: unknown = raw, now = new Date()): SponsoredSlot[] {
  if (!Array.isArray(list)) return []
  return list.filter(isSlot).filter((slot) => {
    try {
      const url = new URL(slot.url)
      const until = new Date(`${slot.until}T23:59:59`)
      return (
        url.protocol === 'https:' &&
        !Number.isNaN(until.getTime()) &&
        until >= now &&
        !PII_RE.test(`${slot.brand} ${slot.title} ${slot.blurb} ${slot.url}`)
      )
    } catch {
      return false
    }
  })
}
