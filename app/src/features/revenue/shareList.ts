import { inviteUrl } from './referral'

const PII_RE = /\bPIN\b|\ballerg|@|childId|medical/i
const MAX_ITEMS = 30

export function shareListText(titles: string[], code: string) {
  const items = titles
    .map((title) => String(title ?? '').trim().slice(0, 60))
    .filter(Boolean)
    .slice(0, MAX_ITEMS)
  if (!items.length || PII_RE.test(items.join(' '))) return ''
  return ['Our family shopping list:', ...items.map((item) => `• ${item}`), '', `Made with Willow — ${inviteUrl(code)}`].join('\n')
}

export function whatsappShareHref(text: string) {
  return text ? `https://wa.me/?text=${encodeURIComponent(text)}` : ''
}
