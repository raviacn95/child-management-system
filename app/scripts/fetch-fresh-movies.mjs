#!/usr/bin/env node
// Builds movies-fresh.json: this year's released films from Wikidata (CC0), ranked by how many
// Wikipedia language editions cover them, with Indian streaming channels from TMDB (JustWatch data)
// when TMDB_API_KEY is set (env or app/.env.local). Without a key, earlier TMDB channels in the output
// file are carried forward. Keeps the previous file when Wikidata is unreachable.
import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { fetchWatchIds } from './fetch-watch-ids.mjs'

const ENDPOINT = 'https://query.wikidata.org/sparql'
const USER_AGENT = 'WillowFreshMovies/1.0 (https://raviacn95.github.io/child-management-system/)'
const INDIA = 'Q668'
const INDIAN_SLOTS = 36
const WORLD_SLOTS = 24
const TMDB_API = 'https://api.themoviedb.org/3'
const TMDB_CONCURRENCY = 4
const TMDB_TIMEOUT_MS = 10_000
const TMDB_BUDGET_MS = 60_000
const TMDB_ATTEMPTS = 3
const TMDB_RETRY_DELAY_MS = 500
const SOURCE = 'Wikidata (CC0) — films released this year, ranked by Wikipedia coverage'
const TMDB_CREDIT = 'streaming data: JustWatch via TMDB'

const KIND_ORDER = ['stream', 'free', 'ads', 'rent', 'buy']
const TMDB_KINDS = { flatrate: 'stream', free: 'free', ads: 'ads', rent: 'rent', buy: 'buy' }

// Checked in order against the lower-cased TMDB provider name; first match wins.
const TMDB_PROVIDER_RULES = [
  [/^netflix\b/, 'netflix'],
  [/^amazon (prime )?video\b|^prime video\b/, 'prime'],
  [/hotstar|^jio ?cinema\b/, 'hotstar'],
  [/^sony ?liv\b/, 'sonyliv'],
  [/^zee ?5\b/, 'zee5'],
  [/^sun ?nxt\b/, 'sunnxt'],
  [/^aha( |$)/, 'aha'],
  [/^manorama ?max\b/, 'manoramamax'],
  [/^apple tv\b/, 'appletv'],
  [/^google play movies\b|^google tv\b/, 'play'],
  [/^youtube\b/, 'youtube'],
  [/^mubi\b/, 'mubi'],
  [/^lionsgate ?play\b/, 'lionsgate'],
  [/^hoichoi\b/, 'hoichoi'],
  [/^eros ?now\b/, 'erosnow'],
  [/^(amazon )?mx ?player\b/, 'mxplayer'],
  [/^hungama\b/, 'hungama'],
  [/^shemaroo/, 'shemaroo'],
  [/^crunchyroll\b/, 'crunchyroll'],
  [/^discovery ?\+|^discovery plus\b/, 'discoveryplus'],
  [/^tata ?play\b/, 'tataplay'],
  [/^airtel xstream\b/, 'airtel'],
  [/^plex\b/, 'plex'],
  [/^klikk\b/, 'klikk'],
  [/^chaupal\b/, 'chaupal'],
  [/^epic ?on\b/, 'epicon'],
  [/^watcho\b/, 'watcho'],
  [/^tentkotta\b/, 'tentkotta'],
  [/^saina ?play\b/, 'saina'],
  [/^namma ?flix\b/, 'nammaflix'],
  [/^planet marathi\b/, 'planetmarathi'],
  [/^rakuten viki\b|^viki\b/, 'viki'],
]

// Wikidata items seen as "distributed by" (P750) / "original broadcaster" (P449) on recent films.
const WIKIDATA_STREAMERS = {
  Q907311: 'netflix',
  Q4740856: 'prime',
  Q19758675: 'hotstar',
  Q97168124: 'hotstar',
  Q54958752: 'hotstar',
  Q17021043: 'sonyliv',
  Q51328854: 'zee5',
  Q96406700: 'sunnxt',
  Q85740146: 'aha',
  Q106153098: 'manoramamax',
  Q62446736: 'appletv',
  Q693730: 'mubi',
  Q55613841: 'hoichoi',
  Q25389797: 'mxplayer',
}

