// @vitest-environment node
import { describe, expect, it } from 'vitest'
import { fromB64u, randomB64u, toB64u } from './bytes'
import { codeChannel, createReplayGuard, deriveSession, ecdhKeyPair, importAesKey, newPairChannel, newPairCode, seal, unseal } from './crypto'

describe('base64url', () => {
  it('round-trips bytes without padding or URL-unsafe characters', () => {
    const bytes = new Uint8Array([0, 255, 62, 63, 250, 251, 1])
    const text = toB64u(bytes)
    expect(text).toMatch(/^[A-Za-z0-9_-]+$/)
    expect([...fromB64u(text)]).toEqual([...bytes])
  })

  it('makes random IDs of the requested strength', () => {
    expect(randomB64u(16)).toHaveLength(22)
    expect(randomB64u(16)).not.toBe(randomB64u(16))
    expect(() => fromB64u('not base64!')).toThrow()
  })
})

describe('seal / unseal', () => {
  it('round-trips JSON and hides the plaintext from the relay', async () => {
    const key = await importAesKey(randomB64u(32))
    const text = await seal(key, 'topic-a', { title: 'Mardaani 3' })
    expect(text.startsWith('w1.')).toBe(true)
    expect(text).not.toContain('Mardaani')
    expect(await unseal(key, 'topic-a', text)).toEqual({ title: 'Mardaani 3' })
  })

  it('rejects tampered ciphertext', async () => {
    const key = await importAesKey(randomB64u(32))
    const text = await seal(key, 't', { a: 1 })
    const last = text.at(-2) === 'A' ? 'B' : 'A'
    const tampered = `${text.slice(0, -2)}${last}${text.at(-1)}`
    expect(await unseal(key, 't', tampered)).toBeNull()
  })

  it('rejects another key, another topic and malformed input', async () => {
    const key = await importAesKey(randomB64u(32))
    const other = await importAesKey(randomB64u(32))
    const text = await seal(key, 'topic-a', { a: 1 })
    expect(await unseal(other, 'topic-a', text)).toBeNull()
    expect(await unseal(key, 'topic-b', text)).toBeNull()
    expect(await unseal(key, 'topic-a', 'garbage')).toBeNull()
    expect(await unseal(key, 'topic-a', 'w1.abc.def')).toBeNull()
  })

  it('refuses keys that are not 256 bits', async () => {
    await expect(importAesKey(randomB64u(16))).rejects.toThrow()
  })
})

describe('replay guard', () => {
  const NOW = 1_800_000_000_000

  it('accepts a fresh message once and rejects the replay', () => {
    const accept = createReplayGuard()
    expect(accept(NOW, 'nonce-1', NOW)).toBe(true)
    expect(accept(NOW, 'nonce-1', NOW + 10)).toBe(false)
    expect(accept(NOW, 'nonce-2', NOW + 10)).toBe(true)
  })

  it('rejects messages older than 60 seconds or from the far future', () => {
    const accept = createReplayGuard()
    expect(accept(NOW - 61_000, 'old', NOW)).toBe(false)
    expect(accept(NOW + 61_000, 'future', NOW)).toBe(false)
    expect(accept(NOW - 59_000, 'recent', NOW)).toBe(true)
    expect(accept(Number.NaN, 'nan', NOW)).toBe(false)
  })
})

describe('ECDH pairing session', () => {
  it('derives the same topic, key and confirmation code on both sides', async () => {
    const phone = await ecdhKeyPair()
    const tv = await ecdhKeyPair()
    const context = `wpTopic|${phone.pub}|${tv.pub}`
    const a = await deriveSession(phone.privateKey, tv.pub, context)
    const b = await deriveSession(tv.privateKey, phone.pub, context)
    expect(a).toEqual(b)
    expect(a.topic).toMatch(/^wl[A-Za-z0-9_-]{22}$/)
    expect(fromB64u(a.key)).toHaveLength(32)
    expect(a.sas).toMatch(/^\d{4}$/)
  })

  it('shows a different confirmation code when someone swaps a key in the middle', async () => {
    const phone = await ecdhKeyPair()
    const tv = await ecdhKeyPair()
    const attacker = await ecdhKeyPair()
    const phoneSide = await deriveSession(phone.privateKey, attacker.pub, `t|${phone.pub}|${attacker.pub}`)
    const tvSide = await deriveSession(tv.privateKey, attacker.pub, `t|${attacker.pub}|${tv.pub}`)
    expect(phoneSide.key).not.toBe(tvSide.key)
  })
})

describe('pairing channels', () => {
  it('derives the same relay topic and key from a 6-digit code', async () => {
    const a = await codeChannel('123456')
    const b = await codeChannel('123456')
    const c = await codeChannel('654321')
    expect(a).toEqual(b)
    expect(a.topic).toMatch(/^wc[A-Za-z0-9_-]{22}$/)
    expect(a.topic).not.toBe(c.topic)
    expect(a.key).not.toBe(c.key)
  })

  it('makes QR channels with 128-bit topics and 256-bit keys, and 6-digit codes', () => {
    const ch = newPairChannel()
    expect(ch.topic).toMatch(/^wp[A-Za-z0-9_-]{22}$/)
    expect(fromB64u(ch.key)).toHaveLength(32)
    expect(newPairCode()).toMatch(/^\d{6}$/)
  })
})
