import assert from 'node:assert/strict'
import test from 'node:test'
import { clientKey, handleAgent, type AgentDeps } from './handler.mts'
import { memoryQuota, quotaLimits, supabaseQuota } from './quota.mts'

const ORIGIN = 'https://raviacn95.github.io'

type Call = { url?: string; auth?: string; body?: unknown }

function modelReturning(content: string, calls: Call[] = []) {
  return (async (url: unknown, init?: RequestInit) => {
    const headers = (init?.headers ?? {}) as Record<string, string>
    calls.push({ url: String(url), auth: headers.Authorization, body: JSON.parse(String(init?.body ?? '{}')) })
    return new Response(JSON.stringify({ message: { role: 'assistant', content } }), { status: 200 })
  }) as typeof fetch
}

function deps(over: Partial<AgentDeps> = {}): AgentDeps {
  return {
    env: (key) => ({ AI_API_KEY: 'test-key' })[key],
    fetch: modelReturning('{"say":"Opening Movies.","action":{"type":"navigate","page":"movies"}}'),
    allow: async () => true,
    ...over,
  }
}

function post(body: unknown, origin = ORIGIN) {
  return new Request('https://fn.example/willow-agent', {
    method: 'POST',
    headers: { 'content-type': 'application/json', origin },
    body: typeof body === 'string' ? body : JSON.stringify(body),
  })
}

test('answers with a validated action and CORS for the live site', async () => {
  const calls: Call[] = []
  const res = await handleAgent(post({ text: 'take me to movies' }), deps({ fetch: modelReturning('{"say":"Opening Movies.","action":{"type":"navigate","page":"movies"}}', calls) }), 'client-1')
  assert.equal(res.status, 200)
  assert.equal(res.headers.get('access-control-allow-origin'), ORIGIN)
  assert.deepEqual(await res.json(), { say: 'Opening Movies.', action: { type: 'navigate', page: 'movies' } })
  assert.equal(calls[0].url, 'https://ollama.com/api/chat')
  assert.equal(calls[0].auth, 'Bearer test-key')
  const sent = calls[0].body as { model: string; format: string; stream: boolean }
  assert.deepEqual([sent.model, sent.format, sent.stream], ['gpt-oss:120b', 'json', false])
  assert.equal(JSON.stringify(sent).includes('client-1'), false)
})

test('rejects other origins, wrong methods, and big or bad bodies', async () => {
  assert.equal((await handleAgent(post({ text: 'movies' }, 'https://evil.example'), deps(), 'c')).status, 403)
  assert.equal((await handleAgent(new Request('https://fn.example', { method: 'GET', headers: { origin: ORIGIN } }), deps(), 'c')).status, 405)
  assert.equal((await handleAgent(post({ text: 'a'.repeat(3000) }), deps(), 'c')).status, 413)
  assert.equal((await handleAgent(post('{not json'), deps(), 'c')).status, 400)
  const preflight = await handleAgent(new Request('https://fn.example', { method: 'OPTIONS', headers: { origin: ORIGIN } }), deps(), 'c')
  assert.equal(preflight.status, 204)
})

test('never sends private or adult requests to the model', async () => {
  const calls: Call[] = []
  const d = deps({ fetch: modelReturning('{}', calls) })
  const privateRes = await handleAgent(post({ text: 'my pin is 4821' }), d, 'c')
  assert.equal(privateRes.status, 400)
  assert.equal((await privateRes.json()).error, 'private')
  const adult = await handleAgent(post({ text: 'erotic movies please' }), d, 'c')
  assert.deepEqual((await adult.json()).action, { type: 'none' })
  assert.equal(calls.length, 0)
})

test('reports missing key, spent quota, and quota outages without calling the model', async () => {
  const calls: Call[] = []
  const fetcher = modelReturning('{}', calls)
  assert.equal((await handleAgent(post({ text: 'movies' }), deps({ env: () => undefined, fetch: fetcher }), 'c')).status, 503)
  assert.equal((await handleAgent(post({ text: 'movies' }), deps({ allow: async () => false, fetch: fetcher }), 'c')).status, 429)
  const logs: string[] = []
  const down = await handleAgent(
    post({ text: 'movies' }),
    deps({ allow: async () => Promise.reject(new Error('db down')), fetch: fetcher, log: (e) => logs.push(e) }),
    'c',
  )
  assert.equal(down.status, 503)
  assert.deepEqual(logs, ['agent.quota_error'])
  assert.equal(calls.length, 0)
})

