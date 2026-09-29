import { z } from 'zod'
import { readRevenueConfig, type RevenueConfig } from './config'

export const LEAD_KINDS = [
  { id: 'center', label: 'Daycare / preschool' },
  { id: 'school', label: 'School' },
  { id: 'creator', label: 'Parenting creator' },
  { id: 'brand', label: 'Brand / sponsor' },
] as const

export type LeadKind = (typeof LEAD_KINDS)[number]['id']

const CHILD_DATA_RE = /\ballerg|medical|childId|\bPIN\b|date of birth|\bdob\b/i
const CONTACT_RE = /^([^\s@<>]+@[^\s@<>]+\.[a-z]{2,}|\+?[0-9][0-9 -]{8,16})$/i

export const leadSchema = z.object({
  kind: z.enum(['center', 'school', 'creator', 'brand']),
  org: z.string().trim().min(2, 'Add your organisation name').max(80),
  city: z.string().trim().min(2, 'Add your city').max(60),
  size: z.coerce.number().int().min(0).max(100000).default(0),
  contact: z.string().trim().regex(CONTACT_RE, 'Add a work email or phone number'),
  message: z
    .string()
    .trim()
    .max(500)
    .default('')
    .refine((value) => !CHILD_DATA_RE.test(value), 'Please leave out any child details'),
})

export type Lead = z.infer<typeof leadSchema>

export type LeadResult =
  | { ok: true; via: 'endpoint' }
  | { ok: true; via: 'whatsapp' | 'email'; href: string }
  | { ok: true; via: 'copy'; text: string }
  | { ok: false; error: string }

export function validateLead(input: unknown): { ok: true; lead: Lead } | { ok: false; error: string } {
  const parsed = leadSchema.safeParse(input)
  if (parsed.success) return { ok: true, lead: parsed.data }
  return { ok: false, error: parsed.error.issues[0]?.message ?? 'Check the form' }
}

export function leadText(lead: Lead, ref = '') {
  const kind = LEAD_KINDS.find((row) => row.id === lead.kind)?.label ?? lead.kind
  return [
    `Willow enquiry — ${kind}`,
    `Organisation: ${lead.org}`,
    `City: ${lead.city}`,
    lead.size ? `Children / audience: ${lead.size}` : '',
    `Contact: ${lead.contact}`,
    lead.message ? `Message: ${lead.message}` : '',
    ref ? `Referred by: ${ref}` : '',
  ]
    .filter(Boolean)
    .join('\n')
}

export async function submitLead(
  input: unknown,
  options: { config?: RevenueConfig; ref?: string; fetcher?: typeof fetch } = {},
): Promise<LeadResult> {
  const checked = validateLead(input)
  if (!checked.ok) return checked
  const config = options.config ?? readRevenueConfig()
  const ref = options.ref ?? ''
  const text = leadText(checked.lead, ref)
  if (config.leadsEndpoint) {
    try {
      const res = await (options.fetcher ?? fetch)(config.leadsEndpoint, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ ...checked.lead, ref, source: 'willow-pricing' }),
        credentials: 'omit',
      })
      if (res.ok) return { ok: true, via: 'endpoint' }
    } catch {
      /* fall through to the manual channels below */
    }
  }
  if (config.salesWhatsapp) {
    return { ok: true, via: 'whatsapp', href: `https://wa.me/${config.salesWhatsapp}?text=${encodeURIComponent(text)}` }
  }
  if (config.salesEmail) {
    const subject = encodeURIComponent(`Willow enquiry — ${checked.lead.org}`)
    return { ok: true, via: 'email', href: `mailto:${config.salesEmail}?subject=${subject}&body=${encodeURIComponent(text)}` }
  }
  return { ok: true, via: 'copy', text }
}
