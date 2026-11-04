import { cosine, embed } from '../ai-lab/embed'
import { BRAIN_CATEGORIES, GENIUS_PATH, type BrainCard, type BrainCategory } from './cards'

export type ExplainLevel = 'normal' | 'simple' | 'super'

export function levelForAge(years: number): ExplainLevel {
  if (years < 5) return 'super'
  if (years < 8) return 'simple'
  return 'normal'
}

export function cardText(card: BrainCard, level: ExplainLevel) {
  if (level === 'super') return card.superSimple
  if (level === 'simple') return card.simple
  return card.normal
}

export function dailyCards(cards: BrainCard[], day: string) {
  const shift = [...day].reduce((sum, char) => sum + char.charCodeAt(0), 0)
  return BRAIN_CATEGORIES.flatMap((category) => {
    const rows = cards.filter((card) => card.category === category)
    if (!rows.length) return []
    const start = shift % rows.length
    return [...rows.slice(start), ...rows.slice(0, start)]
  })
}

export function whyChain(card: BrainCard, steps: number) {
  return card.why.slice(0, Math.max(0, steps))
}

export function curiosityFromReads(cards: BrainCard[], ids: string[]) {
  const counts = new Map<BrainCategory, number>()
  for (const id of ids) {
    const found = cards.find((card) => card.id === id)
    if (!found) continue
    counts.set(found.category, (counts.get(found.category) ?? 0) + 1)
  }
  const top = Math.max(1, ...counts.values())
  return BRAIN_CATEGORIES.map((category) => ({
    category,
    score: Math.round(((counts.get(category) ?? 0) / top) * 100),
  })).filter((row) => row.score > 0)
}

function vectorFor(card: BrainCard) {
  return embed(`${card.title} ${card.normal}`)
}

export function similarCards(cards: BrainCard[], openedId: string, k = 3) {
  const selected = cards.find((card) => card.id === openedId)
  if (!selected) return []
  const vector = vectorFor(selected)
  return cards
    .filter((card) => card.id !== openedId)
    .map((card) => ({ card, score: Number(cosine(vector, vectorFor(card)).toFixed(3)) }))
    .sort((a, b) => b.score - a.score || a.card.id.localeCompare(b.card.id))
    .slice(0, k)
}

export function geniusPath(cards: BrainCard[]) {
  return GENIUS_PATH.map((id) => cards.find((card) => card.id === id)).filter((card): card is BrainCard => Boolean(card))
}

export function nextOnPath(cards: BrainCard[], openedIds: string[]) {
  const path = geniusPath(cards)
  return path.find((card) => !openedIds.includes(card.id)) ?? similarCards(cards, openedIds.at(-1) ?? path[0]?.id ?? '', 1)[0]?.card ?? null
}

const STORAGE_KEY = 'willow-brain-reads'

export function readLog(childId: string): string[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    const parsed = raw ? (JSON.parse(raw) as Record<string, unknown>) : {}
    const rows = parsed[childId]
    return Array.isArray(rows) ? rows.filter((id): id is string => typeof id === 'string') : []
  } catch {
    return []
  }
}

export function rememberRead(childId: string, cardId: string) {
  const current = readLog(childId)
  if (!childId || !cardId || current.includes(cardId)) return current
  const next = [...current, cardId]
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    const parsed = raw ? (JSON.parse(raw) as Record<string, string[]>) : {}
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...parsed, [childId]: next }))
  } catch {
    return next
  }
  return next
}
