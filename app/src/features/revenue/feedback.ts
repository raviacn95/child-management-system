import { readRevenueConfig, type RevenueConfig } from './config'

const CHILD_DATA_RE = /\ballerg|medical|childId|\bPIN\b|date of birth|\bdob\b/i

export function prepareFeedback(note: string): { ok: true; text: string } | { ok: false; error: string } {
  const text = note.trim()
  if (text.length < 8) return { ok: false, error: 'Add a sentence about what to improve' }
  if (text.length > 500) return { ok: false, error: 'Keep it under 500 letters' }
  if (CHILD_DATA_RE.test(text)) return { ok: false, error: 'Please leave out any child details' }
  return { ok: true, text }
}

export function feedbackHref(text: string, config: RevenueConfig) {
  if (config.salesWhatsapp) return `https://wa.me/${config.salesWhatsapp}?text=${encodeURIComponent(`Willow feedback\n${text}`)}`
  if (config.salesEmail) {
    return `mailto:${config.salesEmail}?subject=${encodeURIComponent('Willow feedback')}&body=${encodeURIComponent(text)}`
  }
  return ''
}

export async function sendFeedback(
  note: string,
  options: { config?: RevenueConfig; fetcher?: typeof fetch } = {},
): Promise<{ ok: true; via: 'endpoint' | 'link' | 'copy'; href?: string; text?: string } | { ok: false; error: string }> {
  const checked = prepareFeedback(note)
  if (!checked.ok) return checked
  const config = options.config ?? readRevenueConfig()
  if (config.leadsEndpoint) {
    try {
      const res = await (options.fetcher ?? fetch)(config.leadsEndpoint, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ source: 'willow-feedback', message: checked.text }),
        credentials: 'omit',
      })
      if (res.ok) return { ok: true, via: 'endpoint' }
    } catch {
      /* fall through */
    }
  }
  const href = feedbackHref(checked.text, config)
  if (href) return { ok: true, via: 'link', href }
  return { ok: true, via: 'copy', text: checked.text }
}
