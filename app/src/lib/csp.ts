import { buildCsp } from './cspPolicy'

/** Production CSP is injected at build time by vite.config.ts from the same builder and env keys (CSP_ENDPOINT_KEYS). */
export const PRODUCTION_CSP = buildCsp([
  import.meta.env.VITE_AGENT_URL,
  import.meta.env.VITE_LEADS_ENDPOINT,
  import.meta.env.VITE_ANALYTICS_ENDPOINT,
])

export const SECURITY_HEADERS = {
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
}
