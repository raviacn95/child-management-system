import type { DailyLog, WonderBook, WonderFirst, WonderPlay } from '../../types'

export function shiftIso(iso: string, days: number) {
  const date = new Date(`${iso}T12:00:00`)
  date.setDate(date.getDate() + days)
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${date.getFullYear()}-${month}-${day}`
}

export function sameDayLastYear(iso: string) {
  const [year, month, day] = iso.split('-')
  return `${Number(year) - 1}-${month}-${day}`
}

function between(iso: string, start: string, end: string) {
  return iso >= start && iso <= end
}

function napMinutes(start: string, end: string) {
  if (!start || !end) return 0
  const [sh, sm] = start.split(':').map(Number)
  const [eh, em] = end.split(':').map(Number)
  return eh * 60 + em - (sh * 60 + sm)
}

function pairKey(play: WonderPlay) {
  return [play.a, play.b].sort().join('|')
}

export function timeMachine(input: {
  name: string
  today: string
  logs: DailyLog[]
  words: { childId: string; date: string; word: string }[]
  childId: string
}) {
  const when = sameDayLastYear(input.today)
  const log = input.logs.find((row) => row.childId === input.childId && row.date === when)
  const words = input.words.filter((row) => row.childId === input.childId && row.date === when).map((row) => row.word)
  if (!log && words.length === 0) {
    return {
      found: false,
      when,
      word: '',
      photos: 0,
      activity: '',
      text: `Nothing was saved for ${input.name} on this date last year. What you capture today becomes next year’s letter.`,
    }
  }
  const activity = log?.activities[0] ?? ''
  const word = words[0] ?? ''
  const photos = log?.photos ?? 0
  const pieces = [
    `This day, one year ago, ${input.name}`,
    activity ? activity.charAt(0).toLowerCase() + activity.slice(1) : 'had a day worth keeping',
    word ? `and said “${word}” for the first time` : '',
  ]
  const sentence = `${pieces.filter(Boolean).join(' ')}.`
  const extra = [
    log?.notes,
    log?.mood ? `The room wrote down the mood as ${log.mood.toLowerCase()}.` : '',
  ]
    .filter(Boolean)
    .join(' ')
  return { found: true, when, word, photos, activity, text: `${sentence} ${extra}`.trim() }
}

const PUZZLE = /puzzle|block|tower|stack/i
const DRAW = /paint|draw|rainbow|art/i
const LANGUAGE = /language|word|story|letter/i

export function developmentWatch(input: {
  childId: string
  name: string
  roomChildIds: string[]
  today: string
  logs: DailyLog[]
  observations: { childId: string; date: string; domain: string }[]
  words: { childId: string; date: string }[]
}) {
  const weekStart = shiftIso(input.today, -6)
  const priorStart = shiftIso(input.today, -13)
  const priorEnd = shiftIso(input.today, -7)
  const monthStart = shiftIso(input.today, -29)
  const prevMonthStart = shiftIso(input.today, -59)
  const logsFor = (id: string, start: string, end: string) =>
    input.logs.filter((row) => row.childId === id && between(row.date, start, end))
  const puzzleCount = (rows: DailyLog[]) =>
    rows.reduce((sum, row) => sum + row.activities.filter((item) => PUZZLE.test(item)).length, 0)
  const mine = logsFor(input.childId, weekStart, input.today)
  const minePrior = logsFor(input.childId, priorStart, priorEnd)
  const puzzles = puzzleCount(mine)
  const puzzlesBefore = puzzleCount(minePrior)
  const roomPeers = input.roomChildIds.filter((id) => id !== input.childId)
  const peerPuzzles =
    roomPeers.reduce((sum, id) => sum + puzzleCount(logsFor(id, weekStart, input.today)), 0) /
    Math.max(roomPeers.length, 1)
  const languageNow = input.observations.filter(
    (row) => row.childId === input.childId && LANGUAGE.test(row.domain) && between(row.date, monthStart, input.today),
  ).length
  const languageThen = input.observations.filter(
    (row) =>
      row.childId === input.childId && LANGUAGE.test(row.domain) && between(row.date, prevMonthStart, shiftIso(monthStart, -1)),
  ).length
  const wordsNow = input.words.filter((row) => row.childId === input.childId && between(row.date, monthStart, input.today)).length
  const insights: string[] = []
  if (puzzles > 0) {
    const delta = puzzlesBefore > 0 ? Math.round(((puzzles - puzzlesBefore) / puzzlesBefore) * 100) : null
    const change =
      delta == null ? ' (new this week)' : ` (${delta >= 0 ? '+' : ''}${delta}%)`
    insights.push(`Puzzle activities: ${puzzles} this week${change}.`)
  }
  if (puzzles > peerPuzzles && roomPeers.length) {
    insights.push('Problem-solving participation above the room this week.')
  }
  if (languageNow + languageThen > 0) {
    const drop = languageThen > 0 ? Math.round(((languageThen - languageNow) / languageThen) * 100) : 0
    insights.push(
      drop > 0
        ? `Language notes: ${languageNow}, down ${drop}% from the previous month.`
        : `Language notes: ${languageNow}.`,
    )
  }
  if (wordsNow > 0) insights.push(`${wordsNow} new word${wordsNow === 1 ? '' : 's'} this month.`)
  if (!insights.length) insights.push(`Not enough days on file yet to see a pattern for ${input.name}.`)
  return insights.slice(0, 4)
}

export function friendshipMap(input: {
  today: string
  children: { id: string; name: string }[]
  plays: WonderPlay[]
  presentIds: string[]
}) {
  const names = new Map(input.children.map((child) => [child.id, child.name]))
  const recentStart = shiftIso(input.today, -6)
  const counts = new Map<string, { a: string; b: string; count: number; first: string; last: string }>()
  for (const play of input.plays) {
    const key = pairKey(play)
    const [a, b] = key.split('|')
    const row = counts.get(key) ?? { a, b, count: 0, first: play.date, last: play.date }
    row.count += 1
    if (play.date < row.first) row.first = play.date
    if (play.date > row.last) row.last = play.date
    counts.set(key, row)
  }
  const pairs = [...counts.values()].sort((a, b) => b.count - a.count || b.last.localeCompare(a.last))
  const label = (id: string) => names.get(id) ?? 'A child'
  const best = pairs.filter((pair) => pair.count >= 2).slice(0, 3)
  const fresh = pairs.filter((pair) => pair.first >= recentStart && pair.count === 1)
  const played = new Set(input.plays.filter((play) => play.date >= recentStart).flatMap((play) => [play.a, play.b]))
  const alone = input.presentIds.filter((id) => !played.has(id)).map((id) => label(id))
  const groups = socialGroups(pairs.map((pair) => [pair.a, pair.b]), label)
  return {
    best: best.map((pair) => `${label(pair.a)} ↔ ${label(pair.b)}`),
    fresh: fresh.map((pair) => `${label(pair.a)} ↔ ${label(pair.b)}`),
    alone,
    groups,
  }
}

function socialGroups(edges: string[][], label: (id: string) => string) {
  const neighbours = new Map<string, Set<string>>()
  for (const [a, b] of edges) {
    if (!neighbours.has(a)) neighbours.set(a, new Set())
    if (!neighbours.has(b)) neighbours.set(b, new Set())
    neighbours.get(a)!.add(b)
    neighbours.get(b)!.add(a)
  }
  const seen = new Set<string>()
  const groups: string[] = []
  for (const start of neighbours.keys()) {
    if (seen.has(start)) continue
    const stack = [start]
    const members: string[] = []
    seen.add(start)
    while (stack.length) {
      const id = stack.pop()!
      members.push(id)
      for (const next of neighbours.get(id) ?? []) {
        if (seen.has(next)) continue
        seen.add(next)
        stack.push(next)
      }
    }
    if (members.length >= 3) groups.push(members.map(label).sort().join(', '))
  }
  return groups
}

export function highlightReel(input: { log?: DailyLog; moments: string[] }) {
  const lines: string[] = []
  for (const activity of input.log?.activities ?? []) lines.push(activity)
  const independent = input.log?.meals.filter((meal) => meal.amount === 'all') ?? []
  if (independent.length) lines.push(`Finished ${independent[0].type.toLowerCase()} independently`)
  else if (input.log?.meals[0]) lines.push(`Ate ${input.log.meals[0].amount} of ${input.log.meals[0].type.toLowerCase()}`)
  for (const moment of input.moments) lines.push(moment)
  return lines.slice(0, 5)
}

export function detectFirsts(input: {
  childId: string
  logs: DailyLog[]
  plays: WonderPlay[]
  moments?: { date: string; text: string }[]
  known: WonderFirst[]
}): WonderFirst[] {
  const known = new Set(input.known.filter((item) => item.childId === input.childId).map((item) => item.title))
  const logs = input.logs
    .filter((row) => row.childId === input.childId)
    .slice()
    .sort((a, b) => a.date.localeCompare(b.date))
  const found: WonderFirst[] = []
  const add = (date: string, title: string) => {
    if (known.has(title) || found.some((item) => item.title === title)) return
    found.push({ id: `first-${input.childId}-${found.length}`, childId: input.childId, date, title })
  }
  for (const log of logs) {
    if (log.meals.some((meal) => meal.amount === 'all')) add(log.date, 'First independent meal')
    if (log.naps.some((nap) => napMinutes(nap.start, nap.end) >= 120)) add(log.date, 'First nap longer than 2 hours')
    if (log.activities.some((item) => DRAW.test(item)) || DRAW.test(log.notes)) add(log.date, 'First drawing or painting')
    if (/potty|toilet/i.test(log.notes)) add(log.date, 'First potty note')
    if (/cry/i.test(`${log.mood} ${log.notes}`)) add(log.date, 'A day with tears on file')
  }
  const calm = logs.find((log) => log.mood && !/cry|upset/i.test(`${log.mood} ${log.notes}`))
  if (calm && logs.some((log) => /cry/i.test(`${log.mood} ${log.notes}`))) add(calm.date, 'First full day without tears on file')
  const play = input.plays
    .filter((item) => item.a === input.childId || item.b === input.childId)
    .sort((a, b) => a.date.localeCompare(b.date))[0]
  if (play) add(play.date, 'First friendship on the map')
  for (const moment of (input.moments ?? []).slice().sort((a, b) => a.date.localeCompare(b.date))) {
    if (/shared a toy/i.test(moment.text)) add(moment.date, 'First shared toy')
  }
  return found
}

export function familyRisk(input: {
  openBalance: number
  unreadMessages: number
  missedDays: number
  daysSinceVisit: number | null
}) {
  const reasons: string[] = []
  if (input.openBalance > 0) reasons.push('An invoice is still open.')
  if (input.unreadMessages > 0) reasons.push('A message is waiting unread.')
  if (input.missedDays > 0) reasons.push('A scheduled day had no check-in.')
  if (input.daysSinceVisit == null) reasons.push('The family book has not been opened.')
  else if (input.daysSinceVisit > 7) reasons.push('The family book has been quiet for over a week.')
  const score = reasons.length >= 3 ? 'high' : reasons.length >= 1 ? 'medium' : 'low'
  const action =
    score === 'low'
      ? 'Keep sharing ordinary moments. The family is in touch.'
      : 'Send a classroom update.'
  return { score: score as 'low' | 'medium' | 'high', reasons, action }
}

export type EnergyBand = 'calm' | 'active' | 'overstimulated'

export function energyMeter(moods: string[]): { band: EnergyBand; label: string; suggestion: string } {
  if (!moods.length) {
    return {
      band: 'calm',
      label: 'Quiet',
      suggestion: 'The room has no mood notes yet. A short hello circle will give you a reading.',
    }
  }
  const heat = moods.map((mood) => {
    const text = mood.toLowerCase()
    if (/cry|upset|overwhelm|angry/.test(text)) return 2
    if (/wiggl|tired|excit|curious/.test(text)) return 1
    return 0
  })
  const avg = heat.reduce((sum, n) => sum + n, 0) / heat.length
  if (avg >= 1.4) {
    return {
      band: 'overstimulated',
      label: 'High energy',
      suggestion: 'Sensory activities, then a quiet corner.',
    }
  }
  if (avg >= 0.6) {
    return {
      band: 'active',
      label: 'Active',
      suggestion: 'Outdoor play.',
    }
  }
  return {
    band: 'calm',
    label: 'Calm',
    suggestion: 'Story time, or a quiet corner.',
  }
}

export function readiness(input: {
  logs: DailyLog[]
  plays: number
  moments: number
  words: number
  today: string
}) {
  const week = input.logs.filter((row) => between(row.date, shiftIso(input.today, -6), input.today))
  const meals = week.flatMap((row) => row.meals)
  const independent = meals.filter((meal) => meal.amount === 'all').length
  const puzzles = week.reduce((sum, row) => sum + row.activities.filter((item) => PUZZLE.test(item)).length, 0)
  const calm = week.filter((row) => row.mood && !/cry|upset|wiggl/i.test(row.mood)).length
  const score = (n: number, cap: number) => Math.max(0, Math.min(100, Math.round((n / cap) * 100)))
  return [
    { domain: 'Communication', score: score(input.words + week.filter((row) => LANGUAGE.test(row.notes + row.activities.join(' '))).length, 4) },
    { domain: 'Social skills', score: score(input.plays + input.moments, 4) },
    { domain: 'Problem solving', score: score(puzzles, 3) },
    { domain: 'Independence', score: score(independent, 3) },
    { domain: 'Emotional growth', score: score(calm, Math.max(week.length, 1)) },
  ]
}

function joinList(parts: string[]) {
  if (parts.length <= 1) return parts[0] ?? ''
  return `${parts.slice(0, -1).join(', ')} and ${parts[parts.length - 1]}`
}

export function growthStory(input: {
  name: string
  monthLabel: string
  logs: DailyLog[]
  moments: string[]
  firsts: string[]
  words: string[]
  friendName?: string
  newFriend?: boolean
}) {
  const activities = [...new Set(input.logs.flatMap((row) => row.activities))].slice(0, 4)
  const paintings = input.logs.flatMap((row) => row.activities).filter((item) => DRAW.test(item))
  const independent = input.logs.some((row) => row.meals.some((meal) => meal.amount === 'all'))
  const parts: string[] = []
  if (paintings.length === 1) parts.push(paintings[0].charAt(0).toLowerCase() + paintings[0].slice(1))
  else if (paintings.length > 1) parts.push(`painted ${paintings.length} times`)
  if (input.friendName && input.newFriend) parts.push(`made a new friend named ${input.friendName}`)
  else if (input.friendName) parts.push(`spent time with ${input.friendName}`)
  if (independent) parts.push('independently finished a meal')
  const lead = parts.length
    ? `This month, ${input.name} ${joinList(parts)}.`
    : `${input.name}'s ${input.monthLabel} is still being written from the notes the room kept.`
  const cards = [
    { heading: input.monthLabel, body: lead },
    {
      heading: 'What the days held',
      body: activities.length ? activities.join(' · ') : 'The month is still quiet on activities.',
    },
    {
      heading: 'Moments',
      body: input.moments.slice(0, 3).join(' ') || 'No magic moments were pressed this month.',
    },
    {
      heading: 'Firsts',
      body: input.firsts.slice(0, 3).join(' · ') || 'No new firsts were detected this month.',
    },
    {
      heading: 'Words',
      body: input.words.length ? `New words: ${input.words.join(', ')}.` : 'No new words were written down.',
    },
  ]
  const narration = cards.map((card) => `${card.heading}. ${card.body}`).join(' ')
  return { title: `${input.name}'s ${input.monthLabel} story`, cards, narration }
}

