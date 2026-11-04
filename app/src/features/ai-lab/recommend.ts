export type Energy = 'low' | 'medium' | 'high'
export type Weather = 'rainy' | 'sunny'

export interface ActivityCard {
  id: string
  title: string
  indoor: boolean
  energy: Energy
  moods: string[]
  minAge: number
  maxAge: number
}

export const ACTIVITY_CATALOG: ActivityCard[] = [
  { id: 'treasure', title: 'Indoor treasure hunt', indoor: true, energy: 'high', moods: ['happy', 'curious', 'energetic'], minAge: 3, maxAge: 8 },
  { id: 'blocks', title: 'Block challenge', indoor: true, energy: 'high', moods: ['happy', 'curious', 'focused'], minAge: 2, maxAge: 8 },
  { id: 'animals', title: 'Animal movement game', indoor: true, energy: 'high', moods: ['happy', 'energetic'], minAge: 2, maxAge: 7 },
  { id: 'puzzle', title: 'Puzzle table', indoor: true, energy: 'medium', moods: ['curious', 'focused', 'calm'], minAge: 3, maxAge: 8 },
  { id: 'story', title: 'Quiet picture story', indoor: true, energy: 'low', moods: ['calm', 'tired'], minAge: 2, maxAge: 10 },
  { id: 'garden', title: 'Garden walk', indoor: false, energy: 'medium', moods: ['calm', 'curious'], minAge: 2, maxAge: 10 },
]

export function rankActivities(input: { age: number; mood: string; energy: Energy; weather: Weather }) {
  const mood = input.mood.trim().toLowerCase()
  const ranked = ACTIVITY_CATALOG.map((activity) => {
    const reasons: string[] = []
    let score = 0
    if (input.age < activity.minAge || input.age > activity.maxAge) {
      return { activity, score: 0, reasons: ['outside the age band'] }
    }
    score += 1
    reasons.push('age band fits')
    if (input.weather === 'rainy' && activity.indoor) {
      score += 3
      reasons.push('indoor on a rainy day')
    }
    if (input.weather === 'sunny' && !activity.indoor) {
      score += 2
      reasons.push('outdoor weather')
    }
    if (activity.energy === input.energy) {
      score += 2
      reasons.push('energy match')
    }
    if (activity.moods.includes(mood)) {
      score += 2
      reasons.push('mood match')
    }
    return { activity, score, reasons }
  })
  return ranked.sort((a, b) => b.score - a.score || a.activity.title.localeCompare(b.activity.title))
}
