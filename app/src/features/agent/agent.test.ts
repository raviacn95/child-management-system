import { describe, expect, it, vi } from 'vitest'
import { titles } from '../movies/catalog'
import { agentEndpoint, askAgent, safeAgentUrl } from './client'
import { localIntent } from './localIntent'
import { describeFilters, findMovies, matchTitle, searchLinks, searchPhrase } from './movieSearch'
import { pagePath } from './pages'
import { privateReason, rosterNames } from './privacy'
import { runAgent } from './runAgent'
import { ADULT_SAY, HELP_SAY, PRIVATE_SAY } from './schema'

const find = (title: string, year?: number) => matchTitle(title, year)
const CTX = { tv: false, connectedIds: [], adFreeIds: [], preferAdFree: true }

function jsonFetch(body: unknown, status = 200) {
  return vi.fn(async () => new Response(JSON.stringify(body), { status })) as unknown as typeof fetch & ReturnType<typeof vi.fn>
}

describe('local intent', () => {
  it('opens pages from plain words', () => {
    expect(localIntent('go to Learning', find)?.action).toEqual({ type: 'navigate', page: 'learning' })
    expect(localIntent('take me to my OTTs page', find)?.action).toEqual({ type: 'navigate', page: 'ott' })
    expect(localIntent('settings', find)?.action).toEqual({ type: 'navigate', page: 'settings' })
    expect(localIntent('watch TV', find)?.action).toEqual({ type: 'navigate', page: 'tv' })
    expect(localIntent('Pair my TV', find)).toEqual({ say: 'Opening Link phone and TV.', action: { type: 'navigate', page: 'tv-link' } })
  })

  it('turns movie wishes into filters', () => {
    expect(localIntent('Hindi comedy movies', find)?.action).toEqual({ type: 'find_movies', language: 'hi', genre: 'comedy', kind: 'movie' })
    expect(localIntent('malayalam thrillers', find)?.action).toEqual({ type: 'find_movies', language: 'ml', genre: 'thriller' })
    expect(localIntent('korean series from the 2010s on netflix', find)?.action).toEqual({
      type: 'find_movies',
      language: 'ko',
      kind: 'series',
      decade: 2010,
      platform: 'netflix',
    })
    expect(localIntent('show me something funny to watch', find)?.action).toMatchObject({ type: 'find_movies', genre: 'comedy' })
    expect(localIntent('what should we watch?', find)).toEqual({ say: 'Here are top family picks.', action: { type: 'find_movies' } })
    expect(localIntent('movies about wrestling', find)?.action).toEqual({ type: 'find_movies', kind: 'movie', query: 'wrestling' })
  })

  it('plays named titles, with platform and year when given', () => {
    expect(localIntent('play Drishyam on Prime Video', find)?.action).toEqual({ type: 'open_movie', title: 'Drishyam', year: 2013, platform: 'prime' })
    expect(localIntent('Drishyam 2', find)?.action).toMatchObject({ type: 'open_movie', title: 'Drishyam 2', year: 2021 })
    expect(localIntent('watch Moonlit Harbour 2019 on netflix', find)).toEqual({
      say: 'Searching official apps for Moonlit Harbour.',
      action: { type: 'open_movie', title: 'Moonlit Harbour', year: 2019, platform: 'netflix' },
    })
    expect(localIntent('watch hindi movies on netflix', find)?.action).toEqual({ type: 'find_movies', language: 'hi', kind: 'movie', platform: 'netflix' })
  })

  it('refuses adult asks and leaves open questions to the AI', () => {
    expect(localIntent('show erotic movies', find)).toEqual({ say: ADULT_SAY, action: { type: 'none' } })
    expect(localIntent('what is a good bedtime routine', find)).toBeNull()
    expect(localIntent('x', find)).toBeNull()
  })

  it('in strict mode only answers wishes made of filter words', () => {
    expect(localIntent('Hindi comedy movies on Prime Video', find, true)?.action).toEqual({
      type: 'find_movies',
      language: 'hi',
      genre: 'comedy',
      kind: 'movie',
      platform: 'prime',
    })
    expect(localIntent('movies about wrestling from the 90s', find, true)?.action).toMatchObject({ query: 'wrestling', decade: 1990 })
    expect(localIntent('a cosy film for a rainy evening', find, true)).toBeNull()
    expect(localIntent('a cosy film for a rainy evening', find, false)?.action).toMatchObject({ type: 'find_movies' })
  })
})

