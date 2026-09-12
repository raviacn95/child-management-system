const KEY = 'willow-return-v1'
const AWAY_KEY = 'willow-away-v1'
const SCREEN_KEY = 'willow-last-screen'
export const TOKEN_TTL_MS = 5 * 60 * 1000

export type ReturnRecord = {
  token: string
  screen: string
  label: string
  title: string
  expiresAt: number
}

export type AwaySession = ReturnRecord & { url: string; openedAt: number }

function randomToken() {
  const bytes = new Uint8Array(16)
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) crypto.getRandomValues(bytes)
  else for (let i = 0; i < bytes.length; i += 1) bytes[i] = Math.floor(Math.random() * 256)
  return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('')
}

function readBook(): ReturnRecord[] {
  try {
    const raw = sessionStorage.getItem(KEY)
    if (!raw) return []
    return JSON.parse(raw) as ReturnRecord[]
  } catch {
    return []
  }
}

function writeBook(records: ReturnRecord[]) {
  try {
    sessionStorage.setItem(KEY, JSON.stringify(records.filter((r) => r.expiresAt > Date.now())))
  } catch {
    /* private mode */
  }
}

export function rememberScreen(screen: string) {
  if (!screen || screen.startsWith('/return') || screen.startsWith('/playing')) return
  try {
    sessionStorage.setItem(SCREEN_KEY, screen)
  } catch {
    /* private mode */
  }
}

export function lastScreen() {
  try {
    return sessionStorage.getItem(SCREEN_KEY) || '/'
  } catch {
    return '/'
  }
}

export function issueReturnToken(input: { screen: string; label: string; title: string }): ReturnRecord {
  const record: ReturnRecord = {
    token: randomToken(),
    screen: input.screen || lastScreen(),
    label: input.label.slice(0, 80),
    title: input.title.slice(0, 120),
    expiresAt: Date.now() + TOKEN_TTL_MS,
  }
  writeBook([...readBook(), record])
  return record
}

export function peekToken(token: string) {
  const record = readBook().find((item) => item.token === token)
  if (!record || record.expiresAt < Date.now()) return null
  return record
}

export function consumeToken(token: string) {
  const record = peekToken(token)
  writeBook(readBook().filter((item) => item.token !== token))
  return record
}

export function beginAway(record: ReturnRecord, url: string): AwaySession {
  const away: AwaySession = { ...record, url, openedAt: Date.now() }
  try {
    sessionStorage.setItem(AWAY_KEY, JSON.stringify(away))
  } catch {
    /* private mode */
  }
  return away
}

export function currentAway(): AwaySession | null {
  try {
    const raw = sessionStorage.getItem(AWAY_KEY)
    if (!raw) return null
    const away = JSON.parse(raw) as AwaySession
    if (away.expiresAt < Date.now()) {
      clearAway()
      return null
    }
    return away
  } catch {
    return null
  }
}

export function clearAway() {
  try {
    sessionStorage.removeItem(AWAY_KEY)
  } catch {
    /* private mode */
  }
}

export function parseReturnLink(raw: string) {
  try {
    const value = raw.trim()
    if (value.startsWith('willow://')) {
      const url = new URL(value.replace('willow://', 'https://willow.invalid/'))
      return url.searchParams.get('token')
    }
    if (value.includes('#/return')) {
      const hash = value.slice(value.indexOf('#/return') + 1)
      const url = new URL(hash, 'https://willow.invalid')
      return url.searchParams.get('token')
    }
    const url = new URL(value, 'https://willow.invalid')
    return url.searchParams.get('token')
  } catch {
    return null
  }
}

export function callbackHref(token: string) {
  return `#/return?token=${token}`
}

export function willowProtocolHref(token: string) {
  return `willow://callback?token=${token}`
}

export function hasPii(record: ReturnRecord) {
  return /PIN|allerg|@|childId|medical/i.test(`${record.label} ${record.title} ${record.screen} ${record.token}`)
}