const LANGS = {
  Q1860: 'en',
  Q1568: 'hi',
  Q36236: 'ml',
  Q5885: 'ta',
  Q8097: 'te',
  Q33673: 'kn',
  Q9610: 'bn',
  Q1571: 'mr',
  Q58635: 'pa',
  Q150: 'fr',
  Q1321: 'es',
  Q652: 'it',
  Q5287: 'ja',
  Q9176: 'ko',
  Q188: 'de',
  Q5146: 'pt',
}
const LANG_CODES = new Set(Object.values(LANGS))

// Genres (and their subgenres) kept off a family shelf: pornographic, erotic, erotic thriller, horror, slasher, splatter.
const BLOCKED_GENRES = ['Q185867', 'Q1054574', 'Q1128993', 'Q200092', 'Q853630', 'Q1051441']

function releasedThisYear(year, today) {
  return `
  ?film wdt:P577 ?date .
  hint:Prior hint:rangeSafe true .
  FILTER(?date >= "${year}-01-01T00:00:00Z"^^xsd:dateTime && ?date <= "${today}T23:59:59Z"^^xsd:dateTime)
  ?film wdt:P31 wd:Q11424 ;
        wikibase:sitelinks ?sitelinks .`
}

function familySafe(year) {
  const blocked = BLOCKED_GENRES.map((qid) => `wd:${qid}`).join(' ')
  return `
  FILTER NOT EXISTS { ?film wdt:P577 ?early . FILTER(?early < "${year}-01-01T00:00:00Z"^^xsd:dateTime) }
  FILTER NOT EXISTS { ?film wdt:P136/wdt:P279* ?genre . VALUES ?genre { ${blocked} } }
  SERVICE wikibase:label { bd:serviceParam wikibase:language "en". }`
}

export function indianQuery(year, today) {
  return `
SELECT ?film ?filmLabel ?sitelinks (GROUP_CONCAT(DISTINCT STR(?langItem); separator=" ") AS ?langQs) (MIN(?date) AS ?released) WHERE {
  ${releasedThisYear(year, today)}
  ?film wdt:P495 wd:${INDIA} .
  OPTIONAL { ?film wdt:P364 ?langItem . }
  ${familySafe(year)}
}
GROUP BY ?film ?filmLabel ?sitelinks
ORDER BY DESC(?sitelinks)
LIMIT 120`
}

export function worldQuery(year, today) {
  const values = Object.keys(LANGS)
    .map((qid) => `wd:${qid}`)
    .join(' ')
  return `
SELECT ?film ?filmLabel ?sitelinks (GROUP_CONCAT(DISTINCT STR(?langItem); separator=" ") AS ?langQs) (MIN(?date) AS ?released) WHERE {
  ${releasedThisYear(year, today)}
  FILTER(?sitelinks >= 8)
  VALUES ?langItem { ${values} }
  ?film wdt:P364 ?langItem .
  FILTER NOT EXISTS { ?film wdt:P495 wd:${INDIA} . }
  ${familySafe(year)}
}
GROUP BY ?film ?filmLabel ?sitelinks
ORDER BY DESC(?sitelinks)
LIMIT 120`
}

const INDIAN_FIRST = ['ml', 'hi', 'ta', 'te', 'kn', 'bn', 'mr', 'pa']

export function pickLang(langUris, india) {
  const codes = langUris
    .split(/\s+/)
    .map((uri) => LANGS[uri.split('/').pop() ?? ''])
    .filter(Boolean)
  const preferred = india ? INDIAN_FIRST.find((code) => codes.includes(code)) : undefined
  return preferred ?? codes[0] ?? ''
}

