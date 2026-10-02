// @vitest-environment node
import { describe, expect, it } from 'vitest'
import { openChannel } from './channel'
import { importAesKey, newPairChannel, seal } from './crypto'
import { memoryRelay, type Transport } from './transport'

const a = { id: 'AAAAAAAAAAAAAAAAAAAAAA', name: 'Phone' }
const b = { id: 'BBBBBBBBBBBBBBBBBBBBBB', name: 'TV' }
const tick = () => new Promise((resolve) => setTimeout(resolve, 5))

function recordingTransport(inner: Transport) {
  const sent: string[] = []
  return {
    sent,
    transport: { publish: (body: string) => (sent.push(body), inner.publish(body)), subscribe: inner.subscribe } satisfies Transport,
  }
}

describe('encrypted channel', () => {
  it('delivers to the peer, ignores its own echo and never puts plaintext on the relay', async () => {
    const spec = newPairChannel()
    const relay = memoryRelay()
    const rec = recordingTransport(relay(spec.topic))
    const left = openChannel({ ...spec, self: a, transport: rec.transport })
    const right = openChannel({ ...spec, self: b, transport: relay(spec.topic) })
    const leftGot: string[] = []
    const rightGot: string[] = []
    left.listen((msg) => leftGot.push(msg.type))
    right.listen((msg) => rightGot.push(msg.type))
    await left.send({ type: 'ping' })
    await tick()
    expect(rightGot).toEqual(['ping'])
    expect(leftGot).toEqual([])
    expect(rec.sent[0]).toMatch(/^w1\./)
    expect(rec.sent[0]).not.toContain('ping')
  })

  it('drops replayed, stale and wrong-sender messages', async () => {
    const spec = newPairChannel()
    const relay = memoryRelay()
    const rec = recordingTransport(relay(spec.topic))
    const sender = openChannel({ ...spec, self: a, transport: rec.transport })
    const got: string[] = []
    const receiver = openChannel({ ...spec, self: b, peerId: a.id, transport: relay(spec.topic) })
    receiver.listen((msg) => got.push(msg.type))
    await sender.send({ type: 'ping' })
    await tick()
    await receiver.receive(rec.sent[0])
    const key = await importAesKey(spec.key)
    const stale = await seal(key, spec.topic, { v: 1, ts: Date.now() - 120_000, n: 'abcdefghijklmnop', from: a, msg: { type: 'ping' } })
    const impostor = await seal(key, spec.topic, { v: 1, ts: Date.now(), n: 'bcdefghijklmnopq', from: { id: 'CCCCCCCCCCCCCCCCCCCCCC', name: 'X' }, msg: { type: 'ping' } })
    await receiver.receive(stale)
    await receiver.receive(impostor)
    expect(got).toEqual(['ping'])
  })

  it('refuses to send fields the schema does not allow', async () => {
    const spec = newPairChannel()
    const channel = openChannel({ ...spec, self: a, transport: memoryRelay()(spec.topic) })
    await expect(channel.send({ type: 'ping', childName: 'Asha' } as never)).rejects.toThrow()
  })

  it('prefers a direct link when one is up and falls back to the relay', async () => {
    const spec = newPairChannel()
    const rec = recordingTransport(memoryRelay()(spec.topic))
    const channel = openChannel({ ...spec, self: a, transport: rec.transport })
    const direct: string[] = []
    channel.setDirect((text) => (direct.push(text), true))
    await channel.send({ type: 'key', key: 'up' })
    channel.setDirect(null)
    await channel.send({ type: 'key', key: 'down' })
    expect(direct).toHaveLength(1)
    expect(rec.sent).toHaveLength(1)
    expect(channel.isDirect()).toBe(false)
  })
})
