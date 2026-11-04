import type { AttendanceEvent, DailyLog, Incident, Observation, WonderBook } from '../../types'
import { embed } from './embed'
import { skillsIn } from './enrich'

export type MemoryKind =
  | 'activity'
  | 'note'
  | 'mood'
  | 'meal'
  | 'observation'
  | 'word'
  | 'moment'
  | 'play'
  | 'first'
  | 'conflict'

export interface MemoryDoc {
  id: string
  childIds: string[]
  date: string
  kind: MemoryKind
  text: string
  vector: number[]
  skills: string[]
}

export interface StudioChild {
  id: string
  firstName: string
  classroomId: string
  dob: string
}

export interface StudioInput {
  children: StudioChild[]
  logs: DailyLog[]
  observations: Observation[]
  wonder: WonderBook
  incidents: Pick<Incident, 'id' | 'childId' | 'at' | 'type'>[]
  attendance: Pick<AttendanceEvent, 'childId' | 'date' | 'checkIn'>[]
}

function dayOf(iso: string) {
  return iso.slice(0, 10)
}

function doc(id: string, childIds: string[], date: string, kind: MemoryKind, text: string): MemoryDoc {
  const clean = text.replace(/\s+/g, ' ').trim()
  return {
    id,
    childIds,
    date: dayOf(date),
    kind,
    text: clean,
    vector: embed(clean),
    skills: skillsIn(clean),
  }
}

export function buildMemories(input: StudioInput) {
  const names = new Map(input.children.map((child) => [child.id, child.firstName]))
  const memories: MemoryDoc[] = []
  for (const log of input.logs) {
    log.activities.forEach((activity, index) => {
      memories.push(doc(`act-${log.id}-${index}`, [log.childId], log.date, 'activity', activity))
    })
    if (log.notes) memories.push(doc(`note-${log.id}`, [log.childId], log.date, 'note', log.notes))
    if (log.mood) memories.push(doc(`mood-${log.id}`, [log.childId], log.date, 'mood', `Mood recorded as ${log.mood}.`))
    log.meals.forEach((meal, index) => {
      memories.push(
        doc(`meal-${log.id}-${index}`, [log.childId], log.date, 'meal', `Ate ${meal.amount} of ${meal.type}.`),
      )
    })
  }
  for (const observation of input.observations) {
    memories.push(
      doc(
        `obs-${observation.id}`,
        [observation.childId],
        observation.date,
        'observation',
        `${observation.domain}: ${observation.notes}`,
      ),
    )
  }
  for (const moment of input.wonder.moments) {
    memories.push(doc(`moment-${moment.id}`, [moment.childId], moment.at, 'moment', moment.text))
  }
  for (const word of input.wonder.words) {
    memories.push(doc(`word-${word.id}`, [word.childId], word.date, 'word', `Said “${word.word}”.`))
  }
  for (const play of input.wonder.plays) {
    const a = names.get(play.a) ?? 'A child'
    const b = names.get(play.b) ?? 'A child'
    memories.push(doc(`play-${play.id}-a`, [play.a, play.b], play.date, 'play', `Played with ${b}.`))
    memories.push(doc(`play-${play.id}-b`, [play.a, play.b], play.date, 'play', `Played with ${a}.`))
  }
  for (const first of input.wonder.firsts) {
    memories.push(doc(`first-${first.id}`, [first.childId], first.date, 'first', first.title))
  }
  for (const incident of input.incidents) {
    memories.push(doc(`conflict-${incident.id}`, [incident.childId], incident.at, 'conflict', `A conflict was logged (${incident.type}).`))
  }
  return memories.sort((a, b) => a.date.localeCompare(b.date) || a.id.localeCompare(b.id))
}