describe('movie search', () => {
  it('matches exact titles before partial ones and never guesses short words', () => {
    expect(matchTitle('drishyam')?.id).toBe('drishyam')
    expect(matchTitle('DRISHYAM 2')?.id).toBe('drishyam-2')
    expect(matchTitle('the')).toBeNull()
    expect(matchTitle('nna thaan')?.id).toBe('nna-thaan')
  })

  it('keeps every filter and only family titles', () => {
    const found = findMovies({ language: 'ml', genre: 'comedy' }, CTX)
    expect(found.length).toBeGreaterThan(2)
    expect(found.length).toBeLessThanOrEqual(6)
    expect(found.every((t) => t.originalLang === 'ml' && t.genres.includes('comedy') && !t.adult)).toBe(true)
    expect(found.every((t) => t.watchLinks.length > 0)).toBe(true)
    const nineties = findMovies({ decade: 1990 }, CTX, 20)
    expect(nineties.every((t) => t.year >= 1990 && t.year < 2000)).toBe(true)
  })

  it('narrows by topic words only when they match something', () => {
    const wrestling = findMovies({ query: 'wrestling' }, CTX)
    expect(wrestling.map((t) => t.id)).toContain('godha')
    expect(findMovies({ query: 'zzqx' }, CTX).length).toBe(6)
  })

  it('builds official storefront searches for unlisted titles', () => {
    const links = searchLinks('Some Film', 2020, undefined, false)
    expect(links.map((l) => l.platformId)).toEqual(['netflix', 'prime', 'hotstar', 'youtube'])
    expect(links.every((l) => l.url.startsWith('https://'))).toBe(true)
    expect(searchLinks('Some Film', undefined, 'zee5', false).map((l) => l.platformId)).toEqual(['zee5'])
    expect(describeFilters({ language: 'hi', genre: 'scifi', kind: 'series', decade: 1990, platform: 'netflix' })).toBe('Hindi sci-fi series from the 1990s on Netflix')
    expect(searchPhrase({ language: 'hi', genre: 'scifi', kind: 'series', decade: 1990, platform: 'netflix' })).toBe('Hindi sci-fi series')
    expect(searchPhrase({ genre: 'family', query: 'space' })).toBe('family movies space')
  })

  it('leaves titles alone', () => {
    const before = titles.map((t) => t.id).join()
    findMovies({ genre: 'drama' }, CTX)
    expect(titles.map((t) => t.id).join()).toBe(before)
  })
})

describe('pages', () => {
  it('respects the menu rules for each role', () => {
    expect(pagePath('settings', 'director')).toBe('/settings')
    expect(pagePath('settings', 'parent')).toBeNull()
    expect(pagePath('attendance', 'parent')).toBeNull()
    expect(pagePath('dashboard', 'parent')).toBe('/')
    expect(pagePath('tv-link', 'parent', true)).toBe('/tv-link')
    expect(pagePath('tv-link', 'parent', false)).toBe('/link')
  })
})

describe('privacy screen', () => {
  const names = rosterNames({
    children: [{ firstName: 'Aanya', lastName: 'Rao' } as never],
    users: [{ name: 'Priya Menon' } as never],
  })

  it('collects roster names of three letters or more', () => {
    expect(names).toEqual(['aanya', 'rao', 'priya', 'menon'])
  })

  it('blocks names, numbers, and health details', () => {
    expect(privateReason('a cartoon Aanya would like', names)).toBe('name')
    expect(privateReason('call 98765 43210', names)).toBe('details')
    expect(privateReason('ring (555) 123-2019', names)).toBe('details')
    expect(privateReason('Drishyam (2013) and Drishyam 2 (2021)', names)).toBeNull()
    expect(privateReason('my son has a peanut allergy', names)).toBe('details')
    expect(privateReason('a cosy film for a rainy evening', names)).toBeNull()
  })
})

