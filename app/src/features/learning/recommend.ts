import type { z } from 'zod'
import type { AgeBand, Child, LearningChannel, LearningInterest, RankedChannel, RecommendationOutput } from '../../types'
import { ageMonths } from '../../lib'
import { getPackByAgeBand, listChannels, ageBandFromYears } from './learningPacks'
import { recommendationInputSchema, recommendationOutputSchema } from './schema'

export type RecommendationInput = z.infer<typeof recommendationInputSchema>
export { ageBandFromYears } from './learningPacks'

const STAGE_BAND: Record<string, AgeBand> = {
  playgroup: '2-5',
  nursery: '2-5',
  lkg: '5-8',
  ukg: '5-8',
}

const STAGE_INTERESTS: Record<string, LearningInterest[]> = {
  playgroup: ['music', 'stories', 'movement'],
  nursery: ['stories', 'math', 'art'],
  lkg: ['art', 'science', 'math'],
  ukg: ['science', 'math', 'art'],
}

export function yearsFromDob(dob: string) {
  return Math.max(0, ageMonths(dob) / 12)
}

export function interestsForChild(child: Pick<Child, 'stage' | 'interests'>): LearningInterest[] {
  if (child.interests?.length) return child.interests
  return STAGE_INTERESTS[child.stage ?? ''] ?? ['stories', 'science']
}

export function inputFromChild(
  child: Child,
  countryCode?: string,
): RecommendationInput {
  return {
    childId: child.id,
    childName: `${child.firstName} ${child.lastName}`,
    ageYears: yearsFromDob(child.dob),
    stage: child.stage,
    interests: interestsForChild(child),
    allergies: child.allergies.map((a) => a.name),
    countryCode,
  }
}

export function resolveAgeBand(input: RecommendationInput): AgeBand {
  const fromAge = ageBandFromYears(input.ageYears)
  const fromStage = input.stage ? STAGE_BAND[input.stage.toLowerCase()] : undefined
  if (fromStage && input.ageYears < 8) return fromAge
  return fromStage && input.ageYears >= 8 ? fromAge : fromAge
}

function anekalTip(band: AgeBand, country?: string) {
  if (country && country !== 'IN') return undefined
  return getPackByAgeBand(band)?.anekalTip
}

function safeguards(input: RecommendationInput): string[] {
  const notes = [
    'Turn autoplay off — the algorithm can drift into non-educational videos.',
    'Prefer YouTube Kids or a curated pack instead of the main Home feed.',
    'Co-view: one question after the clip turns watching into learning.',
    'Check ads: some channels are ad-light, others are not.',
  ]
  if (input.allergies.length) {
    notes.push(
      `Allergy note (${input.allergies.join(', ')}): skip snack/cooking videos; stick to the listed learning channels.`,
    )
  }
  return notes
}

function scoreChannel(channel: LearningChannel, band: AgeBand, interests: LearningInterest[]) {
  const reasons: string[] = []
  let score = 0
  if (channel.ageBands.includes(band)) {
    score += 6
    reasons.push(`Curated for ages ${band}`)
  } else {
    score -= 4
  }
  const hits = channel.interests.filter((i) => interests.includes(i))
  if (hits.length) {
    score += hits.length * 3
    reasons.push(`Matches ${hits.join(', ')}`)
  }
  const extra = channel.interests.filter((i) => !interests.includes(i)).length
  if (hits.length && extra === 0) {
    score += 3
    reasons.push('Focused on those interests')
  }
  if (channel.adLight) {
    score += 2
    reasons.push('Ad-light')
  }
  if (channel.youtubeKids && band !== '8-12') {
    score += 2
    reasons.push('YouTube Kids friendly')
  }
  if (channel.autoplaySafe) {
    score += 1
    reasons.push('Safer if a video ends')
  }
  return { score, reasons }
}

export function recommend(raw: RecommendationInput): RecommendationOutput {
  const input = recommendationInputSchema.parse(raw)
  const ageBand = resolveAgeBand(input)
  const pack = getPackByAgeBand(ageBand)
  const interests: LearningInterest[] = input.interests.length
    ? (input.interests as LearningInterest[])
    : ['stories']
  const featured = new Set(pack?.featuredChannelIds ?? [])
  const ranked: RankedChannel[] = listChannels()
    .map((channel) => {
      const { score, reasons } = scoreChannel(channel, ageBand, interests)
      const boost = featured.has(channel.id) ? 4 : 0
      if (boost) reasons.push('Featured in this age pack')
      return { ...channel, score: score + boost, reasons }
    })
    .filter((c) => c.ageBands.includes(ageBand) || (c.score >= 5 && interests.some((i) => c.interests.includes(i))))
    .sort((a, b) => b.score - a.score)

  const inBand = ranked.filter((c) => c.ageBands.includes(ageBand))
  const extras = ranked.filter((c) => !c.ageBands.includes(ageBand)).slice(0, 2)
  const channels = [...inBand, ...extras]

  const output: RecommendationOutput = {
    ageBand,
    childName: input.childName,
    channels,
    playlist: channels.map((c) => ({ channelId: c.id, url: c.playlistUrl ?? c.youtubeUrl })),
    safeguards: safeguards(input),
    anekalTip: anekalTip(ageBand, input.countryCode),
  }
  return recommendationOutputSchema.parse(output)
}
