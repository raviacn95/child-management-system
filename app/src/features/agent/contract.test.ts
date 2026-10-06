import { describe, expect, it } from 'vitest'
import { GENRES, KINDS, LANGS, PAGE_IDS, PLATFORMS, parseAgentReply } from '../../../../supabase/functions/willow-agent/agent.mts'
import { platforms } from '../movies/catalog'
import { movieKindSchema, movieLangSchema } from '../movies/schema'
import { AGENT_GENRES, AGENT_PAGES, AGENT_PLATFORMS, agentReplySchema } from './schema'

describe('app and Edge Function agree on the action contract', () => {
  it('uses the same pages, languages, kinds, genres, and platforms', () => {
    expect([...PAGE_IDS]).toEqual([...AGENT_PAGES])
    expect([...LANGS]).toEqual([...movieLangSchema.options])
    expect([...KINDS]).toEqual([...movieKindSchema.options])
    expect([...GENRES]).toEqual([...AGENT_GENRES])
    expect([...PLATFORMS]).toEqual([...AGENT_PLATFORMS])
  })

  it('only names platforms the catalog knows', () => {
    const known = new Set(platforms.map((p) => p.id))
    expect(AGENT_PLATFORMS.filter((id) => !known.has(id))).toEqual([])
  })

  it('every reply the server can produce passes the app schema', () => {
    const samples = [
      '{"say":"Opening.","action":{"type":"navigate","page":"tv-link"}}',
      '{"say":"Picks.","action":{"type":"find_movies","language":"ko","kind":"series","genre":"scifi","decade":2015,"platform":"mubi","query":"space"}}',
      '{"say":"Here.","action":{"type":"open_movie","title":"Premalu","year":2024,"platform":"hotstar"}}',
      'garbage',
    ]
    for (const raw of samples) expect(agentReplySchema.safeParse(parseAgentReply(raw)).success).toBe(true)
  })
})
