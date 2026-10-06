import { agentErrorSchema, agentReplySchema, type AgentReply } from './schema'

export type AgentResult = { ok: true; reply: AgentReply } | { ok: false; say: string; code: string }

const TIMEOUT_MS = 20_000
const LOCAL_HOSTS = new Set(['localhost', '127.0.0.1'])
export const OFFLINE_SAY = 'The AI helper is offline. Simple requests like "Hindi comedy movies" still work.'

/** https endpoint (or http on localhost); anything else turns the AI path off. */
export function safeAgentUrl(raw: string) {
  try {
    const url = new URL(raw)
    if (url.username || url.password) return ''
    if (url.protocol === 'https:' || (url.protocol === 'http:' && LOCAL_HOSTS.has(url.hostname))) return url.href
    return ''
  } catch {
    return ''
  }
}

export function agentEndpoint(source: { VITE_AGENT_URL?: string; DEV?: boolean } = import.meta.env) {
  const raw = String(source.VITE_AGENT_URL ?? '').trim()
  if (raw) return safeAgentUrl(raw)
  return source.DEV ? '/qc-api/agent' : ''
}

async function readJson(response: Response): Promise<unknown> {
  try {
    return await response.json()
  } catch {
    return null
  }
}

/** Sends only the typed words. Every answer is schema-checked before the app acts on it. */
export async function askAgent(text: string, endpoint: string, fetcher: typeof fetch = fetch): Promise<AgentResult> {
  try {
    const response = await fetcher(endpoint, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ text }),
      credentials: 'omit',
      signal: AbortSignal.timeout(TIMEOUT_MS),
    })
    const data = await readJson(response)
    if (response.ok) {
      const reply = agentReplySchema.safeParse(data)
      return reply.success ? { ok: true, reply: reply.data } : { ok: false, say: OFFLINE_SAY, code: 'bad_reply' }
    }
    const error = agentErrorSchema.safeParse(data)
    return error.success ? { ok: false, say: error.data.say, code: error.data.error } : { ok: false, say: OFFLINE_SAY, code: `http_${response.status}` }
  } catch (error) {
    console.warn('Willow helper request failed', error instanceof Error ? error.name : 'unknown')
    return { ok: false, say: OFFLINE_SAY, code: 'network' }
  }
}
