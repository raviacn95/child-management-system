import { randomB64u } from './bytes'
import { createReplayGuard, importAesKey, seal, unseal, type ChannelSpec } from './crypto'
import { envelopeSchema, messageSchema, type CastMessage, type Device } from './schema'
import { relayFor, type Transport } from './transport'

export type Handler = (msg: CastMessage, from: Device) => void

export type Channel = {
  topic: string
  send: (msg: CastMessage) => Promise<void>
  listen: (handler: Handler) => () => void
  /** Resolves once the relay subscription is open, so a reply cannot arrive before we listen. */
  ready: () => Promise<void>
  /** Inbound text from a direct (WebRTC) link; checked exactly like relay messages. */
  receive: (text: string) => Promise<void>
  setDirect: (send: ((text: string) => boolean) | null) => void
  isDirect: () => boolean
  close: () => void
}

export type ChannelOptions = ChannelSpec & {
  self: Device
  /** Only accept messages from this device (the paired peer). */
  peerId?: string
  transport?: Transport
  now?: () => number
}

/** Fire-and-forget, e.g. a goodbye before a pairing is deleted. */
export async function sendOnce(opts: ChannelOptions, msg: CastMessage) {
  const channel = openChannel(opts)
  try {
    await channel.send(msg)
  } catch {
    /* the pairing is removed locally either way */
  } finally {
    channel.close()
  }
}

export function openChannel(opts: ChannelOptions): Channel {
  const transport = opts.transport ?? relayFor(opts.topic)
  const now = opts.now ?? Date.now
  const keyPromise = importAesKey(opts.key)
  const accept = createReplayGuard()
  let listeners: Handler[] = []
  let unsubscribe: (() => void) | null = null
  let opened = false
  let waiters: (() => void)[] = []
  let direct: ((text: string) => boolean) | null = null

  async function receive(text: string) {
    const parsed = envelopeSchema.safeParse(await unseal(await keyPromise, opts.topic, text))
    if (!parsed.success) return
    const { ts, n, from, msg } = parsed.data
    if (from.id === opts.self.id) return
    if (opts.peerId && from.id !== opts.peerId) return
    if (!accept(ts, n, now())) return
    for (const fn of listeners) fn(msg, from)
  }

  function markOpen() {
    opened = true
    for (const resolve of waiters) resolve()
    waiters = []
  }

  function ensureSubscribed() {
    if (unsubscribe) return
    unsubscribe = transport.subscribe((body) => void receive(body), markOpen)
  }

  return {
    topic: opts.topic,
    async send(msg) {
      const checked = messageSchema.parse(msg)
      const text = await seal(await keyPromise, opts.topic, { v: 1, ts: now(), n: randomB64u(12), from: opts.self, msg: checked })
      if (direct?.(text)) return
      await transport.publish(text)
    },
    listen(handler) {
      listeners = [...listeners, handler]
      ensureSubscribed()
      return () => {
        listeners = listeners.filter((fn) => fn !== handler)
      }
    },
    ready() {
      ensureSubscribed()
      return opened ? Promise.resolve() : new Promise<void>((resolve) => (waiters = [...waiters, resolve]))
    },
    receive,
    setDirect(send) {
      direct = send
    },
    isDirect: () => direct !== null,
    close() {
      unsubscribe?.()
      unsubscribe = null
      opened = false
      listeners = []
      direct = null
    },
  }
}
