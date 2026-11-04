import { describe, expect, it } from 'vitest'
import { createSeed, today } from '../../data/seed'
import { buildMemories, type MemoryDoc } from './corpus'
import { agentTrace, compareEmbedders, nearestNotes, retrievalDebug } from './debug'
import { casesFromNotes, compareEmbedderScores, evaluateRetrieval, recall, remember, vectorPreview, whyNote } from './expose'
import { cosine, embed } from './embed'
import { expandObservation } from './enrich'
import { memoryEdges, queryMemoryGraph, skillLinks } from './graph'
import { planClassroom, simulateRoom } from './plan'
import { rankActivities } from './recommend'
import { answerQuestion, confidenceChain } from './rag'
import { dayStory } from './story'
import { classifySentiment, developmentSignals, digitalTwin, predictFriendships, redactSecrets, sentimentReport } from './signals'
import { analyzeArtwork, compareArtwork, flatFill, splitFill } from './vision'

const state = createSeed()
const names = new Map(state.children.map((child) => [child.id, child.firstName]))
const memories = buildMemories({
  children: state.children,
  logs: state.dailyLogs,
  observations: state.observations,
  wonder: state.wonder,
  incidents: state.incidents,
  attendance: state.attendance,
})
const leo = state.children.find((child) => child.id === 'c-leo')!

