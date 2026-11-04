import { describe, expect, it } from 'vitest'
import { createSeed, today } from '../../data/seed'
import { buildMemories } from './corpus'
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
      'read_moods',
      'read_naps',
      'read_weather',
      'read_ratio',
    ])
    expect(plan.schedule.join(' ')).toMatch(/indoors/i)
    expect(plan.schedule.join(' ')).toMatch(/High-energy/)
    const room = simulateRoom({ children: 20, teachers: 4, absentStaff: 2, weather: 'rainy' })
    expect(room.ratio).toBe(10)
    expect(room.bottlenecks.join(' ')).toMatch(/8:1/)
    expect(room.bottlenecks.join(' ')).toMatch(/Rain/)
  })

  it('reads colours and edge changes from pixels', () => {
    const plain = analyzeArtwork(flatFill([245, 245, 245], 4, 2), 4)
    const split = analyzeArtwork(splitFill([200, 40, 40], [40, 80, 200], 4, 2), 4)
    expect(plain.colors).toEqual(['white'])
    expect(plain.complexity).toBe(0)
    expect(split.colors).toEqual(expect.arrayContaining(['red', 'blue']))
    expect(compareArtwork(plain, split).complexityDelta).toBeGreaterThan(0)
  })

  it('uses the centre date helper so the suite stays wired to seed data', () => {
    expect(today()).toMatch(/^\d{4}-\d{2}-\d{2}$/)
    expect(memories.some((memory) => memory.childIds.includes('c-leo') && /puzzle/i.test(memory.text))).toBe(true)
  })
})