export function toEntries(bindings, year, { india }) {
  const out = []
  for (const row of bindings) {
    const qid = String(row.film?.value ?? '').split('/').pop() ?? ''
    const title = String(row.filmLabel?.value ?? '').trim()
    const lang = pickLang(String(row.langQs?.value ?? ''), india)
    const released = String(row.released?.value ?? '').slice(0, 10)
    const sitelinks = Number(row.sitelinks?.value ?? 0)
    if (!/^Q\d+$/.test(qid)) continue
    if (!title || title === qid || title.length > 120 || /[<>]/.test(title)) continue
    if (!/^\d{4}-\d{2}-\d{2}$/.test(released) || !released.startsWith(`${year}-`)) continue
    if (!india && !LANG_CODES.has(lang)) continue
    out.push({ id: `wd-${qid}`, qid, title, year, released, lang, india, sitelinks })
  }
  return out
}

export function toFeed(indian, world, year, now = new Date()) {
  const seen = new Set()
  const unique = (list) => list.filter((entry) => (seen.has(entry.qid) ? false : (seen.add(entry.qid), true)))
  const pickedIndian = unique(indian).slice(0, INDIAN_SLOTS)
  const pickedWorld = unique(world).slice(0, WORLD_SLOTS + INDIAN_SLOTS - pickedIndian.length)
  const titles = [...pickedIndian, ...pickedWorld].sort((a, b) => b.released.localeCompare(a.released))
  return {
    schemaVersion: 1,
    generatedAt: now.toISOString(),
    year,
    source: SOURCE,
    titles,
  }
}

export function detailsQuery(qids) {
  const films = qids.map((qid) => `wd:${qid}`).join(' ')
  const streamers = Object.keys(WIKIDATA_STREAMERS)
    .map((qid) => `wd:${qid}`)
    .join(' ')
  return `
SELECT ?film (SAMPLE(?tmdbId) AS ?tmdb) (SAMPLE(?imdbId) AS ?imdb) (GROUP_CONCAT(DISTINCT STR(?streamer); separator=" ") AS ?streamers) WHERE {
  VALUES ?film { ${films} }
  OPTIONAL { ?film wdt:P4947 ?tmdbId . }
  OPTIONAL { ?film wdt:P345 ?imdbId . }
  OPTIONAL { VALUES ?streamer { ${streamers} } ?film wdt:P750|wdt:P449 ?streamer . }
}
GROUP BY ?film`
}

export function toDetails(bindings) {
  const details = new Map()
  for (const row of bindings) {
    const qid = String(row.film?.value ?? '').split('/').pop() ?? ''
    if (!/^Q\d+$/.test(qid)) continue
    const tmdb = String(row.tmdb?.value ?? '')
    const imdb = String(row.imdb?.value ?? '')
    const streamQids = String(row.streamers?.value ?? '')
      .split(/\s+/)
      .map((uri) => uri.split('/').pop() ?? '')
      .filter((id) => /^Q\d+$/.test(id))
    details.set(qid, {
      tmdbId: /^\d+$/.test(tmdb) ? Number(tmdb) : undefined,
      imdbId: /^tt\d+$/.test(imdb) ? imdb : undefined,
      streamQids,
    })
  }
  return details
}

export function mapTmdbProviderName(name) {
  const key = String(name ?? '')
    .trim()
    .toLowerCase()
  if (!key) return undefined
  return TMDB_PROVIDER_RULES.find(([pattern]) => pattern.test(key))?.[1]
}

/** Best way to watch per platform: streaming beats free beats ads beats rent beats buy. Input order breaks ties. */
export function mergeProviders(...lists) {
  const best = new Map()
  for (const provider of lists.flat()) {
    const rank = KIND_ORDER.indexOf(provider.kind)
    if (rank < 0 || !provider.platformId) continue
    const prev = best.get(provider.platformId)
    if (!prev || rank < KIND_ORDER.indexOf(prev.kind)) best.set(provider.platformId, { platformId: provider.platformId, kind: provider.kind })
  }
  const order = [...best.keys()]
  return [...best.values()].sort(
    (a, b) => KIND_ORDER.indexOf(a.kind) - KIND_ORDER.indexOf(b.kind) || order.indexOf(a.platformId) - order.indexOf(b.platformId),
  )
}

