import assert from 'node:assert/strict'
import test from 'node:test'
import { chatOnce, resolveProvider, type Provider } from './provider.mts'

const envOf = (values: Record<string, string>) => (key: string) => values[key]
const MESSAGES = [{ role: 'user' as const, content: 'hi' }]

test('stays off without a provider or key', () => {
  assert.equal(resolveProvider(envOf({})), null)
  assert.equal(resolveProvider(envOf({ AI_PROVIDER: 'groq' })), null)
  assert.equal(resolveProvider(envOf({ AI_PROVIDER: 'openai-of-the-week', AI_API_KEY: 'k' })), null)
})

test('defaults to Ollama Cloud with a key and to local Ollama without one', () => {
  assert.deepEqual(resolveProvider(envOf({ AI_API_KEY: 'k' })), {
    id: 'ollama',
    protocol: 'ollama',
    url: 'https://ollama.com/api/chat',
    model: 'gpt-oss:120b',
    key: 'k',
    timeoutMs: 15_000,
  })
  const local = resolveProvider(envOf({ AI_PROVIDER: 'ollama', AI_MODEL: 'qwen3:latest' }))
  assert.deepEqual([local?.url, local?.model, local?.key, local?.timeoutMs], ['http://localhost:11434/api/chat', 'qwen3:latest', undefined, 19_000])
})

test('picks free hosted presets and keeps the old Grok settings working', () => {
  assert.equal(resolveProvider(envOf({ GROQ_API_KEY: 'g' }))?.url, 'https://api.groq.com/openai/v1/chat/completions')
  assert.equal(resolveProvider(envOf({ GEMINI_API_KEY: 'g' }))?.url, 'https://generativelanguage.googleapis.com/v1beta/openai/chat/completions')
  const grok = resolveProvider(envOf({ GROK_API_KEY: 'x', GROK_MODEL: 'grok-4' }))
  assert.deepEqual([grok?.id, grok?.model, grok?.url], ['xai', 'grok-4', 'https://api.x.ai/v1/chat/completions'])
})

test('rejects plain-http remote hosts, credentials in the URL, and keyless remote hosts', () => {
  assert.equal(resolveProvider(envOf({ AI_PROVIDER: 'ollama', AI_BASE_URL: 'http://192.168.1.9:11434' })), null)
  assert.equal(resolveProvider(envOf({ AI_API_KEY: 'k', AI_BASE_URL: 'https://u:p@ollama.com' })), null)
  assert.equal(resolveProvider(envOf({ AI_PROVIDER: 'ollama', AI_BASE_URL: 'https://ollama.com' })), null)
  assert.equal(resolveProvider(envOf({ AI_API_KEY: 'k', AI_TIMEOUT_MS: '999999' }))?.timeoutMs, 19_000)
  assert.equal(resolveProvider(envOf({ AI_API_KEY: 'k', AI_TIMEOUT_MS: '10' }))?.timeoutMs, 3_000)
})

function recording(response: unknown, calls: { url: string; headers: Record<string, string>; body: Record<string, unknown> }[], status = 200) {
  return (async (url: unknown, init?: RequestInit) => {
    calls.push({ url: String(url), headers: init?.headers as Record<string, string>, body: JSON.parse(String(init?.body)) })
    return new Response(JSON.stringify(response), { status })
  }) as typeof fetch
}

test('sends Ollama chat with JSON format and no thinking, and strips think blocks', async () => {
  const calls: Parameters<typeof recording>[1] = []
  const local = resolveProvider(envOf({ AI_PROVIDER: 'ollama' })) as Provider
  const result = await chatOnce(local, MESSAGES, { json: true, temperature: 0.2, maxTokens: 600 }, recording({ message: { content: '<think>{x}</think> {"ok":1}' } }, calls))
  assert.deepEqual(result, { ok: true, content: '{"ok":1}' })
  assert.equal(calls[0].headers.Authorization, undefined)
  assert.deepEqual(calls[0].body, { model: 'gpt-oss:120b', messages: MESSAGES, stream: false, think: false, format: 'json', options: { temperature: 0.2, num_predict: 600 } })
})

test('sends OpenAI-style chat for hosted presets and reports HTTP errors', async () => {
  const calls: Parameters<typeof recording>[1] = []
  const groq = resolveProvider(envOf({ GROQ_API_KEY: 'g' })) as Provider
  const ok = await chatOnce(groq, MESSAGES, { json: true, temperature: 0.2, maxTokens: 600 }, recording({ choices: [{ message: { content: '{"a":1}' } }] }, calls))
  assert.deepEqual(ok, { ok: true, content: '{"a":1}' })
  assert.equal(calls[0].headers.Authorization, 'Bearer g')
  assert.deepEqual(calls[0].body.response_format, { type: 'json_object' })
  const plain = await chatOnce(groq, MESSAGES, { temperature: 0.3, maxTokens: 500 }, recording({ choices: [] }, calls))
  assert.deepEqual(plain, { ok: true, content: '' })
  assert.equal('response_format' in calls[1].body, false)
  assert.deepEqual(await chatOnce(groq, MESSAGES, { temperature: 0, maxTokens: 1 }, recording({}, calls, 429)), { ok: false, status: 429 })
})
