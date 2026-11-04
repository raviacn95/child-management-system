import type { MemoryDoc, StudioChild } from './corpus'
import { averageVectors, cosine, embed } from './embed'
import { ACTIVITY_CATALOG } from './recommend'

export interface WindowNote {
  domain: string
  date: string
}

function shift(iso: string, days: number) {
  const date = new Date(`${iso}T12:00:00`)
  date.setDate(date.getDate() + days)
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${date.getFullYear()}-${month}-${day}`
}

export function developmentSignals(input: { today: string; observations: WindowNote[]; playDates: string[] }) {
  const recentStart = shift(input.today, -29)
  const priorStart = shift(input.today, -59)
  const priorEnd = shift(recentStart, -1)
  const between = (iso: string, start: string, end: string) => iso >= start && iso <= end
  const count = (rows: string[], start: string, end: string) => rows.filter((iso) => between(iso, start, end)).length
  const language = input.observations.filter((row) => /language/i.test(row.domain)).map((row) => row.date)
  const languageNow = count(language, recentStart, input.today)
  const languageThen = count(language, priorStart, priorEnd)
  const socialNow = count(input.playDates, recentStart, input.today)
  const socialThen = count(input.playDates, priorStart, priorEnd)
  const lines: string[] = []
  if (languageThen >= 2 && languageNow < languageThen) {
    lines.push(`Language interactions: ${languageNow}, down from ${languageThen} in the previous month.`)
  }
  if (socialThen >= 2 && socialNow < socialThen) {
    lines.push(`Social interactions: ${socialNow}, down from ${socialThen} in the previous month.`)
  }
  if (lines.length >= 2) lines.push('Consider observing communication participation.')
  if (!lines.length) lines.push('No drop across both language notes and play links in this window.')
  return { lines, caution: 'A pattern in the notes. Not a diagnosis.' }
}

const POSITIVE = /thank|love|great|wonderful|glad|happy|helpful|pleased/i
const NEGATIVE = /upset|angry|disappointed|frustrated|waiting|refund|complaint|never|worst|unhappy/i

export function redactSecrets(text: string) {
  return text.replace(/\bPIN\s*\d+\b/gi, 'PIN hidden')
}

export function classifySentiment(text: string): 'Satisfied' | 'Neutral' | 'Needs attention' {
  const positive = POSITIVE.test(text)
  const negative = NEGATIVE.test(text)
  if (negative && !positive) return 'Needs attention'
  if (positive && !negative) return 'Satisfied'
  return 'Neutral'
}

export function sentimentReport(messages: { body: string; at: string }[]) {
  const rows = messages.map((message) => ({
    at: message.at.slice(0, 10),
    excerpt: redactSecrets(message.body).slice(0, 140),
    label: classifySentiment(message.body),
  }))
  const needs = rows.filter((row) => row.label === 'Needs attention').length
  const satisfied = rows.filter((row) => row.label === 'Satisfied').length
  const overall: 'Satisfied' | 'Neutral' | 'Needs attention' =
    needs > satisfied ? 'Needs attention' : satisfied > needs ? 'Satisfied' : 'Neutral'
  return {
    overall,
    rows,
    caution: 'Tone of messages already in the centre. It is not a judgement of the family.',
  }
}

export function digitalTwin(memories: MemoryDoc[], child: StudioChild) {
  const activities = memories.filter((memory) => memory.childIds.includes(child.id) && memory.kind === 'activity')
  const caution = 'A guess from past activities, not a certainty.'
  if (!activities.length) {
    return { prediction: `Not enough activity notes to sketch a profile for ${child.firstName}.`, because: '', caution }
  }
  const profile = averageVectors(activities.map((memory) => memory.vector))
  const top = ACTIVITY_CATALOG.map((activity) => ({
    activity,
    score: cosine(profile, embed(activity.title)),
  })).sort((a, b) => b.score - a.score)[0]
  const past = [...new Set(activities.map((memory) => memory.text))].slice(0, 4)
  return {
    prediction: `${child.firstName} may enjoy ${top.activity.title.toLowerCase()}.`,
    because: `The profile sits nearest that activity because past notes include ${past.join(', ')}.`,
    caution,
  }
}

export function predictFriendships(input: {
  children: StudioChild[]
  attendance: { childId: string; date: string }[]
  plays: { a: string; b: string }[]
}) {
  const byRoom = new Map<string, StudioChild[]>()
  for (const child of input.children) {
    const list = byRoom.get(child.classroomId) ?? []
    list.push(child)
    byRoom.set(child.classroomId, list)
  }
  const days = new Map<string, Set<string>>()
  for (const row of input.attendance) {
    const set = days.get(row.childId) ?? new Set<string>()
    set.add(row.date)
    days.set(row.childId, set)
  }
  const playCount = (a: string, b: string) =>
    input.plays.filter((play) => (play.a === a && play.b === b) || (play.a === b && play.b === a)).length
  const rows: { pair: string; score: number; status: 'close' | 'possible' }[] = []
  for (const room of byRoom.values()) {
    for (let i = 0; i < room.length; i += 1) {
      for (let j = i + 1; j < room.length; j += 1) {
        const left = room[i]
        const right = room[j]
        const overlap = [...(days.get(left.id) ?? [])].filter((date) => days.get(right.id)?.has(date)).length
        const plays = playCount(left.id, right.id)
        const score = overlap + plays
        if (!score) continue
        rows.push({
          pair: `${left.firstName} ↔ ${right.firstName}`,
          score,
          status: plays >= 2 ? 'close' : 'possible',
        })
      }
    }
  }
  return {
    rows: rows.sort((a, b) => b.score - a.score || a.pair.localeCompare(b.pair)),
    caution: 'Overlap in the room and on the play map. Not a label on the children.',
  }
}
