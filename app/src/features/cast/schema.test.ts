import { describe, expect, it } from 'vitest'
import { cleanName, envelopeSchema, messageSchema } from './schema'

const play = { type: 'play', title: 'Mardaani 3', year: 2026, lang: 'hi', platformId: 'netflix', watchIds: { netflix: '81999999' } }
const from = { id: 'AAAAAAAAAAAAAAAAAAAAAA', name: "Ravi's phone" }

describe('cast messages', () => {
  it('accepts the play, key, ack, status and pairing messages', () => {
    for (const msg of [
      play,
      { type: 'key', key: 'right', times: 3 },
      { type: 'ack', status: 'opening', title: 'Mardaani 3' },
      { type: 'status', screen: 'Movies', focus: 'Drishyam 3' },
      { type: 'hello', pub: 'B'.repeat(87) },
      { type: 'ping' },
      { type: 'bye' },
    ]) {
      expect(messageSchema.safeParse(msg).success, JSON.stringify(msg)).toBe(true)
    }
  })

  it('rejects child data and any field it does not know', () => {
    for (const extra of [{ childName: 'Asha' }, { pin: '1234' }, { email: 'a@b.c' }, { notes: 'allergy' }, { account: 'x' }]) {
      expect(messageSchema.safeParse({ ...play, ...extra }).success).toBe(false)
    }
    expect(messageSchema.safeParse({ ...play, watchIds: { netflix: '81999999', childId: 'c1' } }).success).toBe(false)
  })

  it('rejects malformed IDs, unknown keys and oversized text', () => {
    expect(messageSchema.safeParse({ ...play, watchIds: { netflix: 'abc' } }).success).toBe(false)
    expect(messageSchema.safeParse({ ...play, platformId: 'Net Flix' }).success).toBe(false)
    expect(messageSchema.safeParse({ ...play, title: 'x'.repeat(200) }).success).toBe(false)
    expect(messageSchema.safeParse({ type: 'key', key: 'power' }).success).toBe(false)
    expect(messageSchema.safeParse({ type: 'key', key: 'up', times: 50 }).success).toBe(false)
    expect(messageSchema.safeParse({ type: 'reboot' }).success).toBe(false)
  })

  it('wraps every message in a strict envelope with a timestamp, nonce and short device name', () => {
    const envelope = { v: 1, ts: Date.now(), n: 'abcdefghijklmnop', from, msg: play }
    expect(envelopeSchema.safeParse(envelope).success).toBe(true)
    expect(envelopeSchema.safeParse({ ...envelope, from: { ...from, email: 'x@y.z' } }).success).toBe(false)
    expect(envelopeSchema.safeParse({ ...envelope, extra: 1 }).success).toBe(false)
    expect(envelopeSchema.safeParse({ ...envelope, n: 'short' }).success).toBe(false)
    expect(envelopeSchema.safeParse({ ...envelope, from: { ...from, name: 'x'.repeat(60) } }).success).toBe(false)
  })

  it('cleans device nicknames', () => {
    expect(cleanName("  Ravi's \n phone  ", 'My phone')).toBe("Ravi's phone")
    expect(cleanName('   ', 'My phone')).toBe('My phone')
    expect(cleanName('x'.repeat(50), 'TV')).toHaveLength(32)
  })
})