describe('agent client', () => {
  it('only calls https or localhost endpoints', () => {
    expect(safeAgentUrl('https://abc.supabase.co/functions/v1/willow-agent')).toBe('https://abc.supabase.co/functions/v1/willow-agent')
    expect(safeAgentUrl('http://evil.example/agent')).toBe('')
    expect(safeAgentUrl('https://user:pw@abc.supabase.co/x')).toBe('')
    expect(agentEndpoint({ VITE_AGENT_URL: '', DEV: true })).toBe('/qc-api/agent')
    expect(agentEndpoint({ VITE_AGENT_URL: '', DEV: false })).toBe('')
  })

  it('posts only the text and validates the answer', async () => {
    const fetcher = jsonFetch({ say: 'Opening Movies.', action: { type: 'navigate', page: 'movies' }, extra: 'x' })
    expect(await askAgent('take me somewhere fun', '/qc-api/agent', fetcher)).toEqual({
      ok: true,
      reply: { say: 'Opening Movies.', action: { type: 'navigate', page: 'movies' } },
    })
    const [, init] = fetcher.mock.calls[0] as [string, RequestInit]
    expect(init.body).toBe('{"text":"take me somewhere fun"}')
    expect(init.credentials).toBe('omit')
  })

  it('turns bad answers and errors into friendly text', async () => {
    expect(await askAgent('x y', '/a', jsonFetch({ say: 'hi', action: { type: 'navigate', page: 'erotic' } }))).toMatchObject({ ok: false, code: 'bad_reply' })
    expect(await askAgent('x y', '/a', jsonFetch({ error: 'rate_limited', say: 'Busy.' }, 429))).toEqual({ ok: false, say: 'Busy.', code: 'rate_limited' })
    const down = vi.fn(async () => Promise.reject(new TypeError('offline'))) as unknown as typeof fetch
    expect(await askAgent('x y', '/a', down)).toMatchObject({ ok: false, code: 'network' })
  })
})

describe('runAgent', () => {
  it('answers simple asks on the device without calling the AI', async () => {
    const fetcher = jsonFetch({})
    const turn = await runAgent('Hindi comedy movies', { find, names: [], endpoint: '/a', fetcher })
    expect(turn.source).toBe('local')
    expect(fetcher).not.toHaveBeenCalled()
  })

  it('keeps private asks and offline mode away from the network', async () => {
    const fetcher = jsonFetch({})
    expect(await runAgent('a bedtime story for Aanya', { find, names: ['aanya'], endpoint: '/a', fetcher })).toEqual({
      say: PRIVATE_SAY,
      action: { type: 'none' },
      source: 'offline',
    })
    expect(await runAgent('a bedtime routine that works', { find, names: [], endpoint: '', fetcher })).toEqual({
      say: HELP_SAY,
      action: { type: 'none' },
      source: 'offline',
    })
    expect(fetcher).not.toHaveBeenCalled()
  })

  it('guesses on the device when the AI is off or busy', async () => {
    expect(await runAgent('a cosy film for a rainy evening', { find, names: [], endpoint: '' })).toMatchObject({
      action: { type: 'find_movies', kind: 'movie' },
      source: 'local',
    })
    const busy = jsonFetch({ error: 'rate_limited', say: 'Busy.' }, 429)
    expect(await runAgent('a cosy film for a rainy evening', { find, names: [], endpoint: '/a', fetcher: busy })).toMatchObject({ source: 'local' })
    expect(await runAgent('a bedtime routine that works', { find, names: [], endpoint: '/a', fetcher: busy })).toEqual({
      say: 'Busy.',
      action: { type: 'none' },
      source: 'offline',
    })
  })

  it('uses the AI answer for open requests', async () => {
    const fetcher = jsonFetch({ say: 'Cosy picks.', action: { type: 'find_movies', genre: 'family' } })
    expect(await runAgent('a cosy film for a rainy evening', { find, names: [], endpoint: '/a', fetcher })).toEqual({
      say: 'Cosy picks.',
      action: { type: 'find_movies', genre: 'family' },
      source: 'ai',
    })
    expect(fetcher).toHaveBeenCalledTimes(1)
  })
})
