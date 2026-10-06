import type { AppState } from '../../types'

/** Same rule as the server's PRIVATE check in supabase/functions/willow-agent/agent.mts. */
const PRIVATE =
  /@[a-z0-9.-]+\.[a-z]{2,}|\+?\(?\d[\d\s().-]{7,}\d|\b\d{5,6}\b|\b(?!19\d\d|20\d\d)\d{4}\b|allerg|medical|medicat|diagnos|prescri|date of birth|\bdob\b|birthday|password|passcode|\botp\b|aadhaar|passport/i
const MIN_NAME = 3

/** First and last names of children and users on this device, lowercased, for blocking before any AI call. */
export function rosterNames(state: Pick<AppState, 'children' | 'users'>) {
  const parts = [
    ...state.children.flatMap((c) => [c.firstName, c.lastName]),
    ...state.users.flatMap((u) => u.name.split(/\s+/)),
  ]
  return [...new Set(parts.map((p) => p.trim().toLowerCase()).filter((p) => p.length >= MIN_NAME && /^\p{L}+$/u.test(p)))]
}

export function privateReason(text: string, names: readonly string[]): 'details' | 'name' | null {
  if (PRIVATE.test(text)) return 'details'
  const words = new Set(text.toLowerCase().split(/[^\p{L}]+/u))
  return names.some((name) => words.has(name)) ? 'name' : null
}
