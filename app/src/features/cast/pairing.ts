import type { Channel } from './channel'
import { deriveSession, ecdhKeyPair, type ChannelSpec, type Session } from './crypto'
import type { Device } from './schema'

export type LinkedTv = { id: string; key: string; tvId: string; name: string; addedAt: number }
export type LinkedPhone = { id: string; name: string; topic: string; key: string; addedAt: number }

export type PairErrorCode = 'no-answer' | 'denied' | 'timeout' | 'aborted' | 'relay'

export class PairError extends Error {
  readonly code: PairErrorCode
  constructor(code: PairErrorCode) {
    super(code)
    this.code = code
  }
}

const PAIR_CODE = /^([A-Za-z0-9_-]{22})\.([A-Za-z0-9_-]{43})$/

/** `#/link?c=<topic>.<key>` on this app's own base, so the phone opens the same deployment the TV runs. */
export function pairingUrl(href: string, channel: ChannelSpec) {
  return `${new URL('./', href).href}#/link?c=${channel.topic.slice(2)}.${channel.key}`
}

export function parsePairingCode(c: string | null | undefined): ChannelSpec | null {
  const match = c ? PAIR_CODE.exec(c) : null
  return match ? { topic: `wp${match[1]}`, key: match[2] } : null
}

/** How long the phone waits for Allow. The TV closes its prompt sooner so it never approves a phone that gave up. */
export const APPROVE_TIMEOUT_MS = 120_000
export const TV_APPROVE_WINDOW_MS = APPROVE_TIMEOUT_MS - 20_000

const sessionContext = (pairTopic: string, phonePub: string, tvPub: string) => `${pairTopic}|${phonePub}|${tvPub}`

export type PhonePairOptions = {
  onSas?: (sas: string, tvName: string) => void
  offerTimeoutMs?: number
  approveTimeoutMs?: number
  signal?: AbortSignal
}

/** Phone side: hello → TV offer (ECDH) → both screens show the same code → TV approves. */
export async function phonePair(channel: Channel, self: Device, opts: PhonePairOptions = {}): Promise<LinkedTv> {
  const me = await ecdhKeyPair()
  return new Promise<LinkedTv>((resolve, reject) => {
    let pending: Promise<Session> | null = null
    let tv: Device | null = null
    let timer = setTimeout(() => finish(new PairError('no-answer')), opts.offerTimeoutMs ?? 15_000)

    function finish(result: LinkedTv | PairError) {
      clearTimeout(timer)
      stop()
      opts.signal?.removeEventListener('abort', onAbort)
      if (result instanceof PairError) reject(result)
      else resolve(result)
    }
    function onAbort() {
      finish(new PairError('aborted'))
    }
    opts.signal?.addEventListener('abort', onAbort)

    const stop = channel.listen((msg, from) => {
      if (!('to' in msg) || msg.to !== self.id) return
      if (msg.type === 'offer' && !pending) {
        tv = from
        clearTimeout(timer)
        timer = setTimeout(() => finish(new PairError('timeout')), opts.approveTimeoutMs ?? APPROVE_TIMEOUT_MS)
        pending = deriveSession(me.privateKey, msg.pub, sessionContext(channel.topic, me.pub, msg.pub))
        void pending.then((s) => opts.onSas?.(s.sas, from.name)).catch(() => finish(new PairError('relay')))
      } else if (msg.type === 'approved' && pending && tv && from.id === tv.id) {
        const peer = tv
        void pending.then((s) => finish({ id: s.topic, key: s.key, tvId: peer.id, name: peer.name, addedAt: Date.now() }))
      } else if (msg.type === 'denied' && (!tv || from.id === tv.id)) {
        finish(new PairError('denied'))
      }
    })

    channel
      .ready()
      .then(() => channel.send({ type: 'hello', pub: me.pub }))
      .catch(() => finish(new PairError('relay')))
  })
}

export type PairRequest = {
  device: Device
  sas: string
  approve: () => Promise<LinkedPhone>
  deny: () => Promise<void>
}

/** TV side: answers each hello with an ECDH offer and asks the user to approve. */
export function tvPairing(channel: Channel, onRequest: (req: PairRequest) => void) {
  let busy = new Set<string>()
  const settle = (id: string) => {
    busy = new Set([...busy].filter((x) => x !== id))
  }
  return channel.listen((msg, from) => {
    if (msg.type !== 'hello' || busy.has(from.id)) return
    busy = new Set([...busy, from.id])
    void (async () => {
      const me = await ecdhKeyPair()
      const session = await deriveSession(me.privateKey, msg.pub, sessionContext(channel.topic, msg.pub, me.pub))
      await channel.send({ type: 'offer', to: from.id, pub: me.pub })
      onRequest({
        device: from,
        sas: session.sas,
        async approve() {
          settle(from.id)
          await channel.send({ type: 'approved', to: from.id })
          return { id: from.id, name: from.name, topic: session.topic, key: session.key, addedAt: Date.now() }
        },
        async deny() {
          settle(from.id)
          await channel.send({ type: 'denied', to: from.id })
        },
      })
    })().catch(() => settle(from.id))
  })
}
