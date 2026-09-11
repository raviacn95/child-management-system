export type RealtimeEvent = { type: string; payload: unknown; at: string }

const NAME = 'willow-realtime'

export function initRealtime() {
  if (typeof BroadcastChannel === 'undefined') return
  const channel = new BroadcastChannel(NAME)
  channel.onmessage = (event: MessageEvent<RealtimeEvent>) => {
    window.dispatchEvent(new CustomEvent('willow:realtime', { detail: event.data }))
  }
}

export function publishRealtime(type: string, payload: unknown) {
  if (typeof BroadcastChannel === 'undefined') return
  const event: RealtimeEvent = { type, payload, at: new Date().toISOString() }
  const channel = new BroadcastChannel(NAME)
  channel.postMessage(event)
  channel.close()
}
