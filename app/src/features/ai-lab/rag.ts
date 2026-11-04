import type { MemoryDoc } from './corpus'
import { cosine, embed, textOverlaps } from './embed'
import { skillsIn } from './enrich'

export interface Citation {
  id: string
  date: string
  text: string
  score: number
}

export interface GroundedAnswer {
  answer: string
  citations: Citation[]
  caution: string
}

const CAUTION = 'Answer uses retrieved notes only. If a note is missing, the answer says so.'

function cite(rows: { doc: MemoryDoc; score: number }[]): Citation[] {
  return rows.slice(0, 4).map((row) => ({
    id: row.doc.id,
    date: row.doc.date,
    text: row.doc.text,
    score: Number(row.score.toFixed(3)),
  }))
}

export function searchMemories(query: string, memories: MemoryDoc[], childId: string, k = 6) {
  const vector = embed(query)
  return memories
    .filter((memory) => memory.childIds.includes(childId))
    .map((doc) => ({ doc, score: cosine(vector, doc.vector) }))
    .sort((a, b) => b.score - a.score || a.doc.date.localeCompare(b.doc.date))
    .slice(0, k)
}

function forChild(memories: MemoryDoc[], childId: string) {
  return memories.filter((memory) => memory.childIds.includes(childId))
}

export function confidenceChain(memories: MemoryDoc[], childId: string, name: string): GroundedAnswer {
  const rows = forChild(memories, childId)
    .filter((memory) => memory.skills.includes('confidence') || skillsIn(memory.text).includes('confidence'))
    .sort((a, b) => a.date.localeCompare(b.date) || a.id.localeCompare(b.id))
  if (!rows.length) {
    return {
      answer: `No confidence-linked notes for ${name} yet.`,
      citations: [],
      caution: 'This traces notes. It does not measure confidence.',
    }
  }
  const steps = rows.map((memory) => `${memory.date}: ${memory.text}`)
  return {
    answer: `Notes that line up with confidence for ${name}, oldest first. ${steps.join(' → ')}`,
    citations: cite(rows.map((doc) => ({ doc, score: 1 }))),
    caution: 'This traces notes. It does not measure confidence.',
  }
}

function friendLines(memories: MemoryDoc[], childId: string, name: string) {
  const counts = new Map<string, { name: string; count: number; docs: MemoryDoc[] }>()
  for (const memory of forChild(memories, childId)) {
    if (memory.kind !== 'play') continue
    const match = memory.text.match(/Played with ([^.]+)\./)
    const friend = match?.[1]
    if (!friend || friend === name) continue
    const row = counts.get(friend) ?? { name: friend, count: 0, docs: [] }
    row.count += 1
    row.docs.push(memory)
    counts.set(friend, row)
  }
  return [...counts.values()].sort((a, b) => b.count - a.count || a.name.localeCompare(b.name))
}

function moodActivities(memories: MemoryDoc[], childId: string) {
  const mine = forChild(memories, childId)
  const bright = new Set(
    mine.filter((memory) => memory.kind === 'mood' && /curious|happy|focused|proud|calm|energetic/i.test(memory.text)).map((memory) => memory.date),
  )
  const activities = mine.filter((memory) => memory.kind === 'activity' && bright.has(memory.date))
  return activities
}

export function answerQuestion(question: string, memories: MemoryDoc[], childId: string, name: string): GroundedAnswer {
  const asked = question.trim()
  if (!asked) {
    return { answer: 'Ask about a note, a friend, a mood, or a change over time.', citations: [], caution: CAUTION }
  }
  if (/\b(confident|confidence)\b/i.test(asked)) return confidenceChain(memories, childId, name)

  const hits = searchMemories(asked, memories, childId)
  if (/\b(when|first|start|started|began)\b/i.test(asked)) {
    const topical = hits.filter((hit) => textOverlaps(asked, hit.doc.text).length > 0)
    const pool = (topical.length ? topical : []).sort((a, b) => a.doc.date.localeCompare(b.doc.date))
    const earliest = pool[0]
    if (!earliest) {
      return { answer: `No note for ${name} matches that yet.`, citations: cite(hits), caution: CAUTION }
    }
    return {
      answer: `${name}'s earliest matching note is ${earliest.doc.date}: ${earliest.doc.text}`,
      citations: cite(pool),
      caution: CAUTION,
    }
  }

  if (/\b(friend|friends|closest)\b/i.test(asked)) {
    const friends = friendLines(memories, childId, name)
    const top = friends[0]
    if (!top) return { answer: `No play links for ${name} yet.`, citations: [], caution: CAUTION }
    const rest = friends.slice(1, 3).map((friend) => `${friend.name} (${friend.count})`)
    const extra = rest.length ? ` Also on the map: ${rest.join(', ')}.` : ''
    return {
      answer: `${name}'s closest recorded play partner is ${top.name} (${top.count} play notes).${extra}`,
      citations: cite(top.docs.map((doc) => ({ doc, score: 1 }))),
      caution: CAUTION,
    }
  }

  if (/\b(mood|enjoy|improve|activities)\b/i.test(asked)) {
    const activities = moodActivities(memories, childId)
    if (!activities.length) {
      return { answer: `No mood-linked activities for ${name} yet.`, citations: cite(hits), caution: CAUTION }
    }
    const unique = [...new Set(activities.map((memory) => memory.text))]
    return {
      answer: `On days logged as curious, calm, proud, or focused, ${name} did: ${unique.join(', ')}.`,
      citations: cite(activities.map((doc) => ({ doc, score: 1 }))),
      caution: CAUTION,
    }
  }

  if (!hits.length) return { answer: `No notes for ${name} yet.`, citations: [], caution: CAUTION }
  const lines = hits.slice(0, 3).map((hit) => `${hit.doc.date}: ${hit.doc.text}`)
  return {
    answer: `Closest notes for ${name}: ${lines.join(' ')}`,
    citations: cite(hits),
    caution: CAUTION,
  }
}
