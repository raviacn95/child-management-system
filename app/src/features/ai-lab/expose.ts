import type { MemoryDoc } from './corpus'
import { EMBED_DIM, contentTokens, cosine, embed, textOverlaps } from './embed'
import { searchMemories } from './rag'

export interface EvalCase {
  question: string
  expect: string
}

export function casesFromNotes(memories: MemoryDoc[], childId: string, limit = 4): EvalCase[] {
  const mine = memories
    .filter((memory) => memory.childIds.includes(childId))
    .slice()
    .sort((a, b) => a.date.localeCompare(b.date) || a.id.localeCompare(b.id))
  const seen = new Set<string>()
  const cases: EvalCase[] = []
  for (const memory of mine) {
    const token = contentTokens(memory.text)[0]
    if (!token || token.length < 4 || seen.has(token)) continue
    seen.add(token)
    cases.push({ question: token, expect: memory.text })
    if (cases.length === limit) break
  }
  return cases
}

export function evaluateRetrieval(memories: MemoryDoc[], childId: string, cases: EvalCase[], k = 3) {
  const rows = cases.map((item) => {
    const hits = searchMemories(item.question, memories, childId, k)
    const found = hits.findIndex((hit) => hit.doc.text === item.expect)
    const rank = found === -1 ? null : found + 1
    return { question: item.question, expect: item.expect, top: hits[0]?.doc.text ?? '', rank, pass: rank === 1 }
  })
  const total = rows.length
  return {
    rows,
    hitAt1: total ? rows.filter((row) => row.pass).length / total : 0,
    hitAt3: total ? rows.filter((row) => row.rank !== null).length / total : 0,
  }
}

export interface StoredMemory {
  id: string
  text: string
  vector: number[]
}

export function remember(store: StoredMemory[], text: string): StoredMemory[] {
  const clean = text.trim()
  if (!clean) return store
  return [...store, { id: `mem-${store.length + 1}`, text: clean, vector: embed(clean) }]
}

export function recall(store: StoredMemory[], query: string, k = 3) {
  const asked = query.trim()
  if (!asked || !store.length) return []
  const vector = embed(asked)
  return store
    .map((item) => ({ id: item.id, text: item.text, score: Number(cosine(vector, item.vector).toFixed(3)) }))
    .sort((a, b) => b.score - a.score || a.id.localeCompare(b.id))
    .slice(0, k)
}

export function whyNote(query: string, text: string, score: number) {
  const shared = textOverlaps(query, text)
  if (shared.length) return `Chosen because these words match: ${shared.join(', ')}.`
  if (score > 0.2) return 'No shared words. The hash landed both texts on the same dimensions, so this score is a collision.'
  return 'Few shared dimensions, so this note ranks low.'
}

export function vectorPreview(text: string, dims = 8) {
  const vector = embed(text)
  const values = vector.map((value) => Number(value.toFixed(3)))
  return { dim: vector.length || EMBED_DIM, head: values.slice(0, dims), values }
}

export function compareEmbedderScores(hitAt1: number, hitAt3: number) {
  return [
    { id: 'feature-hash', label: 'Feature hash', ran: true, hitAt1, hitAt3 },
    { id: 'future', label: 'Future API embedding', ran: false, hitAt1: null as number | null, hitAt3: null as number | null },
  ]
}
