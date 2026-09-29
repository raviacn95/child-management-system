const CHECKOUT_HOSTS = new Set(['rzp.io', 'razorpay.me', 'pages.razorpay.com', 'buy.stripe.com', 'checkout.stripe.com'])

export function safeCheckoutUrl(raw: unknown) {
  try {
    const url = new URL(String(raw ?? '').trim())
    if (url.protocol !== 'https:') return ''
    if (!CHECKOUT_HOSTS.has(url.hostname) && !url.hostname.endsWith('.razorpay.com')) return ''
    return url.href
  } catch {
    return ''
  }
}

export function safeEndpoint(raw: unknown) {
  try {
    const url = new URL(String(raw ?? '').trim())
    return url.protocol === 'https:' ? url.href : ''
  } catch {
    return ''
  }
}

export function safeEmail(raw: unknown) {
  const value = String(raw ?? '').trim()
  return /^[^\s@<>]+@[^\s@<>]+\.[a-z]{2,}$/i.test(value) ? value.slice(0, 120) : ''
}

export function safeWhatsapp(raw: unknown) {
  const digits = String(raw ?? '').replace(/\D/g, '')
  return digits.length >= 10 && digits.length <= 15 ? digits : ''
}

export type RevenueConfig = {
  plusCheckout: string
  packsCheckout: string
  leadsEndpoint: string
  salesEmail: string
  salesWhatsapp: string
}

export function readRevenueConfig(source: Record<string, unknown> = import.meta.env): RevenueConfig {
  return {
    plusCheckout: safeCheckoutUrl(source.VITE_PLUS_CHECKOUT_URL),
    packsCheckout: safeCheckoutUrl(source.VITE_PACKS_CHECKOUT_URL),
    leadsEndpoint: safeEndpoint(source.VITE_LEADS_ENDPOINT),
    salesEmail: safeEmail(source.VITE_SALES_EMAIL),
    salesWhatsapp: safeWhatsapp(source.VITE_SALES_WHATSAPP),
  }
}
