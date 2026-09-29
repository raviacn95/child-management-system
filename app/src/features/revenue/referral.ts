import { LIVE_SITE } from '../../brand'

const OWN_KEY = 'willow-ref-code-v1'
const FROM_KEY = 'willow-ref-from-v1'
const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
const CODE_RE = /^WIL-[A-HJ-NP-Z2-9]{6}$/

export function isReferralCode(value: unknown): value is string {
  return typeof value === 'string' && CODE_RE.test(value)
}

export function newReferralCode(random: () => number = Math.random) {
  let body = ''
  for (let i = 0; i < 6; i += 1) body += ALPHABET[Math.floor(random() * ALPHABET.length) % ALPHABET.length]
  return `WIL-${body}`
}

function read(key: string) {
  try {
    return localStorage.getItem(key) ?? ''
  } catch {
    return ''
  }
}

function write(key: string, value: string) {
  try {
    localStorage.setItem(key, value)
  } catch {
    /* private mode */
  }
}

export function myReferralCode() {
  const existing = read(OWN_KEY)
  if (isReferralCode(existing)) return existing
  const next = newReferralCode()
  write(OWN_KEY, next)
  return next
}

export function referralFrom() {
  const value = read(FROM_KEY)
  return isReferralCode(value) ? value : ''
}

export function captureReferral(search: string) {
  const code = new URLSearchParams(search).get('ref')?.trim().toUpperCase() ?? ''
  if (!isReferralCode(code) || referralFrom() || code === read(OWN_KEY)) return ''
  write(FROM_KEY, code)
  return code
}

export function inviteUrl(code: string, site = LIVE_SITE) {
  const url = new URL(site)
  if (isReferralCode(code)) url.searchParams.set('ref', code)
  url.hash = '/get-app'
  return url.href
}

export function inviteText(code: string, site = LIVE_SITE) {
  return [
    'We plan our kids’ learning, meals and shopping on Willow — free for families.',
    `Install with my invite link: ${inviteUrl(code, site)}`,
  ].join('\n')
}
