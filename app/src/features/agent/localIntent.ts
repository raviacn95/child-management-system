import type { MovieKind, MovieLang, MovieTitle } from '../movies/schema'
import { describeFilters } from './movieSearch'
import { PAGE_LABEL } from './pages'
import { ADULT_SAY, type AgentGenre, type AgentPage, type AgentPlatform, type AgentReply, type MovieFilters } from './schema'

export type TitleFinder = (title: string, year?: number) => MovieTitle | null

const ADULT = /\b(porn\w*|erotic\w*|nsfw|xxx|nude\w*|sex\w*|18\+|adult (movie|film|content|shelf)s?)/i
const PAIR = /\b(pair|link|connect)\b.*\b(tv|television|phone|mobile|fire ?(tv|stick)|remote)\b/i
const NAV = /^(?:please\s+)?(?:go(?: back)? to|open|show(?: me)?|take me to|switch to|navigate to|bring up)\s+(?:the\s+|my\s+)?(.+?)(?:\s+(?:page|screen|tab|section))?(?:\s+please)?$/i
const PLAY = /^(?:please\s+)?(?:play|watch|stream|put on|start)\s+(.+?)(?:\s+please)?$/i
const ON_SUFFIX = /\s+on\s+([\w+ ]+)$/i
const YEAR_SUFFIX = /\s*\(?\b((?:19|20)\d\d)\)?$/
const MOVIEISH = /\b(watch|recommend|suggest|something|anything|picks?|tonight|good|best)\b/i
const WATCH_ANY = /\b(something|anything) (good )?to watch\b|\bwhat (should|can) (we|i) watch\b/i
const MAX_FILTER_WORDS = 4
const ABOUT_CLAUSE = /\babout\s+.+?(?=\s+(?:on|from|in)\s+|$)/
const DECADE_WORD = /^((19|20)?\d0'?s|(19|20)\d\d)$/
const KNOWN_WORDS = new Set(
  (
    'a an and any anything best can find for from give good i in like list me of on please recommend series show shows some something suggest the to top tv we web what should watch with ' +
    'movie movies film films cinema new latest classic old science fiction love story stories true video amazon sony liv jio zee sun nxt apple manorama max disney plus'
  ).split(' '),
)

const PAGE_WORDS: [RegExp, AgentPage][] = [
  [/^(home|dashboard|home screen|main screen)$/, 'dashboard'],
  [/^(tonight|hub|household hub)$/, 'hub'],
  [/^(movies?|films?|movie finder|cinema)$/, 'movies'],
  [/^(tv|tv tonight|live tv|channels|tv channels)$/, 'tv'],
  [/^(otts?|my otts?|subscriptions|streaming apps)$/, 'ott'],
  [/^(learning|learning packs|lessons|kids channels)$/, 'learning'],
  [/^(grow|grow at home|activities)$/, 'grow'],
  [/^(parent feed|parents feed|parenting)$/, 'parent-feed'],
  [/^(meals?|food|menu|grocery|groceries)$/, 'meals'],
  [/^(shop|shopping|store|mart|willow mart)$/, 'shop'],
  [/^(calendar|events)$/, 'calendar'],
  [/^(messages?|inbox)$/, 'messages'],
  [/^(children|child profiles)$/, 'children'],
  [/^(attendance|check ?in)$/, 'attendance'],
  [/^(daily care|care log|diary)$/, 'daily-care'],
  [/^(health|health records)$/, 'health'],
  [/^(billing|fees|invoices)$/, 'billing'],
  [/^(staff|ratios|staff and ratios)$/, 'staff'],
  [/^(rooms|classrooms?)$/, 'classrooms'],
  [/^(transport|vans?|van routes|bus)$/, 'transport'],
  [/^(documents?|files)$/, 'documents'],
  [/^(workers|teacher workers)$/, 'workers'],
  [/^(enrol?lment|admissions)$/, 'enrollment'],
  [/^(inventory|supplies)$/, 'inventory'],
  [/^(reports?)$/, 'reports'],
  [/^(settings|preferences)$/, 'settings'],
  [/^(pricing|plans|upgrade)$/, 'pricing'],
  [/^(get the app|install( the app)?|download( the)? app)$/, 'get-app'],
]

const PLATFORM_WORDS: [RegExp, AgentPlatform][] = [
  [/\bnetflix\b/, 'netflix'],
  [/\b(amazon prime|prime video|prime)\b/, 'prime'],
  [/\b(jio ?hotstar|disney\+? ?hotstar|hotstar)\b/, 'hotstar'],
  [/\bsony ?liv\b/, 'sonyliv'],
  [/\bzee ?5\b/, 'zee5'],
  [/\bjio ?cinema\b/, 'jiocinema'],
  [/\byou ?tube\b/, 'youtube'],
  [/\bapple ?tv\b/, 'appletv'],
  [/\bsun ?nxt\b/, 'sunnxt'],
  [/\bmanorama ?max\b/, 'manoramamax'],
  [/\bmubi\b/, 'mubi'],
  [/\baha\b/, 'aha'],
  [/\bdisney\+?/, 'disney'],
]

const LANG_WORDS: Record<string, MovieLang> = {
  english: 'en',
  hindi: 'hi',
  bollywood: 'hi',
  malayalam: 'ml',
  tamil: 'ta',
  telugu: 'te',
  kannada: 'kn',
  bengali: 'bn',
  bangla: 'bn',
  marathi: 'mr',
  punjabi: 'pa',
  french: 'fr',
  spanish: 'es',
  italian: 'it',
  japanese: 'ja',
  korean: 'ko',
  german: 'de',
  chinese: 'zh',
  mandarin: 'zh',
  swedish: 'sv',
  danish: 'da',
  polish: 'pl',
  portuguese: 'pt',
}

const GENRE_WORDS: [RegExp, AgentGenre][] = [
  [/\b(comed(y|ies)|funny|hilarious)\b/, 'comedy'],
  [/\b(thrillers?|suspense)\b/, 'thriller'],
  [/\b(romance|romantic|love stor(y|ies))\b/, 'romance'],
  [/\baction\b/, 'action'],
  [/\b(horror|scary)\b/, 'horror'],
  [/\b(animat(ed|ion)|cartoons?|anime)\b/, 'animation'],
  [/\b(sci-?fi|science fiction)\b/, 'scifi'],
  [/\b(crime|gangster|heist)\b/, 'crime'],
  [/\b(sports?|cricket|football)\b/, 'sport'],
  [/\b(musicals?|music)\b/, 'music'],
  [/\b(myster(y|ies)|detective)\b/, 'mystery'],
  [/\bfantasy\b/, 'fantasy'],
  [/\bwar\b/, 'war'],
  [/\b(documentar(y|ies))\b/, 'documentary'],
  [/\b(biopics?|biograph(y|ies)|true stor(y|ies))\b/, 'biopic'],
  [/\b(period|historical)\b/, 'period'],
  [/\b(family|kids?|children)\b/, 'family'],
  [/\bdramas?\b/, 'drama'],
]

function first<T>(pairs: [RegExp, T][], text: string) {
  return pairs.find(([re]) => re.test(text))?.[1]
}

function kindIn(text: string): MovieKind | undefined {
  if (/\b(web ?series|series|tv shows?|shows)\b/.test(text)) return 'series'
  if (/\b(movies?|films?|cinema)\b/.test(text)) return 'movie'
  return undefined
}

function decadeIn(text: string) {
  const full = text.match(/\b((?:19|20)\d)0'?s\b/)
  if (full) return Number(full[1]) * 10
  const short = text.match(/\b(\d)0'?s\b/)
  if (short) return (Number(short[1]) >= 3 ? 1900 : 2000) + Number(short[1]) * 10
  const from = text.match(/\b(?:from|in)\s+((?:19|20)\d\d)\b/)
  return from ? Number(from[1]) - (Number(from[1]) % 10) : undefined
}

function filtersIn(lower: string): MovieFilters {
  const word = lower.split(/[^a-z]+/).find((w) => w in LANG_WORDS)
  const about = lower.match(/\babout\s+(.+?)(?:\s+(?:on|from|in)\s+.*)?$/)
  const filters: MovieFilters = {
    language: word ? LANG_WORDS[word] : undefined,
    genre: first(GENRE_WORDS, lower),
    kind: kindIn(lower),
    decade: decadeIn(lower),
    platform: first(PLATFORM_WORDS, lower),
    query: about?.[1]?.slice(0, 60),
  }
  return Object.fromEntries(Object.entries(filters).filter(([, v]) => v !== undefined)) as MovieFilters
}

function knownWord(word: string) {
  return (
    KNOWN_WORDS.has(word) ||
    word in LANG_WORDS ||
    DECADE_WORD.test(word) ||
    GENRE_WORDS.some(([re]) => re.test(word)) ||
    PLATFORM_WORDS.some(([re]) => re.test(word))
  )
}

/** True when every word is a filter, filler, or part of an "about ..." topic, so nothing is lost by skipping the AI. */
function onlyFilterWords(lower: string) {
  return lower
    .replace(ABOUT_CLAUSE, ' ')
    .split(/[^a-z0-9+']+/)
    .filter(Boolean)
    .every(knownWord)
}

function navigate(page: AgentPage): AgentReply {
  return { say: `Opening ${PAGE_LABEL[page]}.`, action: { type: 'navigate', page } }
}

function openTitle(title: MovieTitle | null, asked: string, year?: number, platform?: AgentPlatform): AgentReply {
  if (title) return { say: `Here is ${title.title} (${title.year}).`, action: { type: 'open_movie', title: title.title, year: title.year, ...(platform ? { platform } : {}) } }
  return {
    say: `Searching official apps for ${asked}.`,
    action: { type: 'open_movie', title: asked, ...(year ? { year } : {}), ...(platform ? { platform } : {}) },
  }
}

function findReply(filters: MovieFilters): AgentReply {
  const say = Object.keys(filters).length ? `Here are ${describeFilters(filters)}.` : 'Here are top family picks.'
  return { say, action: { type: 'find_movies', ...filters } }
}

function playIntent(text: string, find: TitleFinder): AgentReply | null {
  const play = text.match(PLAY)
  if (!play) return null
  const page = first(PAGE_WORDS, play[1].toLowerCase())
  if (page) return navigate(page)
  let rest = play[1]
  const on = rest.match(ON_SUFFIX)
  const platform = on ? first(PLATFORM_WORDS, on[1].toLowerCase()) : undefined
  if (on && platform) rest = rest.slice(0, on.index)
  const yearMatch = rest.match(YEAR_SUFFIX)
  const year = yearMatch ? Number(yearMatch[1]) : undefined
  if (yearMatch && yearMatch.index) rest = rest.slice(0, yearMatch.index)
  const found = find(rest, year)
  if (found) return openTitle(found, rest, year, platform)
  const lower = rest.toLowerCase()
  const asFilters = filtersIn(lower)
  if (asFilters.genre || asFilters.language || asFilters.kind || MOVIEISH.test(lower)) return null
  return openTitle(null, rest, year, platform)
}

/**
 * Requests Willow can answer on the device, so they never leave it. Returns null when the AI should try.
 * Strict mode (AI available) only answers movie wishes made purely of filter words; loose mode also takes a best guess.
 */
export function localIntent(raw: string, find: TitleFinder, strict = false): AgentReply | null {
  const text = raw.replace(/\s+/g, ' ').trim().replace(/[.!?]+$/, '')
  const lower = text.toLowerCase()
  if (text.length < 2) return null
  if (ADULT.test(lower)) return { say: ADULT_SAY, action: { type: 'none' } }
  if (PAIR.test(lower)) return navigate('tv-link')
  const nav = text.match(NAV)
  if (nav) {
    const page = first(PAGE_WORDS, nav[1].toLowerCase())
    if (page) return navigate(page)
    const found = find(nav[1])
    if (found) return openTitle(found, nav[1])
  }
  const bare = first(PAGE_WORDS, lower)
  if (bare) return navigate(bare)
  const played = playIntent(text, find)
  if (played) return played
  const filters = filtersIn(lower)
  const fits = !strict || onlyFilterWords(lower)
  if (fits && (filters.kind || WATCH_ANY.test(lower))) return findReply(filters)
  const title = find(text)
  if (title) return openTitle(title, text)
  const hasFilter = Object.keys(filters).length > 0
  const shortFilter = Boolean(filters.language || filters.genre) && lower.split(' ').length <= MAX_FILTER_WORDS
  return fits && (shortFilter || (hasFilter && MOVIEISH.test(lower))) ? findReply(filters) : null
}