/** TMDB `results.IN` → Willow providers. Unknown storefronts are dropped. */
export function mapTmdbProviders(region) {
  if (!region || typeof region !== 'object') return []
  const found = []
  for (const [field, kind] of Object.entries(TMDB_KINDS)) {
    const list = Array.isArray(region[field]) ? [...region[field]] : []
    list.sort((a, b) => Number(a?.display_priority ?? 999) - Number(b?.display_priority ?? 999))
    for (const item of list) {
      const platformId = mapTmdbProviderName(item?.provider_name)
      if (platformId) found.push({ platformId, kind })
    }
  }
  return mergeProviders(found)
}

export function wikidataProviders(streamQids) {
  return mergeProviders(
    streamQids.flatMap((qid) => (WIKIDATA_STREAMERS[qid] ? [{ platformId: WIKIDATA_STREAMERS[qid], kind: 'stream' }] : [])),
  )
}

/** A v4 read access token is a JWT and goes in the Authorization header; a v3 key goes in the query string. */
export function tmdbRequest(path, key) {
  const bearer = key.startsWith('eyJ') || key.includes('.')
  const url = new URL(`${TMDB_API}${path}`)
  if (!bearer) url.searchParams.set('api_key', key)
  const headers = { accept: 'application/json', 'user-agent': USER_AGENT }
  if (bearer) headers.authorization = `Bearer ${key}`
  return { url: url.toString(), headers }
}

const sameTitle = (a, b) =>
  String(a ?? '')
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, '') ===
  String(b ?? '')
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, '')

async function findTmdbId(entry, detail, tmdb) {
  if (detail?.tmdbId) return detail.tmdbId
  if (detail?.imdbId) {
    const found = await tmdb(`/find/${detail.imdbId}?external_source=imdb_id`)
    const id = found?.movie_results?.[0]?.id
    if (Number.isInteger(id)) return id
  }
  const search = await tmdb(`/search/movie?query=${encodeURIComponent(entry.title)}&primary_release_year=${entry.year}`)
  const match = (Array.isArray(search?.results) ? search.results : []).find(
    (result) =>
      (sameTitle(result?.title, entry.title) || sameTitle(result?.original_title, entry.title)) &&
      String(result?.release_date ?? '').startsWith(String(entry.year)),
  )
  return Number.isInteger(match?.id) ? match.id : undefined
}

async function tmdbLookup(entry, detail, tmdb) {
  try {
    const tmdbId = await findTmdbId(entry, detail, tmdb)
    if (!tmdbId) return {}
    try {
      const data = await tmdb(`/movie/${tmdbId}/watch/providers`)
      return { tmdbId, providers: mapTmdbProviders(data?.results?.IN) }
    } catch {
      return { tmdbId }
    }
  } catch {
    return {}
  }
}

async function fetchTmdbJson(url, headers) {
  const res = await fetch(url, { headers, signal: AbortSignal.timeout(TMDB_TIMEOUT_MS) })
  if (!res.ok) throw Object.assign(new Error(`TMDB HTTP ${res.status}`), { status: res.status })
  return res.json()
}

/** Dropped connections, timeouts, 429 and 5xx are worth another try; 401/404 are not. */
async function withRetry(call, delayMs) {
  for (let attempt = 1; ; attempt++) {
    try {
      return await call()
    } catch (error) {
      const status = Number(error?.status)
      const transient = !status || status === 429 || status >= 500
      if (!transient || attempt >= TMDB_ATTEMPTS) throw error
      await new Promise((resolve) => setTimeout(resolve, delayMs * attempt))
    }
  }
}

/**
 * Adds `providers` to every title. TMDB (when a key is set) is merged with Wikidata streaming distributors;
 * a failed lookup keeps the title with whatever Wikidata knew, possibly `providers: []`.
 */
