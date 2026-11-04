export interface ToolStep {
  tool: string
  result: string
}

export function planClassroom(input: {
  prompt: string
  present: number
  moods: string[]
  napMinutes: number[]
  weather: 'rainy' | 'sunny'
  teachers: number
}) {
  const nap =
    input.napMinutes.length > 0
      ? Math.round(input.napMinutes.reduce((sum, minutes) => sum + minutes, 0) / input.napMinutes.length)
      : 0
  const steps: ToolStep[] = [
    { tool: 'read_attendance', result: `${input.present} children present` },
    { tool: 'read_moods', result: input.moods.filter(Boolean).join(', ') || 'no moods logged' },
    { tool: 'read_naps', result: nap ? `average nap ${nap} minutes` : 'no naps logged' },
    { tool: 'read_weather', result: input.weather },
    { tool: 'read_ratio', result: `${input.present} children for ${input.teachers} teachers` },
  ]
  const energetic = /energetic|energy|high/i.test(input.prompt) || input.moods.some((mood) => /curious|happy|energetic|focused/i.test(mood))
  const schedule: string[] = []
  if (input.weather === 'rainy') schedule.push('Keep the welcome indoors')
  schedule.push(energetic ? 'High-energy block challenge' : 'Calm table work')
  if (nap >= 60) schedule.push('Rest after lunch')
  schedule.push('Story, then pickup')
  return {
    steps,
    schedule,
    caution: 'The plan is a draft from today’s counts. The teacher still sets the day.',
  }
}

export function simulateRoom(input: { children: number; teachers: number; absentStaff: number; weather: 'rainy' | 'sunny' }) {
  const onDuty = Math.max(input.teachers - input.absentStaff, 0)
  const ratio = onDuty === 0 ? null : Number((input.children / onDuty).toFixed(1))
  const bottlenecks: string[] = []
  if (onDuty === 0) bottlenecks.push('No teachers on duty')
  else if (ratio != null && ratio > 8) bottlenecks.push(`Ratio ${input.children}:${onDuty} is above 8:1`)
  if (input.weather === 'rainy') bottlenecks.push('Rain moves the group indoors')
  return {
    ratio,
    energy: input.weather === 'rainy' ? 'High indoor energy' : 'Mixed indoor and outdoor energy',
    bottlenecks,
    caution: 'A planning sketch from the numbers you entered. It does not predict a real room.',
  }
}
