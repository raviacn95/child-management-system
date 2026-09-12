import { LIVE_SITE, shareCopy } from '../../brand'

export const SHARE_CHANNELS = [
  { id: 'whatsapp', label: 'WhatsApp' },
  { id: 'facebook', label: 'Facebook' },
  { id: 'x', label: 'X' },
  { id: 'telegram', label: 'Telegram' },
  { id: 'email', label: 'Email' },
  { id: 'copy', label: 'Copy link' },
] as const

export type ShareChannelId = (typeof SHARE_CHANNELS)[number]['id']

export function sharePayload(url = LIVE_SITE) {
  const text = shareCopy(url)
  return { url, text, title: 'Willow™' }
}

export function shareHref(channel: ShareChannelId, url = LIVE_SITE) {
  const { text } = sharePayload(url)
  const encodedUrl = encodeURIComponent(url)
  const encodedText = encodeURIComponent(text)
  if (channel === 'whatsapp') return `https://wa.me/?text=${encodedText}`
  if (channel === 'facebook') return `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`
  if (channel === 'x') return `https://twitter.com/intent/tweet?text=${encodedText}`
  if (channel === 'telegram') return `https://t.me/share/url?url=${encodedUrl}&text=${encodedText}`
  if (channel === 'email') return `mailto:?subject=${encodeURIComponent('Willow™')}&body=${encodedText}`
  return url
}

export async function copyShareLink(url = LIVE_SITE) {
  const { text } = sharePayload(url)
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(text)
    return
  }
  throw new Error('Clipboard unavailable')
}

export async function nativeShare(url = LIVE_SITE) {
  const payload = sharePayload(url)
  if (!navigator.share) return false
  await navigator.share({ title: payload.title, text: payload.text, url: payload.url })
  return true
}
