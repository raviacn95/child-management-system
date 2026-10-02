import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { Channel } from './channel'
import type { LinkedPhone } from './pairing'
import { createReceiver, LAUNCH_DELAY_MS } from './receiver'
import type { CastMessage, Device } from './schema'
import { linkedPhones, savePhone } from './store'

const tv: Device = { id: 'TTTTTTTTTTTTTTTTTTTTTT', name: 'Living room TV' }
const phoneDevice: Device = { id: 'PPPPPPPPPPPPPPPPPPPPPP', name: "Ravi's phone" }
const phone: LinkedPhone = { id: phoneDevice.id, name: phoneDevice.name, topic: 'wlAAAAAAAAAAAAAAAAAAAAAA', key: 'k'.repeat(43), addedAt: 1 }

function fakeChannel() {
  const sent: CastMessage[] = []
  let handler: ((msg: CastMessage, from: Device) => void) | null = null
  const channel: Channel = {
    topic: phone.topic,
    send: async (msg) => void sent.push(msg),
    listen: (next) => ((handler = next), () => (handler = null)),
    ready: async () => undefined,
    receive: async () => undefined,
    setDirect: () => undefined,
    isDirect: () => false,
    close: () => (handler = null),
  }
  return { channel, sent, deliver: (msg: CastMessage) => handler?.(msg, phoneDevice), listening: () => handler !== null }
}

function setup() {
  const fake = fakeChannel()
  const deps = {
    self: tv,
    pathname: () => '/hub',
    navigate: vi.fn(),
    openWatch: vi.fn(),
    showToast: vi.fn(),
    channelFor: () => fake.channel,
  }
  const receiver = createReceiver(deps)
  receiver.sync([phone])
  return { ...fake, deps, receiver }
}

describe('TV receiver', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.useFakeTimers()
  })
  afterEach(() => vi.useRealTimers())

  it('shows a toast, acks and opens the official link after a short delay', () => {
    const { deliver, sent, deps } = setup()
    deliver({ type: 'play', title: 'Drishyam 3', year: 2026, lang: 'hi', platformId: 'netflix' })
    expect(deps.showToast).toHaveBeenCalledWith("Opening Drishyam 3 on Netflix… (from Ravi's phone)")
    expect(sent).toEqual([{ type: 'ack', status: 'opening', title: 'Drishyam 3' }])
    expect(deps.openWatch).not.toHaveBeenCalled()
    vi.advanceTimersByTime(LAUNCH_DELAY_MS)
    expect(deps.openWatch).toHaveBeenCalledTimes(1)
    const session = deps.openWatch.mock.calls[0][0]
    expect(session).toMatchObject({ title: 'Drishyam 3', platformName: 'Netflix' })
    expect(session.url).toMatch(/^intent:\/\/www\.netflix\.com\/search\?q=Drishyam/)
    expect(session.url).toContain('S.browser_fallback_url=https%3A%2F%2Fwww.netflix.com')
  })

  it('acks failed for a platform Willow does not know', () => {
    const { deliver, sent, deps } = setup()
    deliver({ type: 'play', title: 'Drishyam 3', platformId: 'pirate-box' })
    vi.advanceTimersByTime(LAUNCH_DELAY_MS)
    expect(sent).toEqual([{ type: 'ack', status: 'failed', title: 'Drishyam 3' }])
    expect(deps.showToast).not.toHaveBeenCalled()
    expect(deps.openWatch).not.toHaveBeenCalled()
  })

  it('maps remote keys onto TV navigation', () => {
    const { deliver, deps } = setup()
    document.body.innerHTML = '<button data-tv-focus="1" id="a">A</button>'
    const clicked = vi.fn()
    document.getElementById('a')!.addEventListener('click', clicked)
    document.getElementById('a')!.focus()
    deliver({ type: 'key', key: 'ok' })
    deliver({ type: 'key', key: 'home' })
    expect(clicked).toHaveBeenCalledTimes(1)
    expect(deps.navigate).toHaveBeenCalledWith('/hub')
  })

  it('answers a ping with the current screen', () => {
    const { deliver, sent } = setup()
    deliver({ type: 'ping' })
    vi.advanceTimersByTime(200)
    expect(sent).toEqual([expect.objectContaining({ type: 'status', screen: 'Home' })])
  })

  it('forgets a phone that says bye and stops listening when it is removed', () => {
    savePhone(phone)
    const { deliver, receiver, listening } = setup()
    deliver({ type: 'bye' })
    expect(linkedPhones()).toEqual([])
    receiver.sync([])
    expect(listening()).toBe(false)
  })
})
