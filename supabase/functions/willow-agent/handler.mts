import { ADULT_SAY, agentMessages, cleanAgentText, parseAgentReply, wantsAdult, type AgentReply } from './agent.mts'
import { chatOnce, resolveProvider } from './provider.mts'

export type AgentDeps = {
  env: (key: string) => string | undefined
  fetch: typeof fetch
  allow: (client: string) => Promise<boolean>
  log?: (event: string, detail?: Record<string, unknown>) => void
}

type ErrorCode = 'forbidden_origin' | 'method' | 'too_large' | 'invalid' | 'private' | 'not_configured' | 'rate_limited' | 'busy' | 'upstream'

const MAX_BODY = 2048
const DEFAULT_ORIGINS = [
  'https://raviacn95.github.io',
  'https://localhost',
  'http://localhost',
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'http://localhost:4173',
  'http://127.0.0.1:4173',
]

const ERROR_SAY: Record<ErrorCode, string> = {
  forbidden_origin: 'This site is not allowed to use the Willow helper.',
  method: 'Send the request with POST.',
  too_large: 'That request is too long. Keep it under 200 characters.',
  invalid: 'Type a short request, like "Hindi comedy movies".',
  private: 'Leave out names, numbers, and health details, then try again.',
  not_configured: 'The AI helper is not switched on yet. Simple requests still work.',
  rate_limited: 'The AI helper is busy. Wait a minute and try again.',
  busy: 'The AI helper is resting. Simple requests still work.',
  upstream: 'The AI helper did not answer. Try again in a moment.',
}

const STATUS: Record<ErrorCode, number> = {
  forbidden_origin: 403,
  method: 405,
  too_large: 413,
  invalid: 400,
  private: 400,
  not_configured: 503,
  rate_limited: 429,
  busy: 503,
  upstream: 502,
}

function allowedOrigins(env: AgentDeps['env']) {
  const extra = (env('AGENT_ALLOWED_ORIGINS') ?? '')
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean)
  return extra.length ? extra : DEFAULT_ORIGINS
}

function corsHeaders(origin: string | null): Record<string, string> {
  return {
    'Access-Control-Allow-Origin': origin ?? '*',
    'Access-Control-Allow-Headers': 'content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Max-Age': '600',
    Vary: 'Origin',
  }
}

function reply(body: AgentReply | { error: ErrorCode; say: string }, status: number, origin: string | null) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store', ...corsHeaders(origin) },
  })
}

function fail(code: ErrorCode, origin: string | null) {
  return reply({ error: code, say: ERROR_SAY[code] }, STATUS[code], origin)
}

export async function clientKey(req: Request, salt = '') {
  const forwarded = (req.headers.get('x-forwarded-for') ?? '').split(',')[0].trim()
  const ip = req.headers.get('cf-connecting-ip') || req.headers.get('x-real-ip') || forwarded || 'unknown'
  const bytes = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(`${salt}:${ip}`))
  return [...new Uint8Array(bytes)]
    .slice(0, 16)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}

/** 402 and 429 mean the provider's free allowance is spent, not that it is broken. */
const SPENT = new Set([402, 429])

async function readBody(req: Request) {
  const declared = Number(req.headers.get('content-length') ?? 0)
  if (declared > MAX_BODY) return { tooLarge: true as const }
  const raw = await req.text()
  if (raw.length > MAX_BODY) return { tooLarge: true as const }
  try {
    return { body: JSON.parse(raw) as unknown }
  } catch {
    return { body: null }
  }
}

export async function handleAgent(req: Request, deps: AgentDeps, client: string): Promise<Response> {
  const origin = req.headers.get('origin')
  if (origin && !allowedOrigins(deps.env).includes(origin)) return fail('forbidden_origin', null)
  if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: corsHeaders(origin) })
  if (req.method !== 'POST') return fail('method', origin)

  const read = await readBody(req)
  if ('tooLarge' in read) return fail('too_large', origin)
  const input = cleanAgentText(read.body)
  if (!input.ok) return fail(input.error, origin)
  if (wantsAdult(input.text)) return reply({ say: ADULT_SAY, action: { type: 'none' } }, 200, origin)

  const provider = resolveProvider(deps.env)
  if (!provider) return fail('not_configured', origin)

  try {
    if (!(await deps.allow(client))) return fail('rate_limited', origin)
  } catch (error) {
    deps.log?.('agent.quota_error', { message: error instanceof Error ? error.message : 'unknown' })
    return fail('busy', origin)
  }

  try {
    const result = await chatOnce(provider, agentMessages(input.text), { json: true, temperature: 0.2, maxTokens: 600 }, deps.fetch)
    if (result.ok) return reply(parseAgentReply(result.content), 200, origin)
    deps.log?.('agent.upstream_status', { provider: provider.id, status: result.status })
    return fail(SPENT.has(result.status) ? 'busy' : 'upstream', origin)
  } catch (error) {
    deps.log?.('agent.upstream_error', { provider: provider.id, name: error instanceof Error ? error.name : 'unknown' })
    return fail('upstream', origin)
  }
}