test('maps model failures to a friendly 502 and a spent allowance to resting', async () => {
  const failing = (async () => new Response('nope', { status: 500 })) as typeof fetch
  const res = await handleAgent(post({ text: 'movies' }), deps({ fetch: failing }), 'c')
  assert.equal(res.status, 502)
  assert.match((await res.json()).say, /did not answer/)
  const throwing = (async () => Promise.reject(new Error('network'))) as typeof fetch
  assert.equal((await handleAgent(post({ text: 'movies' }), deps({ fetch: throwing }), 'c')).status, 502)
  for (const status of [402, 429]) {
    const spent = (async () => new Response('{}', { status })) as typeof fetch
    const body = await (await handleAgent(post({ text: 'movies' }), deps({ fetch: spent }), 'c')).json()
    assert.deepEqual([body.error, body.say], ['busy', 'The AI helper is resting. Simple requests still work.'])
  }
})

test('hashes the client address instead of keeping it', async () => {
  const req = new Request('https://fn.example', { headers: { 'x-forwarded-for': '203.0.113.7, 10.0.0.1' } })
  const key = await clientKey(req, 'salt')
  assert.match(key, /^[0-9a-f]{32}$/)
  assert.equal(key.includes('203'), false)
  assert.equal(key, await clientKey(new Request('https://fn.example', { headers: { 'x-forwarded-for': '203.0.113.7' } }), 'salt'))
  const edge = new Request('https://fn.example', { headers: { 'cf-connecting-ip': '198.51.100.4', 'x-forwarded-for': '203.0.113.7' } })
  assert.equal(await clientKey(edge, 'salt'), await clientKey(new Request('https://fn.example', { headers: { 'x-real-ip': '198.51.100.4' } }), 'salt'))
})

test('memory quota stops one client before the shared daily budget', async () => {
  let t = 0
  const allow = memoryQuota({ perMinute: 2, perClientDay: 3, perDay: 4 }, () => t)
  assert.deepEqual([await allow('a'), await allow('a'), await allow('a')], [true, true, false])
  t = 61_000
  assert.deepEqual([await allow('a'), await allow('a')], [true, false])
  assert.deepEqual([await allow('b'), await allow('b'), await allow('c')], [true, false, false])
})

test('database quota posts limits and fails closed', async () => {
  const seen: { url: string; headers: Record<string, string>; body: unknown }[] = []
  const env = (key: string) => ({ SUPABASE_URL: 'https://p.supabase.co', SUPABASE_SERVICE_ROLE_KEY: 'a.b.c', AGENT_DAILY_LIMIT: '50' })[key]
  const ok = (async (url: unknown, init?: RequestInit) => {
    seen.push({ url: String(url), headers: init?.headers as Record<string, string>, body: JSON.parse(String(init?.body)) })
    return new Response('true', { status: 200 })
  }) as typeof fetch
  assert.equal(await supabaseQuota(env, ok)('client-key'), true)
  assert.equal(seen[0].url, 'https://p.supabase.co/rest/v1/rpc/agent_allow')
  assert.equal(seen[0].headers.Authorization, 'Bearer a.b.c')
  assert.deepEqual(seen[0].body, { p_client: 'client-key', p_minute_limit: 6, p_client_daily_limit: 60, p_daily_limit: 50 })
  await assert.rejects(supabaseQuota(() => undefined, ok)('client-key'), /quota_not_configured/)
  const broken = (async () => new Response('', { status: 404 })) as typeof fetch
  await assert.rejects(supabaseQuota(env, broken)('client-key'), /quota_status_404/)
  assert.deepEqual(quotaLimits(() => 'junk'), { perMinute: 6, perClientDay: 60, perDay: 300 })
})
