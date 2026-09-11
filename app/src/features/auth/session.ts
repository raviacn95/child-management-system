import type { Role } from '../../types'

export interface SessionPayload {
  sub: string
  role: Role
  email: string
  iat: number
  exp: number
}

const KEY = 'willow-session'

export function issueSession(user: { id: string; role: Role; email: string }) {
  const payload: SessionPayload = {
    sub: user.id,
    role: user.role,
    email: user.email,
    iat: Date.now(),
    exp: Date.now() + 8 * 60 * 60 * 1000,
  }
  sessionStorage.setItem(KEY, btoa(JSON.stringify(payload)))
  return payload
}

export function clearSession() {
  sessionStorage.removeItem(KEY)
}

export function readSession(): SessionPayload | null {
  const raw = sessionStorage.getItem(KEY)
  if (!raw) return null
  try {
    const payload = JSON.parse(atob(raw)) as SessionPayload
    if (!payload.exp || payload.exp < Date.now()) {
      clearSession()
      return null
    }
    return payload
  } catch {
    return null
  }
}