export function askRecords(input: {
  question: string
  name: string
  today: string
  logs: DailyLog[]
  plays: { date: string; other: string }[]
  moments: { date: string; text: string }[]
  words: { date: string; word: string }[]
}) {
  const q = input.question.toLowerCase()
  const weekStart = shiftIso(input.today, -6)
  if (/eat|meal|lunch|tiffin|hungry/.test(q)) {
    const meals = input.logs.filter((row) => row.date >= weekStart).flatMap((row) => row.meals)
    if (!meals.length) return `${input.name} has no meals on file for the last 7 days.`
    const tally = meals.reduce<Record<string, number>>((acc, meal) => ({ ...acc, [meal.amount]: (acc[meal.amount] ?? 0) + 1 }), {})
    return `${input.name}'s meals this week: ${Object.entries(tally)
      .map(([amount, count]) => `${count} ${amount}`)
      .join(', ')}.`
  }
  if (/nap/.test(q)) {
    const hours = /([0-9]+)\s*hour/.exec(q)
    const need = hours ? Number(hours[1]) * 60 : 120
    const naps = input.logs
      .flatMap((row) => row.naps.map((nap) => ({ date: row.date, minutes: napMinutes(nap.start, nap.end), start: nap.start, end: nap.end })))
      .filter((nap) => nap.minutes >= need)
      .sort((a, b) => b.date.localeCompare(a.date))
    if (!naps.length) return `${input.name} has no finished nap of ${Math.round(need / 60)} hours or more on file.`
    const last = naps[0]
    return `The last nap longer than ${Math.round(need / 60)} hours was ${last.date}, from ${last.start} to ${last.end}.`
  }
  if (/friend|play|who/.test(q)) {
    const pool = /most/.test(q) ? input.plays : input.plays.filter((play) => play.date >= weekStart)
    if (!pool.length) return `${input.name} has no play links${/most/.test(q) ? '' : ' in the last 7 days'}.`
    const tally = pool.reduce<Record<string, number>>((acc, play) => ({ ...acc, [play.other]: (acc[play.other] ?? 0) + 1 }), {})
    const ranked = Object.entries(tally).sort((a, b) => b[1] - a[1])
    if (/most/.test(q)) return `${input.name} plays most with ${ranked[0][0]}.`
    return `This week ${input.name} played with ${ranked.map(([name]) => name).join(', ')}.`
  }
  if (/magic|moment|thank|share/.test(q)) {
    const moment = input.moments.slice().sort((a, b) => b.date.localeCompare(a.date))[0]
    return moment ? `Latest magic moment (${moment.date}): ${moment.text}` : `No magic moments yet for ${input.name}.`
  }
  if (/word|said|speak/.test(q)) {
    const word = input.words.slice().sort((a, b) => b.date.localeCompare(a.date))[0]
    return word ? `The latest word on file is “${word.word}” on ${word.date}.` : `No new words are on file for ${input.name}.`
  }
  return `Ask about meals, naps, friends, magic moments, or new words. I only answer from ${input.name}'s records.`
}

export function monthLabel(iso: string) {
  const date = new Date(`${iso}T12:00:00`)
  return date.toLocaleString('en', { month: 'long', year: 'numeric' })
}

export function emptyBook(): WonderBook {
  return { moments: [], plays: [], words: [], firsts: [], pings: [], visits: [] }
}
