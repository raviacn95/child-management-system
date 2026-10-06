import { env } from '../env'

const CONSENT_KEY = 'willow-analytics-consent-v1'
const INSTALL_KEY = 'willow-analytics-install-v1'
const SESSION_KEY = 'willow-analytics-session-v1'

type Consent = 'granted' | 'denied' | null

type AnalyticsEvent = {
  event: string
  at: string
  installationId: string
  sessionId: string
  path: string
}

function readConsent(): Consent {
  try {
    const value = localStorage.getItem(CONSENT_KEY)
    return value === 'granted' || value === 'denied' ? value : null
  } catch {
    return null
  }
}

function randomId() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID()
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`
}

function idFor(key: string) {
  try {
    const existing = localStorage.getItem(key)
    if (existing) return existing
    const next = randomId()
    localStorage.setItem(key, next)
    return next
  } catch {
    return randomId()
  }
}

function sessionId() {
  try {
    const existing = sessionStorage.getItem(SESSION_KEY)
    if (existing) return existing
    const next = randomId()
    sessionStorage.setItem(SESSION_KEY, next)
    return next
  } catch {
    return randomId()
  }
}

export function analyticsConsent(): Consent {
  return readConsent()
}

export function setAnalyticsConsent(consent: Exclude<Consent, null>) {
  try {
    localStorage.setItem(CONSENT_KEY, consent)
    if (consent === 'denied') localStorage.removeItem(INSTALL_KEY)
  } catch {
    /* private mode */
  }
}

export function track(event: string, path = typeof window === 'undefined' ? '/' : window.location.pathname) {
  if (readConsent() !== 'granted' || !env.VITE_ANALYTICS_ENDPOINT || typeof window === 'undefined') return
  const payload: AnalyticsEvent = {
    event: event.slice(0, 64),
    at: new Date().toISOString(),
    installationId: idFor(INSTALL_KEY),
    sessionId: sessionId(),
    path: path.split('?')[0].slice(0, 120),
  }
  void fetch(env.VITE_ANALYTICS_ENDPOINT, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(payload),
    keepalive: true,
    credentials: 'omit',
  }).catch(() => undefined)
}