export type AllergyChip = { name: string; severity: string }

export type NamedChild = { id: string; name: string; allergies: AllergyChip[] }

export type Clash = {
  childId: string
  name: string
  allergy: string
  severity: string
  because: string
}

const FAMILIES: { words: string[] }[] = [
  { words: ['peanut', 'peanuts'] },
  { words: ['dairy', 'milk', 'curd', 'cheese', 'butter', 'paneer', 'yogurt', 'yoghurt'] },
  { words: ['egg', 'eggs'] },
  { words: ['strawberry', 'strawberries'] },
  { words: ['gluten', 'wheat', 'roti'] },
  { words: ['soy', 'soya'] },
  { words: ['sesame'] },
  { words: ['shellfish', 'prawn', 'shrimp'] },
]

export const MOODS = ['Calm', 'Curious', 'Joyful', 'Tired', 'Wiggly', 'Needs a hug'] as const

export function ageInYears(dob: string, now = new Date()) {
  const born = new Date(dob)
  if (Number.isNaN(born.getTime())) return 0
  let years = now.getFullYear() - born.getFullYear()
  const month = now.getMonth() - born.getMonth()
  if (month < 0 || (month === 0 && now.getDate() < born.getDate())) years -= 1
  return Math.max(0, years)
}

function familyWords(allergyName: string) {
  const name = allergyName.toLowerCase()
  const words = FAMILIES.filter((family) => family.words.some((word) => name.includes(word))).flatMap(
    (family) => family.words,
  )
  return [...new Set([name, ...words])]
}

export function menuClashes(menuText: string, children: NamedChild[]): Clash[] {
  const hay = menuText.toLowerCase()
  const clashes: Clash[] = []
  for (const child of children) {
    for (const allergy of child.allergies) {
      const because = familyWords(allergy.name).find((word) => hay.includes(word))
      if (!because) continue
      clashes.push({
        childId: child.id,
        name: child.name,
        allergy: allergy.name,
        severity: allergy.severity,
        because,
      })
    }
  }
  return clashes
}

export function probeFood(query: string, children: NamedChild[]): Clash[] {
  const q = query.trim().toLowerCase()
  if (q.length < 3) return []
  const clashes: Clash[] = []
  for (const child of children) {
    for (const allergy of child.allergies) {
      const words = familyWords(allergy.name)
      if (!words.some((word) => q.includes(word) || word.includes(q))) continue
      clashes.push({
        childId: child.id,
        name: child.name,
        allergy: allergy.name,
        severity: allergy.severity,
        because: q,
      })
    }
  }
  return clashes
}

export function matchPickup(
  guardians: {
    name: string
    relationship: string
    childIds: string[]
    authorizedPickup: boolean
    pin: string
  }[],
  extras: { name: string; relationship: string; childId: string; pin: string }[],
  pin: string,
) {
  if (!/^\d{4}$/.test(pin)) return null
  const guardian = guardians.find((person) => person.authorizedPickup && person.pin === pin)
  if (guardian) {
    return { name: guardian.name, relationship: guardian.relationship, childIds: guardian.childIds }
  }
  const extra = extras.find((person) => person.pin === pin)
  if (!extra) return null
  return { name: extra.name, relationship: extra.relationship, childIds: [extra.childId] }
}

export function centreClock(now: Date) {
  const hour = now.getHours()
  if (hour >= 7 && hour < 19) return { date: now, projected: false }
  const date = new Date(now)
  date.setHours(15, now.getMinutes(), now.getSeconds(), 0)
  return { date, projected: true }
}

export function elapsedOnSite(checkIn: string, now: Date) {
  const [hours, mins] = checkIn.split(':').map(Number)
  if (!Number.isFinite(hours) || !Number.isFinite(mins)) return { minutes: 0, seconds: 0 }
  const start = new Date(now)
  start.setHours(hours, mins, 0, 0)
  const diff = Math.max(0, Math.floor((now.getTime() - start.getTime()) / 1000))
  return { minutes: Math.floor(diff / 60), seconds: diff % 60 }
}

export function formatElapsed(elapsed: { minutes: number; seconds: number }) {
  const hours = Math.floor(elapsed.minutes / 60)
  const mins = String(elapsed.minutes % 60).padStart(2, '0')
  const seconds = String(elapsed.seconds).padStart(2, '0')
  if (hours > 0) return `${hours}h ${mins}m ${seconds}s`
  return `${elapsed.minutes}m ${seconds}s`
}

type Room = { id: string; name: string; ratioStaff: number; ratioChildren: number; capacity: number }
type StaffOn = { id: string; name: string; classroomIds: string[]; clockedIn?: string }

export function roomLoad(input: { rooms: Room[]; present: { classroomId: string }[]; staff: StaffOn[] }) {
  return input.rooms.map((room) => {
    const inRoom = input.present.filter((child) => child.classroomId === room.id).length
    const onDuty = input.staff.filter((person) => person.clockedIn && person.classroomIds.includes(room.id))
    const needed = inRoom === 0 ? 0 : Math.ceil(inRoom / room.ratioChildren) * room.ratioStaff
    return {
      id: room.id,
      name: room.name,
      inRoom,
      staffOn: onDuty.length,
      staffNames: onDuty.map((person) => person.name),
      needed,
      ok: onDuty.length >= needed,
      openSeats: Math.max(0, room.capacity - inRoom),
    }
  })
}

