import { platforms } from '../movies/catalog'
import { asMovieLang } from '../movies/fresh'
import { fireTvIntent } from '../ott/fireTv'
import { openPlan } from '../ott/openPlan'
import { clearAway, lastScreen } from '../ott/returnSession'
import { currentOpenEnv } from '../ott/watchDesk'
import type { WatchSession } from '../ott/WatchPane'
import { openChannel, type Channel } from './channel'
import type { LinkedPhone } from './pairing'
import { runRemoteKey } from './remoteKeys'
import { answerDirect, type DirectLink } from './rtc'
import type { CastMessage, Device, PlayMessage } from './schema'
import { tvStatus } from './screenStatus'
import { removePhone } from './store'

export const LAUNCH_DELAY_MS = 2000
const REMOTE_SESSION_MS = 2 * 60_000
const STATUS_RELAY_GAP_MS = 2500
const STATUS_DIRECT_GAP_MS = 150

export type ReceiverDeps = {
  self: Device
  pathname: () => string
  navigate: (to: string) => void
  openWatch: (session: WatchSession) => void
  showToast: (text: string) => void
  channelFor?: (phone: LinkedPhone, self: Device) => Channel
}

type Peer = {
  phone: LinkedPhone
  channel: Channel
  link: DirectLink | null
  activeUntil: number
  lastStatus: string
  lastSentAt: number
  timer?: ReturnType<typeof setTimeout>
}

const peerKey = (phone: LinkedPhone) => `${phone.id}:${phone.topic}`
const ignore = () => undefined

/** TV side: one encrypted channel per approved phone, live while Willow is on screen in TV mode. */
export function createReceiver(deps: ReceiverDeps) {
  const peers = new Map<string, Peer>()
  let launchTimer: ReturnType<typeof setTimeout> | undefined
  const channelFor =
    deps.channelFor ?? ((phone: LinkedPhone, self: Device) => openChannel({ topic: phone.topic, key: phone.key, self, peerId: phone.id }))

  function queueStatus(peer: Peer, force = false) {
    if (!force && Date.now() > peer.activeUntil) return
    clearTimeout(peer.timer)
    const gap = peer.channel.isDirect() ? STATUS_DIRECT_GAP_MS : STATUS_RELAY_GAP_MS
    peer.timer = setTimeout(
      () => {
        const status = tvStatus(deps.pathname(), document.activeElement)
        const text = JSON.stringify(status)
        if (text === peer.lastStatus && !force) return
        peer.lastStatus = text
        peer.lastSentAt = Date.now()
        peer.channel.send(status).catch(ignore)
      },
      Math.max(150, peer.lastSentAt + gap - Date.now()),
    )
  }

  function launch(peer: Peer, msg: PlayMessage, from: Device) {
    const platform = platforms.find((p) => p.id === msg.platformId)
    const lang = msg.lang ? asMovieLang(msg.lang) : undefined
    const url = platform ? fireTvIntent(msg.platformId, msg.title, msg.year, lang, msg.watchIds) : ''
    if (!platform || !url || !openPlan({ url, ...currentOpenEnv() })) {
      peer.channel.send({ type: 'ack', status: 'failed', title: msg.title }).catch(ignore)
      return
    }
    deps.showToast(`Opening ${msg.title} on ${platform.name}… (from ${from.name})`)
    peer.channel.send({ type: 'ack', status: 'opening', title: msg.title }).catch(ignore)
    clearTimeout(launchTimer)
    launchTimer = setTimeout(() => deps.openWatch({ url, title: msg.title, platformName: platform.name }), LAUNCH_DELAY_MS)
  }

  function handle(peer: Peer, msg: CastMessage, from: Device) {
    switch (msg.type) {
      case 'play':
        launch(peer, msg, from)
        return
      case 'key':
        peer.activeUntil = Date.now() + REMOTE_SESSION_MS
        runRemoteKey(msg.key, msg.times ?? 1, {
          navigate: deps.navigate,
          back: () => window.history.back(),
          returnToWillow: () => {
            clearAway()
            window.dispatchEvent(new Event('willow-return'))
            const screen = lastScreen()
            deps.navigate(screen === '/' ? '/hub' : screen)
          },
        })
        queueStatus(peer)
        return
      case 'ping':
        peer.activeUntil = Date.now() + REMOTE_SESSION_MS
        queueStatus(peer, true)
        return
      case 'rtc-offer':
        peer.link?.close()
        peer.link = null
        void answerDirect(peer.channel, msg.sdp, () => queueStatus(peer, true)).then((link) => (peer.link = link))
        return
      case 'bye':
        removePhone(peer.phone.id)
        return
      default:
        return
    }
  }

  function drop(key: string) {
    const peer = peers.get(key)
    if (!peer) return
    clearTimeout(peer.timer)
    peer.link?.close()
    peer.channel.close()
    peers.delete(key)
  }

  return {
    sync(phones: readonly LinkedPhone[]) {
      const wanted = new Map(phones.map((phone) => [peerKey(phone), phone]))
      for (const key of [...peers.keys()]) if (!wanted.has(key)) drop(key)
      for (const [key, phone] of wanted) {
        if (peers.has(key)) continue
        const peer: Peer = { phone, channel: channelFor(phone, deps.self), link: null, activeUntil: 0, lastStatus: '', lastSentAt: 0 }
        peers.set(key, peer)
        peer.channel.listen((msg, from) => handle(peer, msg, from))
      }
    },
    refresh() {
      for (const peer of peers.values()) queueStatus(peer)
    },
    dispose() {
      clearTimeout(launchTimer)
      for (const key of [...peers.keys()]) drop(key)
    },
  }
}
