import { z } from 'zod'
import { movieKindSchema, movieLangSchema } from '../movies/schema'

/** Mirrors supabase/functions/willow-agent/agent.mts; contract.test.ts fails if the two drift. */
export const AGENT_PAGES = [
  'dashboard',
  'hub',
  'movies',
  'tv',
  'ott',
  'learning',
  'grow',
  'parent-feed',
  'meals',
  'shop',
  'calendar',
  'messages',
  'children',
  'attendance',
  'daily-care',
  'health',
  'billing',
  'staff',
  'classrooms',
  'transport',
  'documents',
  'workers',
  'enrollment',
  'inventory',
  'reports',
  'settings',
  'tv-link',
  'pricing',
  'get-app',
] as const

export const AGENT_GENRES = [
  'drama',
  'comedy',
  'thriller',
  'romance',
  'action',
  'family',
  'sport',
  'crime',
  'biopic',
  'music',
  'horror',
  'animation',
  'scifi',
  'mystery',
  'fantasy',
  'war',
  'documentary',
  'period',
] as const

export const AGENT_PLATFORMS = [
  'netflix',
  'prime',
  'hotstar',
  'sonyliv',
  'zee5',
  'jiocinema',
  'youtube',
  'appletv',
  'sunnxt',
  'aha',
  'manoramamax',
  'mubi',
  'disney',
] as const

export const agentPageSchema = z.enum(AGENT_PAGES)
export const agentGenreSchema = z.enum(AGENT_GENRES)
export const agentPlatformSchema = z.enum(AGENT_PLATFORMS)

export const movieFiltersSchema = z.object({
  query: z.string().max(60).optional(),
  language: movieLangSchema.optional(),
  kind: movieKindSchema.optional(),
  genre: agentGenreSchema.optional(),
  decade: z.number().int().min(1920).max(2030).optional(),
  platform: agentPlatformSchema.optional(),
})

export const agentActionSchema = z.discriminatedUnion('type', [
  z.object({ type: z.literal('navigate'), page: agentPageSchema }),
  movieFiltersSchema.extend({ type: z.literal('find_movies') }),
  z.object({
    type: z.literal('open_movie'),
    title: z.string().min(1).max(80),
    year: z.number().int().min(1900).max(2100).optional(),
    platform: agentPlatformSchema.optional(),
  }),
  z.object({ type: z.literal('none') }),
])

export const agentReplySchema = z.object({ say: z.string().min(1).max(200), action: agentActionSchema })
export const agentErrorSchema = z.object({ error: z.string().max(40), say: z.string().min(1).max(200) })

export type AgentPage = z.infer<typeof agentPageSchema>
export type AgentGenre = z.infer<typeof agentGenreSchema>
export type AgentPlatform = z.infer<typeof agentPlatformSchema>
export type MovieFilters = z.infer<typeof movieFiltersSchema>
export type AgentAction = z.infer<typeof agentActionSchema>
export type AgentReply = z.infer<typeof agentReplySchema>
export type AgentSource = 'local' | 'ai' | 'offline'
export type AgentTurn = AgentReply & { source: AgentSource }

export const HELP_SAY = 'I can open Willow pages and find movies. Try "Hindi comedy movies", "play Drishyam", or "open Learning".'
export const ADULT_SAY = 'I only find family titles. Adult titles stay on their own 18+ shelf.'
export const PRIVATE_SAY = 'Leave out names, numbers, and health details, then try again.'