export function openSeat(input: {
  rooms: { id: string; name: string; capacity: number }[]
  enrolledByRoom: Record<string, number>
  applications: { id: string; childName: string; classroomId: string; status: string; desiredStart: string }[]
}) {
  const waiting = new Set(['waitlist', 'tour', 'applied'])
  const fits = input.applications
    .filter((app) => waiting.has(app.status))
    .flatMap((app) => {
      const room = input.rooms.find((item) => item.id === app.classroomId)
      if (!room) return []
      const seats = room.capacity - (input.enrolledByRoom[room.id] ?? 0)
      if (seats <= 0) return []
      return [{ id: app.id, childName: app.childName, roomName: room.name, seats, desiredStart: app.desiredStart }]
    })
    .sort((a, b) => a.desiredStart.localeCompare(b.desiredStart))
  return fits[0] ?? null
}

const BURN: Record<string, number> = { Care: 0.2, Health: 0.08, Kitchen: 0.15, Classroom: 0.05 }

export function supplyOutlook(
  items: { id: string; name: string; category: string; qty: number; unit: string; reorderAt: number }[],
  present: number,
) {
  return items
    .map((item) => {
      const perDay = present * (BURN[item.category] ?? 0.05)
      const daysLeft = perDay <= 0 ? null : Math.floor(item.qty / perDay)
      const urgent = item.qty <= item.reorderAt || (daysLeft != null && daysLeft < 4)
      const restock = Math.max(item.reorderAt, item.reorderAt * 2 - item.qty)
      return { ...item, daysLeft, urgent, restock }
    })
    .sort((a, b) => Number(b.urgent) - Number(a.urgent) || (a.daysLeft ?? 999) - (b.daysLeft ?? 999))
}

export function biggestBalance(
  invoices: { id: string; familyName: string; amount: number; paid: number; status: string }[],
) {
  const open = invoices.filter((invoice) => invoice.status !== 'paid' && invoice.amount > invoice.paid)
  if (!open.length) return null
  return [...open].sort((a, b) => b.amount - b.paid - (a.amount - a.paid))[0]
}

function clockMinutes(hhmm: string) {
  const [hours, mins] = hhmm.split(':').map(Number)
  return (hours || 0) * 60 + (mins || 0)
}

export function napAdvice(ageYears: number, naps: { start: string; end: string }[], nowMinutes: number) {
  const open = naps.find((nap) => nap.start && !nap.end)
  if (open) return { phase: 'asleep' as const, detail: `Asleep since ${open.start}.` }
  const ended = naps.filter((nap) => nap.end)
  const last = ended.length ? Math.max(...ended.map((nap) => clockMinutes(nap.end))) : null
  if (ageYears < 3) {
    if (last == null || nowMinutes - last >= 180) {
      return { phase: 'due' as const, detail: 'Under three: a nap is due about every three hours.' }
    }
    return { phase: 'settled' as const, detail: 'The last nap is still inside the three-hour window.' }
  }
  const afternoon = naps.some((nap) => clockMinutes(nap.start) >= 12 * 60)
  if (!afternoon && nowMinutes >= 12 * 60 && nowMinutes < 15 * 60) {
    return { phase: 'due' as const, detail: 'Quiet time is open this afternoon.' }
  }
  if (!afternoon && nowMinutes >= 15 * 60) {
    return { phase: 'settled' as const, detail: 'Quiet time has passed for today.' }
  }
  return {
    phase: 'settled' as const,
    detail: afternoon ? 'Afternoon rest is already logged.' : 'Morning is still for play.',
  }
}

export function nextVaccine(
  rows: { childName: string; vaccine: string; dueDate: string; status: string }[],
  todayIso: string,
) {
  const open = rows
    .filter((row) => row.status !== 'complete')
    .sort((a, b) => a.dueDate.localeCompare(b.dueDate))
  const next = open[0]
  if (!next) return null
  const days = Math.round((Date.parse(next.dueDate) - Date.parse(todayIso)) / 86_400_000)
  const label = days < 0 ? `${Math.abs(days)} days overdue` : days === 0 ? 'due today' : `in ${days} days`
  return { ...next, days, label }
}

export function weaveDayStory(input: {
  centre: string
  present: string[]
  moods: { name: string; mood: string }[]
  clashes: string[]
  asleep: string[]
}) {
  const here = input.present.length
    ? `${input.present.length} children are in ${input.centre} right now (${input.present.slice(0, 4).join(', ')}).`
    : `${input.centre} is quiet. Nobody is checked in.`
  const mood = input.moods
    .filter((row) => row.mood)
    .slice(0, 3)
    .map((row) => `${row.name} feels ${row.mood.toLowerCase()}`)
    .join('; ')
  const sleep = input.asleep.length
    ? `${input.asleep.join(' and ')} ${input.asleep.length === 1 ? 'is' : 'are'} asleep.`
    : 'Nobody is mid-nap.'
  const safe = input.clashes.length
    ? `Kitchen watch: ${input.clashes.slice(0, 3).join('; ')}.`
    : 'Today’s menu does not clash with the allergies on file.'
  return [here, mood ? `${mood}.` : '', sleep, safe].filter(Boolean).join(' ')
}
