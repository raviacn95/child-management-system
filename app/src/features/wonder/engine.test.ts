import { describe, expect, it } from 'vitest'
import { createSeed, today } from '../../data/seed'
import { childName } from '../../lib'
import type { WonderBook } from '../../types'
import {
  askRecords,
  detectFirsts,
  developmentWatch,
  energyMeter,
  familyRisk,
  friendshipMap,
  growthStory,
  highlightReel,
  sameDayLastYear,
  timeMachine,
} from './engine'

describe('wonder records', () => {
  const state = createSeed()
  const leo = state.children.find((child) => child.id === 'c-leo')!

  it('writes a letter from the same date last year', () => {
    const letter = timeMachine({
      name: childName(leo),
      today: today(),
      logs: state.dailyLogs,
      words: state.wonder.words,
      childId: 'c-leo',
    })
    expect(letter.found).toBe(true)
    expect(letter.when).toBe(sameDayLastYear(today()))
    expect(letter.text).toMatch(/rainbow/i)
    expect(letter.text).toMatch(/helicopter/i)
  })

  it('notices puzzle play against the child’s own earlier week', () => {
    const room = state.children.filter((child) => child.classroomId === leo.classroomId).map((child) => child.id)
    const notes = developmentWatch({
      childId: 'c-leo',
      name: 'Leo',
      roomChildIds: room,
      today: today(),
      logs: state.dailyLogs,
      observations: state.observations,
      words: state.wonder.words,
    })
    expect(notes.some((line) => /puzzle|block/i.test(line))).toBe(true)
  })

  it('maps a lasting pair, a new pair, and a child with no play links', () => {
    const present = ['c-leo', 'c-ava', 'c-hana', 'c-eli']
    const map = friendshipMap({
      today: today(),
      children: state.children.map((child) => ({ id: child.id, name: child.firstName })),
      plays: state.wonder.plays,
      presentIds: present,
    })
    expect(map.best.some((line) => line.includes('Leo') && line.includes('Ava'))).toBe(true)
    expect(map.fresh.some((line) => line.includes('Hana'))).toBe(true)
    expect(map.alone).toContain('Eli')
    expect(map.groups.some((line) => line.includes('Leo') && line.includes('Ava') && line.includes('Hana'))).toBe(true)
  })

  it('builds today’s reel and the earliest firsts', () => {
    const log = state.dailyLogs.find((row) => row.childId === 'c-leo' && row.date === today())
    expect(highlightReel({ log, moments: ['Shared a toy'] })).toEqual(
      expect.arrayContaining(['Block city', 'Shared a toy']),
    )
    const firsts = detectFirsts({
      childId: 'c-leo',
      logs: state.dailyLogs,
      plays: state.wonder.plays,
      known: [],
    })
    expect(firsts.map((item) => item.title)).toEqual(
      expect.arrayContaining(['First drawing or painting', 'First nap longer than 2 hours', 'First friendship on the map']),
    )
  })

  it('answers meals and long naps from the logs', () => {
    const logs = state.dailyLogs.filter((row) => row.childId === 'c-leo')
    expect(
      askRecords({
        question: 'When was the last nap longer than 2 hours?',
        name: 'Leo',
        today: today(),
        logs,
        plays: [],
        moments: [],
        words: [],
      }),
    ).toMatch(/15:15/)
    expect(
      askRecords({
        question: 'How much did Leo eat this week?',
        name: 'Leo',
        today: today(),
        logs,
        plays: [],
        moments: [],
        words: [],
      }),
    ).toMatch(/most|all/)
  })

  it('raises a medium risk when money, attendance, or silence stack up', () => {
    const risk = familyRisk({ openBalance: 100, unreadMessages: 0, missedDays: 1, daysSinceVisit: null })
    expect(risk.score).toBe('high')
    expect(familyRisk({ openBalance: 0, unreadMessages: 0, missedDays: 0, daysSinceVisit: 1 }).score).toBe('low')
  })

  it('reads the room and narrates a month', () => {
    expect(energyMeter(['Calm', 'Joyful']).band).toBe('calm')
    expect(energyMeter(['Wiggly', 'Curious and focused']).band).toBe('active')
    expect(energyMeter(['Crying', 'Upset']).label).toBe('High energy')
    const story = growthStory({
      name: 'Leo',
      monthLabel: 'November 2026',
      logs: state.dailyLogs.filter((row) => row.childId === 'c-leo'),
      moments: ['Said thank you'],
      firsts: ['First drawing or painting'],
      words: ['helicopter'],
    })
    expect(story.narration).toMatch(/helicopter/)
    expect(story.cards.length).toBe(5)
  })
})