export async function attachProviders(feed, details, opts = {}) {
  const key = opts.key ?? ''
  const fetchJson = opts.fetchJson ?? fetchTmdbJson
  const deadline = opts.deadline ?? Date.now() + TMDB_BUDGET_MS
  const retryDelayMs = opts.retryDelayMs ?? TMDB_RETRY_DELAY_MS
  const tmdb = (path) => {
    const req = tmdbRequest(path, key)
    return withRetry(() => fetchJson(req.url, req.headers), retryDelayMs)
  }
  const results = new Array(feed.titles.length)
  let next = 0
  async function worker() {
    while (next < feed.titles.length) {
      const index = next++
      const entry = feed.titles[index]
      const detail = details.get(entry.qid)
      const fromTmdb = key && Date.now() < deadline ? await tmdbLookup(entry, detail, tmdb) : {}
      const fromWikidata = wikidataProviders(detail?.streamQids ?? [])
      const providers = mergeProviders(fromTmdb.providers ?? [], fromWikidata)
      const providersSource = fromTmdb.providers ? 'tmdb' : fromWikidata.length ? 'wikidata' : undefined
      const tmdbId = fromTmdb.tmdbId ?? detail?.tmdbId
      results[index] = {
        ...entry,
        providers,
        ...(providersSource ? { providersSource } : {}),
        ...(tmdbId ? { tmdbId } : {}),
      }
    }
  }
  await Promise.all(Array.from({ length: Math.min(TMDB_CONCURRENCY, feed.titles.length) }, worker))
  const usedTmdb = results.some((title) => title.providersSource === 'tmdb')
  return {
    ...feed,
    source: usedTmdb ? `${SOURCE}; ${TMDB_CREDIT}` : SOURCE,
    ...(usedTmdb ? { providersCheckedAt: feed.generatedAt } : {}),
    titles: results,
  }
}

/**
 * Keeps TMDB channels from the previous feed for titles this run could not check on TMDB (no key in CI,
 * or a failed lookup). `providersCheckedAt` then reports the older check so stale channels stay visible.
 */
export function carryForwardProviders(next, previous) {
  const earlier = new Map(
    (Array.isArray(previous?.titles) ? previous.titles : [])
      .filter((title) => title?.providersSource === 'tmdb' && Array.isArray(title.providers) && typeof title.id === 'string')
      .map((title) => [title.id, title]),
  )
  let carried = 0
  const titles = next.titles.map((title) => {
    const prev = earlier.get(title.id)
    if (!prev || title.providersSource === 'tmdb') return title
    carried++
    return {
      ...title,
      providers: mergeProviders(prev.providers, title.providers ?? []),
      providersSource: 'tmdb',
      ...(Number.isInteger(prev.tmdbId) ? { tmdbId: prev.tmdbId } : {}),
    }
  })
  if (!carried) return next
  const checkedAt = previous.providersCheckedAt ?? previous.generatedAt
  return {
    ...next,
    source: `${SOURCE}; ${TMDB_CREDIT}`,
    ...(typeof checkedAt === 'string' ? { providersCheckedAt: checkedAt } : {}),
    titles,
  }
}

/**
 * Adds `watchIds` (official Netflix / Prime Video / JioHotstar / Apple TV / SonyLIV IDs from Wikidata) per title.
 * `idsByQid` is null when Wikidata could not be asked; the previous feed's IDs are kept then.
 */
export function attachWatchIds(feed, idsByQid, previous) {
  const earlier = new Map(
    (Array.isArray(previous?.titles) ? previous.titles : [])
      .filter((title) => typeof title?.id === 'string' && title.watchIds && typeof title.watchIds === 'object')
      .map((title) => [title.id, title.watchIds]),
  )
  return {
    ...feed,
    titles: feed.titles.map((title) => {
      const ids = idsByQid ? idsByQid.get(title.qid) : earlier.get(title.id)
      return ids && Object.keys(ids).length ? { ...title, watchIds: ids } : title
    }),
  }
}

