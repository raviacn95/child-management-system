import type { Channel } from './channel'

/** Free Google STUN; no TURN, so a direct link only forms when the phone and TV can reach each other. */
export const ICE_SERVERS: RTCIceServer[] = [{ urls: 'stun:stun.l.google.com:19302' }]
const GATHER_MS = 2500
const OPEN_TIMEOUT_MS = 10_000

export type DirectLink = { close: () => void }

export function rtcSupported() {
  return typeof RTCPeerConnection === 'function'
}

/** Whole SDP in one relay message (no trickle ICE), so signaling costs two messages. */
function gatheredSdp(pc: RTCPeerConnection) {
  return new Promise<string>((resolve) => {
    const done = () => resolve(pc.localDescription?.sdp ?? '')
    if (pc.iceGatheringState === 'complete') return done()
    const timer = setTimeout(done, GATHER_MS)
    pc.addEventListener('icegatheringstatechange', () => {
      if (pc.iceGatheringState !== 'complete') return
      clearTimeout(timer)
      done()
    })
  })
}

function wire(channel: Channel, dc: RTCDataChannel, onState: (up: boolean) => void) {
  dc.onopen = () => {
    channel.setDirect((text) => {
      if (dc.readyState !== 'open') return false
      try {
        dc.send(text)
        return true
      } catch {
        return false
      }
    })
    onState(true)
  }
  dc.onmessage = (event: MessageEvent) => {
    if (typeof event.data === 'string') void channel.receive(event.data)
  }
  dc.onclose = () => {
    channel.setDirect(null)
    onState(false)
  }
}

function linkFor(channel: Channel, pc: RTCPeerConnection, onState: (up: boolean) => void, cleanup: () => void = () => undefined) {
  let closed = false
  const close = () => {
    if (closed) return
    closed = true
    clearTimeout(timer)
    cleanup()
    channel.setDirect(null)
    pc.close()
    onState(false)
  }
  const timer = setTimeout(() => {
    if (!channel.isDirect()) close()
  }, OPEN_TIMEOUT_MS)
  pc.addEventListener('connectionstatechange', () => {
    if (pc.connectionState === 'failed' || pc.connectionState === 'closed') close()
  })
  return { close }
}

/** Phone side. Any failure leaves the relay path in charge. */
export async function offerDirect(channel: Channel, onState: (up: boolean) => void): Promise<DirectLink | null> {
  if (!rtcSupported()) return null
  const pc = new RTCPeerConnection({ iceServers: ICE_SERVERS })
  const dc = pc.createDataChannel('willow', { ordered: true })
  wire(channel, dc, onState)
  const stop = channel.listen((msg) => {
    if (msg.type !== 'rtc-answer' || pc.currentRemoteDescription) return
    pc.setRemoteDescription({ type: 'answer', sdp: msg.sdp }).catch(() => link.close())
  })
  const link = linkFor(channel, pc, onState, stop)
  try {
    await pc.setLocalDescription(await pc.createOffer())
    await channel.send({ type: 'rtc-offer', sdp: await gatheredSdp(pc) })
    return link
  } catch {
    link.close()
    return null
  }
}

/** TV side: answers an offer that arrived on an approved phone's channel. */
export async function answerDirect(channel: Channel, sdp: string, onState: (up: boolean) => void): Promise<DirectLink | null> {
  if (!rtcSupported()) return null
  const pc = new RTCPeerConnection({ iceServers: ICE_SERVERS })
  pc.ondatachannel = (event) => wire(channel, event.channel, onState)
  const link = linkFor(channel, pc, onState)
  try {
    await pc.setRemoteDescription({ type: 'offer', sdp })
    await pc.setLocalDescription(await pc.createAnswer())
    await channel.send({ type: 'rtc-answer', sdp: await gatheredSdp(pc) })
    return link
  } catch {
    link.close()
    return null
  }
}
