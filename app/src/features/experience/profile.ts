import type { LookId } from '../../theme/looks'
import { isLookId, migrateLook } from '../../theme/looks'

export type AccentId = 'pine' | 'gold' | 'ocean' | 'clay'
export type AchievementId = 'hub' | 'look' | 'search' | 'together' | 'digest' | 'resume'

export type ResumeCard = {
  id: string
  kind: 'movie' | 'learning' | 'parent' | 'page'
  title: string
  href: string
  at: number
}

export type ExperienceProfile = {
  look: LookId
  accent: AccentId
  largeText: boolean
  highContrast: boolean
  watchTogether: boolean
  pin: string
  locked: boolean
  resume: ResumeCard[]
  achievements: AchievementId[]
}

const KEY = 'willow-experience-v1'

const EMPTY: ExperienceProfile = {
  look: 'grove',
  accent: 'pine',
  largeText: false,
  highContrast: false,
  watchTogether: false,
  pin: '',
  locked: false,
  resume: [],
  achievements: [],
}

type Book = Record<string, ExperienceProfile>

function readBook(): Book {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return {}
    return JSON.parse(raw) as Book
  } catch {
    return {}
  }
}

function writeBook(book: Book) {
  try {
    localStorage.setItem(KEY, JSON.stringify(book))
  } catch {
    /* private mode */
  }
}

export function defaultProfile(fireTv = false): ExperienceProfile {
  return { ...EMPTY, look: migrateLook(null, fireTv), resume: [], achievements: [] }
}

export function hasProfile(userId: string) {
  return Boolean(readBook()[userId])
}

export function hashPin(pin: string) {
  let hash = 2166136261
  const salted = `willow-lock:${pin}`
  for (let i = 0; i < salted.length; i += 1) {
    hash ^= salted.charCodeAt(i)
    hash = Math.imul(hash, 16777619)
  }
  return (hash >>> 0).toString(16)
}

export function pinsMatch(plain: string, hashed: string) {
  return hashed.length > 0 && hashPin(plain) === hashed
}

export function readProfile(userId: string, fireTv = false): ExperienceProfile {
  const saved = readBook()[userId]
  if (!saved) return defaultProfile(fireTv)
  return {
    ...EMPTY,
    ...saved,
    look: isLookId(saved.look) ? saved.look : defaultProfile(fireTv).look,
    resume: Array.isArray(saved.resume) ? saved.resume.slice(0, 8) : [],
    achievements: Array.isArray(saved.achievements) ? saved.achievements : [],
  }
}

export function writeProfile(userId: string, patch: Partial<ExperienceProfile>) {
  const book = readBook()
  const next = { ...readProfile(userId), ...patch }
  book[userId] = next
  writeBook(book)
  return next
}

export function pushResume(userId: string, card: ResumeCard) {
  const profile = readProfile(userId)
  const resume = [card, ...profile.resume.filter((item) => item.id !== card.id)].slice(0, 8)
  return writeProfile(userId, { resume })
}

export function unlockAchievement(userId: string, id: AchievementId) {
  const profile = readProfile(userId)
  if (profile.achievements.includes(id)) return profile
  return writeProfile(userId, { achievements: [...profile.achievements, id] })
}

export function applyChrome(profile: ExperienceProfile) {
  if (typeof document === 'undefined') return
  const root = document.documentElement
  root.dataset.a11y = profile.highContrast ? 'contrast' : '0'
  root.dataset.type = profile.largeText ? 'large' : '0'
  root.dataset.accent = profile.accent
}