describe('ai studio', () => {
  it('puts similar notes nearer than unrelated notes', () => {
    const puzzle = embed('puzzle table')
    expect(cosine(puzzle, embed('finished a puzzle'))).toBeGreaterThan(cosine(puzzle, embed('bottle and nap')))
  })

  it('writes a day as structured beats', () => {
    const story = dayStory({
      name: 'Aarav',
      lines: ['Puzzle', 'Painting', 'Ate lunch', 'Shared toy'],
    })
    expect(story.beats).toEqual(['worked on a puzzle', 'painted', 'ate lunch', 'shared a toy'])
    expect(story.text).toBe('Today Aarav worked on a puzzle, painted, ate lunch, and shared a toy.')
  })

  it('expands a short block note into classroom language', () => {
    const note = expandObservation('Played with blocks.')
    expect(note.text).toBe('Demonstrated persistence, collaboration, hand-eye coordination, problem solving.')
    expect(note.caution).toMatch(/teacher/i)
  })

  it('ranks rainy high-energy ideas first', () => {
    const top = rankActivities({ age: 4, mood: 'happy', energy: 'high', weather: 'rainy' })
      .slice(0, 3)
      .map((row) => row.activity.title)
    expect(top).toEqual(['Animal movement game', 'Block challenge', 'Indoor treasure hunt'])
  })

  it('answers from Leo’s notes and cites them', () => {
    const shared = answerQuestion('When did he first start sharing toys?', memories, 'c-leo', 'Leo')
    expect(shared.answer).toMatch(/shared/i)
    expect(shared.citations.length).toBeGreaterThan(0)
    expect(shared.citations.every((row) => row.date && row.text)).toBe(true)

    const friends = answerQuestion('Who are his closest friends?', memories, 'c-leo', 'Leo')
    expect(friends.answer).toMatch(/Ava/)
    expect(friends.answer).toMatch(/2 play notes/)

    const mood = answerQuestion('What activities show up with a bright mood?', memories, 'c-leo', 'Leo')
    expect(mood.answer).toMatch(/Block city/)
  })

  it('chains confidence notes without turning them into a score', () => {
    const chain = confidenceChain(memories, 'c-leo', 'Leo')
    expect(chain.answer).toMatch(/puzzle/i)
    expect(chain.answer).toMatch(/shared/i)
    expect(chain.caution).toMatch(/does not measure/i)
  })

  it('joins block notes with Ava and leaves puzzle-plus-Ava unjoined', () => {
    const blocks = queryMemoryGraph({
      memories,
      childId: 'c-leo',
      childName: 'Leo',
      query: 'Show all block memories involving Ava',
      names,
    })
    expect(blocks.joined.some((row) => /block/i.test(row.text))).toBe(true)
    const puzzles = queryMemoryGraph({
      memories,
      childId: 'c-leo',
      childName: 'Leo',
      query: 'Show all puzzle-related memories involving Ava',
      names,
    })
    expect(puzzles.joined).toHaveLength(0)
    expect(puzzles.answer).toMatch(/No single note/)
    expect(memoryEdges(memories, 'c-leo', 'Leo').some((edge) => edge.rel === 'friendship' && edge.to === 'Ava')).toBe(true)
  })

  it('finds skills that show up in the same note', () => {
    const links = skillLinks(memories, 'c-leo')
    expect(links.some((row) => row.link.includes('persistence') && row.link.includes('problem solving'))).toBe(true)
  })

  it('flags a drop in language notes and play links', () => {
    const watch = developmentSignals({
      today: '2026-11-04',
      observations: [
        { domain: 'Language', date: '2026-09-10' },
        { domain: 'Language', date: '2026-09-20' },
        { domain: 'Language', date: '2026-10-20' },
      ],
      playDates: ['2026-09-08', '2026-09-18', '2026-10-15'],
    })
    expect(watch.lines.join(' ')).toMatch(/Language interactions/)
    expect(watch.lines.join(' ')).toMatch(/Social interactions/)
    expect(watch.lines.join(' ')).toMatch(/Consider observing communication participation/)
    expect(watch.caution).toMatch(/Not a diagnosis/)
  })

  it('classifies message tone and hides a PIN', () => {
    expect(classifySentiment('Thank you, that was wonderful')).toBe('Satisfied')
    expect(classifySentiment('I am upset and still waiting')).toBe('Needs attention')
    const report = sentimentReport([{ at: '2026-11-01T18:40:00', body: 'Uncle will collect. PIN 4488.' }])
    expect(report.rows[0].excerpt).toMatch(/PIN hidden/)
    expect(report.rows[0].excerpt).not.toMatch(/4488/)
    expect(redactSecrets('PIN 1029')).toBe('PIN hidden')
  })

  it('sketches an activity profile and room overlaps', () => {
    const twin = digitalTwin(memories, leo)
    expect(twin.prediction).toMatch(/Leo may enjoy/i)
    expect(twin.caution).toMatch(/not a certainty/i)
    const map = predictFriendships({
      children: state.children,
      attendance: state.attendance,
      plays: state.wonder.plays,
    })
    expect(map.rows.some((row) => row.pair.includes('Leo') && row.pair.includes('Ava') && row.status === 'close')).toBe(true)
    expect(map.rows.some((row) => row.pair.includes('Hana') && row.status === 'possible')).toBe(true)
  })

  it('plans with tools and simulates a short-staffed rainy room', () => {
    const plan = planClassroom({
      prompt: 'Plan tomorrow for an energetic classroom.',
      present: 12,
      moods: ['Curious and focused'],
      napMinutes: [80],
      weather: 'rainy',
      teachers: 2,
    })
    expect(plan.steps.map((step) => step.tool)).toEqual([
      'read_attendance',
      'read_weather',
      'read_moods',
      'read_naps',
      'read_ratio',
      'write_schedule',
    ])
    expect(plan.steps.every((step) => step.reason.length > 0)).toBe(true)
    expect(plan.schedule.join(' ')).toMatch(/indoors/i)
    expect(plan.schedule.join(' ')).toMatch(/High-energy/)
    const weatherOnly = planClassroom({
      prompt: 'What is the weather?',
      present: 12,
      moods: [],
      napMinutes: [],
      weather: 'sunny',
      teachers: 2,
    })
    expect(weatherOnly.steps.map((step) => step.tool)).toEqual(['read_weather'])
    expect(weatherOnly.schedule).toEqual([])
    const room = simulateRoom({ children: 20, teachers: 4, absentStaff: 2, weather: 'rainy' })
    expect(room.ratio).toBe(10)
    expect(room.ticks.map((tick) => tick.block)).toEqual(['Arrival', 'Morning', 'Lunch', 'Rest', 'Afternoon', 'Pickup'])
    expect(room.ticks[1].high).toBe(20)
    expect(room.bottlenecks.join(' ')).toMatch(/8:1/)
    expect(room.bottlenecks.join(' ')).toMatch(/Rain/)
    expect(room.bottlenecks.join(' ')).toMatch(/Morning crowd/)
  })

  it('reads colours and edge changes from pixels', () => {
    const plain = analyzeArtwork(flatFill([245, 245, 245], 4, 2), 4)
    const split = analyzeArtwork(splitFill([200, 40, 40], [40, 80, 200], 4, 2), 4)
    expect(plain.colors).toEqual(['white'])
    expect(plain.complexity).toBe(0)
    expect(split.colors).toEqual(expect.arrayContaining(['red', 'blue']))
    expect(compareArtwork(plain, split).complexityDelta).toBeGreaterThan(0)
  })

  it('shows retrieved notes and scores before the answer', () => {
    const debug = retrievalDebug('When did he first start sharing toys?', memories, 'c-leo', 'Leo')
    expect(debug.question).toMatch(/sharing toys/)
    expect(debug.retrieved.length).toBeGreaterThan(0)
    expect(debug.retrieved[0].rank).toBe(1)
    expect(debug.retrieved[0].why).toMatch(/shar/i)
    expect(debug.retrieved[0].score).toBeGreaterThanOrEqual(debug.retrieved.at(-1)!.score)
    expect(debug.answer).toMatch(/shared/i)
  })

  it('ranks the nearest note above an unrelated one', () => {
    const docs: MemoryDoc[] = [
      { id: 'a', childIds: ['c'], date: '2026-01-01', kind: 'note', text: 'built a block city', vector: embed('built a block city'), skills: [] },
      { id: 'b', childIds: ['c'], date: '2026-01-02', kind: 'note', text: 'block city towers', vector: embed('block city towers'), skills: [] },
      { id: 'c', childIds: ['c'], date: '2026-01-03', kind: 'note', text: 'bottle and nap', vector: embed('bottle and nap'), skills: [] },
    ]
    const near = nearestNotes('a', docs, 'c', 2)
    expect(near.map((row) => row.id)).toEqual(['b', 'c'])
    expect(near[0].score).toBeGreaterThan(near[1].score)
  })

  it('traces the planner from the goal to the plan', () => {
    const plan = planClassroom({
      prompt: 'Plan tomorrow for an energetic classroom.',
      present: 12,
      moods: ['Curious and focused'],
      napMinutes: [80],
      weather: 'rainy',
      teachers: 2,
    })
    expect(agentTrace('Plan tomorrow for an energetic classroom.', plan).map((node) => node.label)).toEqual([
      'Goal',
      'Need attendance',
      'Call read_attendance',
      'Need weather',
      'Call read_weather',
      'Need moods',
      'Call read_moods',
      'Need naps',
      'Call read_naps',
      'Need ratio',
      'Call read_ratio',
      'Enough information',
      'Generate plan',
    ])
  })

  it('measures the local embedder and leaves cloud models uncalled', () => {
    const bake = compareEmbedders()
    const hash = bake.rows.find((row) => row.id === 'feature-hash')!
    expect(hash.ran).toBe(true)
    expect(hash.listPricePerMillion).toBe(0)
    expect(hash.latencyMs).toBeGreaterThanOrEqual(0)
    expect(hash.accuracy).toBe(1)
    expect(bake.rows.find((row) => row.id === 'openai')).toMatchObject({ ran: false, listPricePerMillion: 0.02, accuracy: null })
    expect(bake.rows.find((row) => row.id === 'gemini')).toMatchObject({ ran: false, listPricePerMillion: 0.2, accuracy: null })
    expect(bake.rows.find((row) => row.id === 'bge')).toMatchObject({ ran: false, listPricePerMillion: 0.001, accuracy: null })
  })

  it('scores a gold set and keeps a note that was just written', () => {
    const docs: MemoryDoc[] = [
      { id: 'a', childIds: ['c'], date: '2026-01-01', kind: 'note', text: 'built a block city', vector: embed('built a block city'), skills: [] },
      { id: 'b', childIds: ['c'], date: '2026-01-02', kind: 'note', text: 'bottle and nap', vector: embed('bottle and nap'), skills: [] },
    ]
    const scored = evaluateRetrieval(docs, 'c', [
      { question: 'block', expect: 'built a block city' },
      { question: 'nap', expect: 'bottle and nap' },
      { question: 'zebra', expect: 'missing note' },
    ])
    expect(scored.rows.map((row) => row.rank)).toEqual([1, 1, null])
    expect(scored.hitAt1).toBeCloseTo(2 / 3)
    expect(scored.hitAt3).toBeCloseTo(2 / 3)
    const stored = remember(remember([], 'built a block city'), 'bottle and nap')
    expect(recall(stored, 'block city')[0].text).toBe('built a block city')
    expect(remember(stored, '   ')).toBe(stored)
    expect(vectorPreview('block city').dim).toBe(32)
    expect(vectorPreview('block city').values).toHaveLength(32)
    expect(whyNote('zebra pasture', 'bottle and nap', 0.1)).toMatch(/ranks low/)
    expect(compareEmbedderScores(0.75, 1).find((row) => row.id === 'future')).toMatchObject({ ran: false, hitAt1: null })
    expect(casesFromNotes(memories, 'c-leo').length).toBeGreaterThan(0)
  })

  it('uses the centre date helper so the suite stays wired to seed data', () => {
    expect(today()).toMatch(/^\d{4}-\d{2}-\d{2}$/)
    expect(memories.some((memory) => memory.childIds.includes('c-leo') && /puzzle/i.test(memory.text))).toBe(true)
  })
})
