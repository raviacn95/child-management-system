export type QuotaLimits = { perMinute: number; perClientDay: number; perDay: number }

const DEFAULT_LIMITS: QuotaLimits = { perMinute: 6, perClientDay: 60, perDay: 300 }

function positive(value: string | undefined, fallback: number) {
  const n = Number(value)
  return Number.isInteger(n) && n > 0 ? n : fallback
}

export function quotaLimits(env: (key: string) => string | undefined): QuotaLimits {
  return {
    perMinute: positive(env('AGENT_PER_MINUTE'), DEFAULT_LIMITS.perMinute),
    perClientDay: positive(env('AGENT_PER_CLIENT_DAY'), DEFAULT_LIMITS.perClientDay),
    perDay: positive(env('AGENT_DAILY_LIMIT'), DEFAULT_LIMITS.perDay),
  }
}

function serviceHeaders(key: string): Record<string, string> {
  const headers: Record<string, string> = { apikey: key, 'content-type': 'application/json' }
  if (key.split('.').length === 3) headers.Authorization = `Bearer ${key}`
  return headers
}

/** Counts each request in Postgres (agent_allow); throws when the database cannot be reached so callers fail closed. */
export function supabaseQuota(env: (key: string) => string | undefined, fetcher: typeof fetch) {
  const limits = quotaLimits(env)
  return async (client: string) => {
    const url = env('SUPABASE_URL')
    const key = env('SUPABASE_SERVICE_ROLE_KEY')
    if (!url || !key) throw new Error('quota_not_configured')
    const response = await fetcher(`${url}/rest/v1/rpc/agent_allow`, {
      method: 'POST',
      headers: serviceHeaders(key),
      body: JSON.stringify({
        p_client: client,
        p_minute_limit: limits.perMinute,
        p_client_daily_limit: limits.perClientDay,
        p_daily_limit: limits.perDay,
      }),
    })
    if (!response.ok) throw new Error(`quota_status_${response.status}`)
    return (await response.json()) === true
  }
}

/** In-process limiter for the local middleware, where there is no database. */
export function memoryQuota(limits: QuotaLimits, now = () => Date.now()) {
  const hits = new Map<string, { count: number; until: number }>()
  const take = (bucket: string, ttl: number, max: number) => {
    const t = now()
    const current = hits.get(bucket)
    const next = !current || current.until <= t ? { count: 1, until: t + ttl } : { ...current, count: current.count + 1 }
    hits.set(bucket, next)
    return next.count <= max
  }
  return async (client: string) =>
    take(`m:${client}`, 60_000, limits.perMinute) &&
    take(`d:${client}`, 86_400_000, limits.perClientDay) &&
    take('g', 86_400_000, limits.perDay)
}