/** Minimal KEY=value reader for app/.env.local; no variable expansion. */
export function parseEnv(text) {
  const env = {}
  for (const line of String(text).split(/\r?\n/)) {
    const match = line.match(/^\s*(?:export\s+)?([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*?)\s*$/)
    if (!match) continue
    env[match[1]] = match[2].replace(/^(['"])(.*)\1$/, '$2')
  }
  return env
}

function readJson(path) {
  try {
    return JSON.parse(readFileSync(path, 'utf8'))
  } catch {
    return null
  }
}

function tmdbKey() {
  const fromEnv = (process.env.TMDB_API_KEY ?? '').trim()
  if (fromEnv) return fromEnv
  const local = fileURLToPath(new URL('../.env.local', import.meta.url))
  return existsSync(local) ? (parseEnv(readFileSync(local, 'utf8')).TMDB_API_KEY ?? '').trim() : ''
}

async function sparql(query) {
  const res = await fetch(`${ENDPOINT}?format=json&query=${encodeURIComponent(query)}`, {
    headers: { accept: 'application/sparql-results+json', 'user-agent': USER_AGENT },
    signal: AbortSignal.timeout(55_000),
  })
  if (!res.ok) throw new Error(`Wikidata HTTP ${res.status}`)
  const json = await res.json()
  return json.results?.bindings ?? []
}

async function main() {
  const out = process.argv[2] ?? 'public/movies-fresh.json'
  const now = new Date()
  const year = now.getUTCFullYear()
  const today = now.toISOString().slice(0, 10)
  try {
    const [indianRows, worldRows] = await Promise.all([sparql(indianQuery(year, today)), sparql(worldQuery(year, today))])
    const feed = toFeed(
      toEntries(indianRows, year, { india: true }),
      toEntries(worldRows, year, { india: false }),
      year,
      now,
    )
    if (!feed.titles.length) throw new Error('Wikidata returned no titles')
    const details = await sparql(detailsQuery(feed.titles.map((title) => title.qid)))
      .then(toDetails)
      .catch((error) => {
        console.warn(`film ids not fetched: ${error instanceof Error ? error.message : error}`)
        return new Map()
      })
    const key = tmdbKey()
    if (!key) console.log('TMDB_API_KEY not set: new channels from Wikidata only, earlier TMDB channels kept')
    const previous = existsSync(out) ? readJson(out) : null
    const watchIds = await fetchWatchIds(
      feed.titles.map((title) => title.qid),
      sparql,
    ).catch((error) => {
      console.warn(`watch IDs not fetched: ${error instanceof Error ? error.message : error}`)
      return null
    })
    const withProviders = carryForwardProviders(await attachProviders(feed, details, { key }), previous)
    const withIds = attachWatchIds(withProviders, watchIds, previous)
    writeFileSync(out, `${JSON.stringify(withIds, null, 2)}\n`)
    const streaming = withIds.titles.filter((title) => title.providers.length).length
    const netflix = withIds.titles.filter((title) => title.watchIds?.netflix).length
    const checked = withIds.providersCheckedAt ? `, TMDB checked ${withIds.providersCheckedAt}` : ''
    console.log(
      `wrote ${out}: ${feed.titles.length} titles from ${year}, ${streaming} with streaming channels, ${netflix} with a Netflix ID${checked}`,
    )
  } catch (error) {
    console.warn(`fresh movies not refreshed: ${error instanceof Error ? error.message : error}`)
    if (!existsSync(out)) writeFileSync(out, `${JSON.stringify(toFeed([], [], year, now), null, 2)}\n`)
    else console.warn(`keeping ${out} from ${JSON.parse(readFileSync(out, 'utf8')).generatedAt ?? 'earlier'}`)
  }
}

if (process.argv[1]?.replace(/\\/g, '/').endsWith('scripts/fetch-fresh-movies.mjs')) {
  await main()
}
