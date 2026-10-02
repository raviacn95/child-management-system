/**
 * Free public relay (open-source ntfy, no account or key). A self-hosted ntfy works by changing RELAY_URL;
 * keep `connect-src` in vite.config.ts and lib/csp.ts in step with it.
 */
export const RELAY_URL = 'https://ntfy.sh'
/** ntfy turns bodies over 4,096 bytes into attachments. */
export const MAX_RELAY_BYTES = 4000

export type Transport = {
  publish: (body: string) => Promise<void>
  subscribe: (onBody: (body: string) => void, onOpen?: () => void) => () => void
}

export class RelayError extends Error {
  readonly status: number
  constructor(message: string, status: number) {
    super(message)
    this.status = status
  }
}

function parseNtfyEvent(raw: string): { id: string; message: string } | null {
  try {
    const data = JSON.parse(raw) as { id?: unknown; event?: unknown; message?: unknown }
    if (data.event !== 'message' || typeof data.id !== 'string' || typeof data.message !== 'string') return null
    return { id: data.id, message: data.message }
  } catch {
    return null
  }
}

/** Subscribes only while the page is visible; catches up with `since=` after a reconnect. */
export function ntfyTransport(topic: string, base = RELAY_URL): Transport {
  return {
    async publish(body) {
      if (body.length > MAX_RELAY_BYTES) throw new RelayError('Message too large for the relay', 413)
      const res = await fetch(`${base}/${topic}`, { method: 'POST', body, cache: 'no-store' })
      if (!res.ok) throw new RelayError(res.status === 429 ? 'Relay rate limit reached' : 'Relay unavailable', res.status)
    },
    subscribe(onBody, onOpen) {
      let source: EventSource | null = null
      let lastId = ''
      let stopped = false
      let attempt = 0
      let timer: ReturnType<typeof setTimeout> | undefined

      const drop = () => {
        source?.close()
        source = null
      }
      const connect = () => {
        if (stopped || source || document.visibilityState === 'hidden') return
        const es = new EventSource(`${base}/${topic}/sse${lastId ? `?since=${encodeURIComponent(lastId)}` : ''}`)
        source = es
        es.onopen = () => {
          attempt = 0
          onOpen?.()
        }
        es.onmessage = (event: MessageEvent<string>) => {
          const data = parseNtfyEvent(event.data)
          if (!data) return
          lastId = data.id
          onBody(data.message)
        }
        es.onerror = () => {
          if (es.readyState !== EventSource.CLOSED) return
          drop()
          clearTimeout(timer)
          timer = setTimeout(connect, Math.min(30_000, 1000 * 2 ** attempt++))
        }
      }
      const onVisibility = () => (document.visibilityState === 'hidden' ? drop() : connect())
      const onOnline = () => {
        drop()
        connect()
      }
      document.addEventListener('visibilitychange', onVisibility)
      window.addEventListener('online', onOnline)
      connect()
      return () => {
        stopped = true
        clearTimeout(timer)
        drop()
        document.removeEventListener('visibilitychange', onVisibility)
        window.removeEventListener('online', onOnline)
      }
    },
  }
}

/** In-process relay for unit tests: every subscriber on a topic gets every body, like ntfy. */
export function memoryRelay() {
  const subs = new Map<string, Set<(body: string) => void>>()
  return (topic: string): Transport => ({
    async publish(body) {
      for (const fn of [...(subs.get(topic) ?? [])]) queueMicrotask(() => fn(body))
    },
    subscribe(onBody, onOpen) {
      const set = subs.get(topic) ?? new Set()
      set.add(onBody)
      subs.set(topic, set)
      queueMicrotask(() => onOpen?.())
      return () => set.delete(onBody)
    },
  })
}

export function relayFor(topic: string): Transport {
  return ntfyTransport(topic)
}
