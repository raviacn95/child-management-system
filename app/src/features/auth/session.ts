import type { Role } from '../../types'

export interface SessionPayload {
  sub: string
  role: Role
  email?: string
  iat: number
  exp: number
  persist: boolean
}

const SESSION_KEY = 'willow-session'
const LAST_EMAIL_KEY = 'willow-last-email'
const NINETY_DAYS = 90 * 24 * 60 * 60 * 1000
const EIGHT_HOURS = 8 * 60 * 60 * 1000

function write(storage: Storage, payload: SessionPayload) {
  storage.setItem(SESSION_KEY, btoa(JSON.stringify(payload)))
}

export function issueSession(
  user: { id: string; role: Role; email: string },
  opts: { persist?: boolean } = {},
) {
  const persist = opts.persist !== false
  const payload: SessionPayload = {
    sub: user.id,
    role: user.role,
    iat: Date.now(),
    exp: Date.now() + (persist ? NINETY_DAYS : EIGHT_HOURS),
    persist,
  }
  try {
    sessionStorage.setItem(SESSION_KEY, btoa(JSON.stringify(payload)))
    if (persist) {
      write(localStorage, payload)
      localStorage.setItem(LAST_EMAIL_KEY, user.email)
    } else {
      localStorage.removeItem(SESSION_KEY)
    }
  } catch {
    /* private mode */
  }
  return payload
}

export function clearSession() {
  try {
    localStorage.removeItem(SESSION_KEY)
    sessionStorage.removeItem(SESSION_KEY)
    localStorage.removeItem(LAST_EMAIL_KEY)
  } catch {
    /* ignore */
  }
}

function parse(raw: string | null): SessionPayload | null {
  if (!raw) return null
  try {
    const payload = JSON.parse(atob(raw)) as SessionPayload
    if (!payload.exp || payload.exp < Date.now()) return null
    return payload
  } catch {
    return null
  }
}

export function readSession(): SessionPayload | null {
  try {
    const lasting = parse(localStorage.getItem(SESSION_KEY))
    if (lasting) return lasting
    const tab = parse(sessionStorage.getItem(SESSION_KEY))
    if (tab) return tab
  } catch {
    /* ignore */
  }
  return null
}

export function readLastEmail() {
  try {
    return localStorage.getItem(LAST_EMAIL_KEY) ?? ''
  } catch {
    return ''
  }
}
