import { describe, expect, it } from 'vitest'
import { createSeed, today } from '../../data/seed'
import { childName } from '../../lib'
import {
  biggestBalance,
  centreClock,
  elapsedOnSite,
  formatElapsed,
  matchPickup,
  menuClashes,
  napAdvice,
  nextVaccine,
  openSeat,
  probeFood,
  roomLoad,
  supplyOutlook,
  weaveDayStory,
} from './engine'

const noon = new Date(2026, 10, 4, 12, 0, 30)

describe('elapsedOnSite', () => {
  it('counts the live stay from check-in', () => {
    expect(elapsedOnSite('08:12', noon)).toEqual({ minutes: 228, seconds: 30 })
    expect(formatElapsed({ minutes: 228, seconds: 30 })).toBe('3h 48m 30s')
    expect(elapsedOnSite('18:00', noon).minutes).toBe(0)
  })

  it('projects a closed building onto the afternoon so morning check-ins still tick', () => {
    const night = new Date(2026, 10, 4, 0, 37, 10)
    const clock = centreClock(night)
    expect(clock.projected).toBe(true)
    expect(clock.date.getHours()).toBe(15)
    expect(elapsedOnSite('08:12', clock.date).minutes).toBeGreaterThan(400)
    expect(centreClock(noon).projected).toBe(false)
  })
})

describe('allergy instruments', () => {
  const seed = createSeed()
  const kids = seed.children.filter((c) => c.siteId === 'site-grove').map((c) => ({
    id: c.id,
    name: childName(c),
    allergies: c.allergies,
  }))
  const menu = seed.menus.find((m) => m.date === today())!

  it('flags dairy in today’s menu and leaves the nut-free line alone', () => {
    const text = `${menu.breakfast} ${menu.lunch} ${menu.allergens}`
    const clashes = menuClashes(text, kids)
    expect(clashes.some((c) => c.allergy === 'Dairy')).toBe(true)
    expect(clashes.some((c) => c.allergy === 'Peanuts')).toBe(false)
  })

  it('probes a typed food against the allergy families', () => {
    expect(probeFood('pe', kids)).toEqual([])
    expect(probeFood('peanut butter', kids).map((c) => c.allergy)).toContain('Peanuts')
    expect(probeFood('banana', kids)).toEqual([])
  })
})

describe('matchPickup', () => {
  const seed = createSeed()

  it('accepts a guardian or extra adult and rejects a short code', () => {
    expect(matchPickup(seed.guardians, seed.pickups, '4482')).toMatchObject({
      name: 'Priya Shah',
      childIds: ['c-leo', 'c-mira'],
    })
    expect(matchPickup(seed.guardians, seed.pickups, '4488')?.name).toBe('Kiran Shah')
    expect(matchPickup(seed.guardians, seed.pickups, '1111')).toBeNull()
    expect(matchPickup(seed.guardians, seed.pickups, '448')).toBeNull()
  })
})

describe('roomLoad and openSeat', () => {
  const seed = createSeed()
  const rooms = seed.classrooms.filter((r) => r.siteId === 'site-grove')
  const present = seed.children.filter((c) =>
    seed.attendance.some((a) => a.childId === c.id && a.date === today() && a.checkIn && !a.checkOut),
  )

  it('starts the demo day inside ratio', () => {
    const loads = roomLoad({ rooms, present, staff: seed.staff })
    expect(loads.every((r) => r.ok)).toBe(true)
    expect(loads.find((r) => r.id === 'room-oaks')?.inRoom).toBe(3)
  })

  it('breaks the ratio when the only playgroup teacher clocks out', () => {
    const staff = seed.staff.map((s) => (s.id === 's-nina' ? { ...s, clockedIn: undefined } : s))
    const acorns = roomLoad({ rooms, present, staff }).find((r) => r.id === 'room-acorns')
    expect(acorns?.ok).toBe(false)
    expect(acorns?.needed).toBe(1)
  })

  it('offers the earliest family that fits an open room', () => {
    const enrolledByRoom = Object.fromEntries(rooms.map((r) => [r.id, 0]))
    for (const child of seed.children) {
      if (child.status !== 'enrolled') continue
      enrolledByRoom[child.classroomId] = (enrolledByRoom[child.classroomId] ?? 0) + 1
    }
    const seat = openSeat({ rooms, enrolledByRoom, applications: seed.applications })
    expect(seat?.childName).toBe('Rue Patel')
    expect(seat?.seats).toBeGreaterThan(0)
  })
})

describe('money, supplies, naps, vaccines, story', () => {
  const seed = createSeed()

  it('picks the largest open balance', () => {
    expect(biggestBalance(seed.invoices)?.id).toBe('INV-1042')
    expect(biggestBalance([{ id: 'a', familyName: 'A', amount: 10, paid: 10, status: 'paid' }])).toBeNull()
  })

  it('marks stock at or under the reorder line as urgent', () => {
    const rows = supplyOutlook(seed.inventory, 5)
    expect(rows.find((r) => r.id === 'inv3')?.urgent).toBe(true)
    expect(rows[0].urgent).toBe(true)
  })

  it('knows when a nap is open, due, or finished', () => {
    expect(napAdvice(2, [{ start: '09:40', end: '' }], 600).phase).toBe('asleep')
    expect(napAdvice(2, [{ start: '09:40', end: '11:05' }], 15 * 60).phase).toBe('due')
    expect(napAdvice(5, [{ start: '13:00', end: '14:20' }], 15 * 60).phase).toBe('settled')
  })

  it('counts days until the next open vaccine', () => {
    const due = nextVaccine(
      [{ childName: 'Noah', vaccine: 'MR', dueDate: '2026-11-02', status: 'overdue' }],
      '2026-11-04',
    )
    expect(due?.days).toBe(-2)
    expect(due?.label).toMatch(/overdue/)
  })

  it('weaves a day story without pins or phone numbers', () => {
    const story = weaveDayStory({
      centre: 'Willow Grove',
      present: ['Leo Shah'],
      moods: [{ name: 'Leo Shah', mood: 'Curious' }],
      clashes: ['Leo Shah · Peanuts'],
      asleep: [],
    })
    expect(story).toMatch(/Leo Shah/)
    expect(story).not.toMatch(/\d{4}/)
    expect(story).not.toMatch(/PIN/i)
  })
})
