export interface ToolStep {
  tool: string
  reason: string
  result: string
}

export interface PlanInput {
  prompt: string
  present: number
  moods: string[]
  napMinutes: number[]
  weather: 'rainy' | 'sunny'
  teachers: number
}

const PLAN = /plan|schedule|tomorrow|classroom|day/i

function nextAction(goal: string, known: Set<string>): { tool: string; reason: string } | null {
  const planning = PLAN.test(goal)
  if (planning && !known.has('attendance')) {
    return { tool: 'read_attendance', reason: 'A plan needs who is here before any block is written.' }
  }
  if (!known.has('weather') && (planning || /weather|rain|sun/i.test(goal))) {
    return { tool: 'read_weather', reason: 'Weather decides whether the group stays inside.' }
  }
  if (planning && !known.has('moods') && /mood|energy|energetic|calm|classroom/i.test(goal)) {
    return { tool: 'read_moods', reason: 'The goal asks about the feel of the room.' }
  }
  if (planning && !known.has('naps')) {
    return { tool: 'read_naps', reason: 'Rest only goes on the schedule after the nap notes are read.' }
  }
  if (planning && !known.has('ratio')) {
    return { tool: 'read_ratio', reason: 'The plan should notice when the room is short-staffed.' }
  }
  if (planning && !known.has('schedule')) {
    return { tool: 'write_schedule', reason: 'The facts are in, so the next action is to write the blocks.' }
  }
  return null
}

function scheduleFrom(input: PlanInput, nap: number) {
  const energetic =
    /energetic|energy|high/i.test(input.prompt) || input.moods.some((mood) => /curious|happy|energetic|focused/i.test(mood))
  const schedule: string[] = []
  if (input.weather === 'rainy') schedule.push('Keep the welcome indoors')
  schedule.push(energetic ? 'High-energy block challenge' : 'Calm table work')
  if (nap >= 60) schedule.push('Rest after lunch')
  schedule.push('Story, then pickup')
  return schedule
}

export function planClassroom(input: PlanInput) {
  const nap =
    input.napMinutes.length > 0
      ? Math.round(input.napMinutes.reduce((sum, minutes) => sum + minutes, 0) / input.napMinutes.length)
      : 0
  const known = new Set<string>()
  const steps: ToolStep[] = []
  let schedule: string[] = []
  for (let turn = 0; turn < 8; turn += 1) {
    const action = nextAction(input.prompt, known)
    if (!action) break
    known.add(action.tool === 'write_schedule' ? 'schedule' : action.tool.replace('read_', ''))
    if (action.tool === 'read_attendance') {
      steps.push({ ...action, result: `${input.present} children present` })
    } else if (action.tool === 'read_moods') {
      steps.push({ ...action, result: input.moods.filter(Boolean).join(', ') || 'no moods logged' })
    } else if (action.tool === 'read_naps') {
      steps.push({ ...action, result: nap ? `average nap ${nap} minutes` : 'no naps logged' })
    } else if (action.tool === 'read_weather') {
      steps.push({ ...action, result: input.weather })
    } else if (action.tool === 'read_ratio') {
      steps.push({ ...action, result: `${input.present} children for ${input.teachers} teachers` })
    } else {
      schedule = scheduleFrom(input, nap)
      steps.push({ ...action, result: schedule.join('; ') })
    }
  }
  return {
    steps,
    schedule,
    caution: 'Each step is chosen from what is still unknown. The teacher still sets the day.',
  }
}

export interface SimTick {
  block: string
  high: number
  note: string
}

const BLOCKS = ['Arrival', 'Morning', 'Lunch', 'Rest', 'Afternoon', 'Pickup']

function nextEnergy(energy: number, block: string, weather: 'rainy' | 'sunny') {
  if (block === 'Morning' && weather === 'rainy') return Math.min(2, energy + 1)
  if (block === 'Rest') return Math.max(0, energy - 1)
  if (block === 'Afternoon' && weather === 'sunny') return Math.max(0, energy - 1)
  return energy
}

export function simulateRoom(input: { children: number; teachers: number; absentStaff: number; weather: 'rainy' | 'sunny' }) {
  const onDuty = Math.max(input.teachers - input.absentStaff, 0)
  const ratio = onDuty === 0 ? null : Number((input.children / onDuty).toFixed(1))
  let energies = Array.from({ length: Math.max(input.children, 0) }, () => 1)
  const ticks: SimTick[] = BLOCKS.map((block) => {
    energies = energies.map((energy) => nextEnergy(energy, block, input.weather))
    const high = energies.filter((energy) => energy >= 2).length
    const cover = onDuty * (block === 'Lunch' || block === 'Pickup' ? 6 : 8)
    const overflow = onDuty > 0 && input.children > cover ? input.children - cover : 0
    const crowd = overflow > 0 ? `, ${overflow} more than the staff can cover` : ''
    return { block, high, note: `${high} of ${input.children} at high energy${crowd}` }
  })
  const bottlenecks: string[] = []
  if (onDuty === 0) bottlenecks.push('No teachers on duty')
  else if (ratio != null && ratio > 8) bottlenecks.push(`Ratio ${input.children}:${onDuty} is above 8:1`)
  if (input.weather === 'rainy') bottlenecks.push('Rain moves the group indoors')
  const crowded = ticks.find((tick) => tick.high > 0 && tick.note.includes('more than the staff'))
  if (crowded) bottlenecks.push(`${crowded.block} crowd: ${crowded.note}`)
  const peak = ticks.reduce((best, tick) => (tick.high > best.high ? tick : best), ticks[0])
  return {
    ratio,
    energy: input.weather === 'rainy' ? 'High indoor energy' : 'Mixed indoor and outdoor energy',
    bottlenecks,
    ticks,
    peak: peak ? `${peak.block} peaks at ${peak.high} high-energy children` : '',
    caution: 'Each child has an energy number that moves by block. This is a model of the day, not a forecast of a real room.',
  }
}
