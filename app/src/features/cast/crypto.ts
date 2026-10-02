import { fromB64u, randomB64u, randomBytes, toB64u, utf8 } from './bytes'

const ENVELOPE = 'w1'
export const MAX_AGE_MS = 60_000
const CODE_TTL_MS = 5 * 60_000

export type ChannelSpec = { topic: string; key: string }
export type Session = ChannelSpec & { sas: string }

export async function importAesKey(raw: string | Uint8Array<ArrayBuffer>) {
  const bytes = typeof raw === 'string' ? fromB64u(raw) : raw
  if (bytes.length !== 32) throw new Error('Pairing key must be 256 bits')
  return crypto.subtle.importKey('raw', bytes, 'AES-GCM', false, ['encrypt', 'decrypt'])
}

/** AES-GCM with the relay topic as additional data, so a message cannot be replayed onto another topic. */
export async function seal(key: CryptoKey, topic: string, data: unknown) {
  const iv = randomBytes(12)
  const ct = await crypto.subtle.encrypt({ name: 'AES-GCM', iv, additionalData: utf8(topic) }, key, utf8(JSON.stringify(data)))
  return `${ENVELOPE}.${toB64u(iv)}.${toB64u(new Uint8Array(ct))}`
}

export async function unseal(key: CryptoKey, topic: string, text: string): Promise<unknown> {
  const parts = text.split('.')
  if (parts.length !== 3 || parts[0] !== ENVELOPE) return null
  try {
    const iv = fromB64u(parts[1])
    if (iv.length !== 12) return null
    const pt = await crypto.subtle.decrypt({ name: 'AES-GCM', iv, additionalData: utf8(topic) }, key, fromB64u(parts[2]))
    return JSON.parse(new TextDecoder().decode(pt)) as unknown
  } catch {
    return null
  }
}

/** Accepts each nonce once, and only within ±60 s of this device's clock. */
export function createReplayGuard(windowMs = MAX_AGE_MS) {
  let seen = new Map<string, number>()
  return (ts: number, nonce: string, now = Date.now()) => {
    if (!Number.isFinite(ts) || Math.abs(now - ts) > windowMs) return false
    if (seen.has(nonce)) return false
    seen = new Map([...seen].filter(([, at]) => now - at <= windowMs * 2))
    seen.set(nonce, now)
    return true
  }
}

export async function ecdhKeyPair() {
  const pair = await crypto.subtle.generateKey({ name: 'ECDH', namedCurve: 'P-256' }, false, ['deriveBits'])
  const pub = toB64u(new Uint8Array(await crypto.subtle.exportKey('raw', pair.publicKey)))
  return { privateKey: pair.privateKey, pub }
}

/** Both sides get the same long-lived topic, key and a 4-digit code that differs if anyone swapped a public key. */
export async function deriveSession(privateKey: CryptoKey, peerPub: string, context: string): Promise<Session> {
  const peer = await crypto.subtle.importKey('raw', fromB64u(peerPub), { name: 'ECDH', namedCurve: 'P-256' }, false, [])
  const shared = await crypto.subtle.deriveBits({ name: 'ECDH', public: peer }, privateKey, 256)
  const hkdf = await crypto.subtle.importKey('raw', shared, 'HKDF', false, ['deriveBits'])
  const bits = new Uint8Array(
    await crypto.subtle.deriveBits(
      { name: 'HKDF', hash: 'SHA-256', salt: utf8(context), info: utf8('willow-cast-session-v1') },
      hkdf,
      52 * 8,
    ),
  )
  const sas = (new DataView(bits.buffer, 48, 4).getUint32(0) % 10_000).toString().padStart(4, '0')
  return { topic: `wl${toB64u(bits.slice(0, 16))}`, key: toB64u(bits.slice(16, 48)), sas }
}

export function newPairChannel(): ChannelSpec {
  return { topic: `wp${randomB64u(16)}`, key: randomB64u(32) }
}

export function newPairCode() {
  const [n] = crypto.getRandomValues(new Uint32Array(1))
  return (n % 1_000_000).toString().padStart(6, '0')
}

export function newCodeWindow(now = Date.now()) {
  return { code: newPairCode(), expiresAt: now + CODE_TTL_MS }
}

/** A 6-digit code is too short to be a key; it only finds the meeting topic, and the ECDH code check guards it. */
export async function codeChannel(code: string): Promise<ChannelSpec> {
  const digest = async (label: string) => new Uint8Array(await crypto.subtle.digest('SHA-256', utf8(`willow-code-${label}-v1:${code}`)))
  return { topic: `wc${toB64u((await digest('topic')).slice(0, 16))}`, key: toB64u(await digest('key')) }
}
