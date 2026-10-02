// @vitest-environment node
import { describe, expect, it } from 'vitest'
import { openChannel } from './channel'
import { codeChannel, newPairChannel } from './crypto'
import { pairingUrl, parsePairingCode, phonePair, tvPairing, type PairRequest } from './pairing'
import { requestPlay } from './playRequest'
import { memoryRelay } from './transport'

const phone = { id: 'PPPPPPPPPPPPPPPPPPPPPP', name: "Ravi's phone" }
const tv = { id: 'TTTTTTTTTTTTTTTTTTTTTT', name: 'Living room TV' }

describe('pairing link', () => {
  it('builds a /#/link URL on the app’s own base and parses it back', () => {
    const ch = newPairChannel()
    const url = pairingUrl('https://raviacn95.github.io/child-management-system/#/tv-link', ch)
    expect(url).toMatch(/^https:\/\/raviacn95\.github\.io\/child-management-system\/#\/link\?c=[A-Za-z0-9_-]{22}\.[A-Za-z0-9_-]{43}$/)
    const c = new URLSearchParams(url.split('?')[1]).get('c')
    expect(parsePairingCode(c)).toEqual(ch)
    expect(pairingUrl('http://127.0.0.1:5173/#/tv-link', ch)).toMatch(/^http:\/\/127\.0\.0\.1:5173\/#\/link\?c=/)
  })

  it('rejects malformed pairing codes', () => {
    for (const bad of [null, '', 'abc.def', `${'a'.repeat(22)}.${'b'.repeat(42)}`, `${'a'.repeat(22)}.${'b'.repeat(42)}!`]) {
      expect(parsePairingCode(bad)).toBeNull()
    }
  })
})

async function pairOver(spec: { topic: string; key: string }, decide: (req: PairRequest) => Promise<unknown>) {
  const relay = memoryRelay()
  const tvChannel = openChannel({ ...spec, self: tv, transport: relay(spec.topic) })
  const phoneChannel = openChannel({ ...spec, self: phone, transport: relay(spec.topic) })
  const seen: { tvSas?: string; phoneSas?: string; phoneRecord?: unknown } = {}
  const stop = tvPairing(tvChannel, (req) => {
    seen.tvSas = req.sas
    void decide(req).then((record) => (seen.phoneRecord = record))
  })
  try {
    const linked = await phonePair(phoneChannel, phone, {
      onSas: (sas) => (seen.phoneSas = sas),
      offerTimeoutMs: 2000,
      approveTimeoutMs: 2000,
    })
    return { linked, seen, relay }
  } finally {
    stop()
    tvChannel.close()
    phoneChannel.close()
  }
}

describe('ECDH pairing over a relay', () => {
  it('pairs through the QR channel after the TV approves, with matching codes on both screens', async () => {
    const { linked, seen } = await pairOver(newPairChannel(), (req) => req.approve())
    expect(seen.tvSas).toMatch(/^\d{4}$/)
    expect(seen.phoneSas).toBe(seen.tvSas)
    expect(linked).toMatchObject({ tvId: tv.id, name: 'Living room TV' })
    expect(seen.phoneRecord).toMatchObject({ id: phone.id, name: "Ravi's phone", topic: linked.id, key: linked.key })
  })

  it('pairs through a 6-digit code channel', async () => {
    const { linked, seen } = await pairOver(await codeChannel('482193'), (req) => req.approve())
    expect(seen.phoneSas).toBe(seen.tvSas)
    expect(linked.id).toMatch(/^wl/)
  })

  it('reports a denial', async () => {
    await expect(pairOver(newPairChannel(), (req) => req.deny())).rejects.toMatchObject({ code: 'denied' })
  })

  it('gives up when no TV answers', async () => {
    const spec = newPairChannel()
    const channel = openChannel({ ...spec, self: phone, transport: memoryRelay()(spec.topic) })
    await expect(phonePair(channel, phone, { offerTimeoutMs: 50 })).rejects.toMatchObject({ code: 'no-answer' })
    channel.close()
  })

  it('carries an encrypted play request on the paired session and returns the TV ack', async () => {
    const { linked, relay } = await pairOver(newPairChannel(), (req) => req.approve())
    const tvSide = openChannel({ topic: linked.id, key: linked.key, self: tv, peerId: phone.id, transport: relay(linked.id) })
    const phoneSide = openChannel({ topic: linked.id, key: linked.key, self: phone, peerId: tv.id, transport: relay(linked.id) })
    const got: unknown[] = []
    tvSide.listen((msg, from) => {
      got.push({ msg, from })
      if (msg.type === 'play') void tvSide.send({ type: 'ack', status: 'opening', title: msg.title })
    })
    const result = await requestPlay(phoneSide, { type: 'play', title: 'Mardaani 3', platformId: 'netflix' }, 2000)
    expect(result).toBe('opening')
    expect(got).toEqual([{ msg: { type: 'play', title: 'Mardaani 3', platformId: 'netflix' }, from: phone }])
    tvSide.close()
    phoneSide.close()
  })
})
