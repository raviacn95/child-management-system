#!/usr/bin/env node
// Builds movies-fresh.json: this year's released films from Wikidata (CC0), ranked by how many
// Wikipedia language editions cover them. Keeps the previous file when Wikidata is unreachable.
import { existsSync, readFileSync, writeFileSync } from 'node:fs'

const ENDPOINT = 'https://query.wikidata.org/sparql'
const USER_AGENT = 'WillowFreshMovies/1.0 (https://raviacn95.github.io/child-management-system/)'
const INDIA = 'Q668'
const INDIAN_SLOTS = 36
const WORLD_SLOTS = 24

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
    source: 'Wikidata (CC0) — films released this year, ranked by Wikipedia coverage',
    titles,
  }
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
    writeFileSync(out, `${JSON.stringify(feed, null, 2)}\n`)
    console.log(`wrote ${out}: ${feed.titles.length} titles from ${year}`)
  } catch (error) {
    console.warn(`fresh movies not refreshed: ${error instanceof Error ? error.message : error}`)
    if (!existsSync(out)) writeFileSync(out, `${JSON.stringify(toFeed([], [], year, now), null, 2)}\n`)
    else console.warn(`keeping ${out} from ${JSON.parse(readFileSync(out, 'utf8')).generatedAt ?? 'earlier'}`)
  }
}

if (process.argv[1]?.replace(/\\/g, '/').endsWith('scripts/fetch-fresh-movies.mjs')) {
  await main()
}
