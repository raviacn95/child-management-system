import type { RemoteKey } from './schema'

export type KeyBatch = { key: RemoteKey; times: number }

const MERGEABLE: ReadonlySet<RemoteKey> = new Set(['up', 'down', 'left', 'right'])
const MAX_TIMES = 9
const MAX_QUEUE = 8
/** ntfy.sh allows a burst of 60 requests, then one per 5 s, and 250 messages a day per IP. */
export const RELAY_KEY_INTERVAL_MS = 700

/**
 * Sends the first press at once; while the relay interval runs, repeated arrows merge into one batch.
 * An interval of 0 (direct link up) sends every press immediately.
 */
export function createKeyQueue(send: (batch: KeyBatch) => void, intervalMs: () => number) {
  let queue: KeyBatch[] = []
  let lastAt = -Infinity
  let timer: ReturnType<typeof setTimeout> | undefined

  function pump() {
    timer = undefined
    if (!queue.length) return
    const wait = lastAt + intervalMs() - Date.now()
    if (wait > 0) {
      timer = setTimeout(pump, wait)
      return
    }
    const [head, ...rest] = queue
    queue = rest
    lastAt = Date.now()
    send(head)
    if (queue.length) timer = setTimeout(pump, intervalMs())
  }

  return {
    push(key: RemoteKey) {
      const tail = queue.at(-1)
      if (tail && tail.key === key && MERGEABLE.has(key) && tail.times < MAX_TIMES) {
        queue = [...queue.slice(0, -1), { key, times: tail.times + 1 }]
      } else if (queue.length < MAX_QUEUE) {
        queue = [...queue, { key, times: 1 }]
      }
      if (!timer) pump()
    },
    dispose() {
      clearTimeout(timer)
      timer = undefined
      queue = []
    },
  }
}
