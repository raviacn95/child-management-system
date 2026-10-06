import type { ChatMessage } from './agent.mts'

export const PROVIDER_IDS = ['ollama', 'groq', 'gemini', 'xai'] as const
export type ProviderId = (typeof PROVIDER_IDS)[number]

export type Provider = {
  id: ProviderId
  protocol: 'ollama' | 'openai'
  url: string
  model: string
  key?: string
  timeoutMs: number
}

export type ChatOptions = { json?: boolean; temperature: number; maxTokens: number }
export type ChatResult = { ok: true; content: string } | { ok: false; status: number }

type Env = (key: string) => string | undefined

const OLLAMA_CLOUD = 'https://ollama.com'
const OLLAMA_LOCAL = 'http://localhost:11434'
const REMOTE_TIMEOUT_MS = 15_000
/** The app gives up after 20s, so a slow local model must answer before that. */
const LOCAL_TIMEOUT_MS = 19_000
const MIN_TIMEOUT_MS = 3_000

const PRESETS: Record<ProviderId, { protocol: Provider['protocol']; base: string; model: string; keyEnv: string }> = {
  ollama: { protocol: 'ollama', base: OLLAMA_CLOUD, model: 'gpt-oss:120b', keyEnv: 'OLLAMA_API_KEY' },
  groq: { protocol: 'openai', base: 'https://api.groq.com/openai/v1', model: 'llama-3.3-70b-versatile', keyEnv: 'GROQ_API_KEY' },
  gemini: { protocol: 'openai', base: 'https://generativelanguage.googleapis.com/v1beta/openai', model: 'gemini-2.5-flash-lite', keyEnv: 'GEMINI_API_KEY' },
  xai: { protocol: 'openai', base: 'https://api.x.ai/v1', model: 'grok-3-mini', keyEnv: 'GROK_API_KEY' },
}

/** The PC's Ollama app calls the free cloud copy `gpt-oss:120b-cloud`; ollama.com calls it `gpt-oss:120b`. */
function ollamaModel(model: string, local: boolean) {
  if (local && model === 'gpt-oss:120b') return 'gpt-oss:120b-cloud'
  if (!local && model === 'gpt-oss:120b-cloud') return 'gpt-oss:120b'
  return model
}

function pickProvider(env: Env): ProviderId | null {
  const named = (env('AI_PROVIDER') ?? '').trim().toLowerCase()
  if (named === 'qwen3') return 'ollama'
  if (named) return (PROVIDER_IDS as readonly string[]).includes(named) ? (named as ProviderId) : null
  if (env('AI_API_KEY') || env('OLLAMA_API_KEY')) return 'ollama'
  if (env('GROQ_API_KEY')) return 'groq'
  if (env('GEMINI_API_KEY')) return 'gemini'
  if (env('GROK_API_KEY')) return 'xai'
  return null
}

function isLoopback(url: URL) {
  return ['localhost', '127.0.0.1', '[::1]'].includes(url.hostname)
}

function baseUrl(raw: string) {
  try {
    const url = new URL(raw)
    if (url.username || url.password) return null
    if (url.protocol === 'https:' || (url.protocol === 'http:' && isLoopback(url))) return url
    return null
  } catch {
    return null
  }
}

function timeout(env: Env, local: boolean) {
  const fallback = local ? LOCAL_TIMEOUT_MS : REMOTE_TIMEOUT_MS
  const n = Number(env('AI_TIMEOUT_MS'))
  return Number.isFinite(n) && n > 0 ? Math.min(Math.max(Math.round(n), MIN_TIMEOUT_MS), LOCAL_TIMEOUT_MS) : fallback
}

/** Reads AI_PROVIDER, AI_API_KEY, AI_MODEL, AI_BASE_URL, AI_TIMEOUT_MS. Returns null when the AI is off or misconfigured. */
export function resolveProvider(env: Env): Provider | null {
  const named = (env('AI_PROVIDER') ?? '').trim().toLowerCase()
  const id = pickProvider(env)
  if (!id) return null
  const preset = PRESETS[id]
  const key = env('AI_API_KEY') || env(preset.keyEnv) || undefined
  const offline = named === 'qwen3'
  const defaultBase = id === 'ollama' && (offline || !key) ? OLLAMA_LOCAL : preset.base
  const base = baseUrl(env('AI_BASE_URL') || defaultBase)
  if (!base) return null
  const local = isLoopback(base)
  if (!key && !local) return null
  const legacyModel = id === 'xai' ? env('GROK_MODEL') : undefined
  const requested = env('AI_MODEL') || (offline ? 'qwen3:latest' : legacyModel || preset.model)
  const path = preset.protocol === 'ollama' ? '/api/chat' : '/chat/completions'
  return {
    id,
    protocol: preset.protocol,
    url: `${base.origin}${base.pathname.replace(/\/+$/, '')}${path}`,
    model: id === 'ollama' ? ollamaModel(requested, local) : requested,
    key,
    timeoutMs: timeout(env, local),
  }
}

function requestBody(provider: Provider, messages: ChatMessage[], opts: ChatOptions) {
  if (provider.protocol === 'ollama') {
    return {
      model: provider.model,
      messages,
      stream: false,
      think: false,
      ...(opts.json ? { format: 'json' } : {}),
      options: { temperature: opts.temperature, num_predict: opts.maxTokens },
    }
  }
  return {
    model: provider.model,
    messages,
    temperature: opts.temperature,
    max_tokens: opts.maxTokens,
    ...(opts.json ? { response_format: { type: 'json_object' } } : {}),
  }
}

function replyText(provider: Provider, data: unknown) {
  const d = data as { message?: { content?: unknown }; choices?: { message?: { content?: unknown } }[] }
  const content = provider.protocol === 'ollama' ? d.message?.content : d.choices?.[0]?.message?.content
  return typeof content === 'string' ? content.replace(/<think>[\s\S]*?<\/think>/gi, '').trim() : ''
}

/** One non-streaming chat call. Network errors and timeouts throw; HTTP errors return their status. */
export async function chatOnce(provider: Provider, messages: ChatMessage[], opts: ChatOptions, fetcher: typeof fetch): Promise<ChatResult> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' }
  if (provider.key) headers.Authorization = `Bearer ${provider.key}`
  const response = await fetcher(provider.url, {
    method: 'POST',
    headers,
    body: JSON.stringify(requestBody(provider, messages, opts)),
    signal: AbortSignal.timeout(provider.timeoutMs),
  })
  if (!response.ok) return { ok: false, status: response.status }
  return { ok: true, content: replyText(provider, await response.json()) }
}
