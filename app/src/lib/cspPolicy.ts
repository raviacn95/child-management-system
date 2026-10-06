const BASE_CONNECT = ["'self'", 'https://ntfy.sh', 'wss://ntfy.sh']

/** Origin of a configured https endpoint, or '' so a bad value never widens the policy. */
export function endpointOrigin(raw: string | undefined) {
  try {
    const url = new URL(String(raw ?? ''))
    return url.protocol === 'https:' ? url.origin : ''
  } catch {
    return ''
  }
}

/** Production CSP. connect-src also allows the origins of the agent, leads, and analytics endpoints the build is configured with. */
export function buildCsp(endpoints: readonly (string | undefined)[] = []) {
  const connect = [...new Set([...BASE_CONNECT, ...endpoints.map(endpointOrigin).filter(Boolean)])]
  return [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline'",
    "style-src 'self' 'unsafe-inline'",
    "font-src 'self' data:",
    "img-src 'self' data: https:",
    `connect-src ${connect.join(' ')}`,
    "frame-src 'self' https:",
    "object-src 'none'",
    "base-uri 'self'",
    "frame-ancestors 'none'",
  ].join('; ')
}

export const CSP_ENDPOINT_KEYS = ['VITE_AGENT_URL', 'VITE_LEADS_ENDPOINT', 'VITE_ANALYTICS_ENDPOINT'] as const
