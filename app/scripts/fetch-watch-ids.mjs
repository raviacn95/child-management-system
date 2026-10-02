#!/usr/bin/env node
// Builds src/data/watch-ids.json: official streaming IDs (Netflix, Prime Video, JioHotstar, Apple TV, SonyLIV) for the
// static catalog and top picks, from Wikidata (CC0). A title is matched only on an exact English label + release year, and skipped
// when two items match. Keeps the previous file when Wikidata is unreachable. YouTube IDs (P1651) are left out: on film
// items they are mostly trailers, often without the trailer qualifier.
import { readFileSync, writeFileSync, existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

const ENDPOINT = 'https://query.wikidata.org/sparql'
const USER_AGENT = 'WillowWatchIds/1.0 (https://raviacn95.github.io/child-management-system/)'
const LABEL_BATCH = 40
const ID_BATCH = 150
const PAUSE_MS = 400
const DATA_FILES = ['../src/data/movies-data.ts', '../src/data/erotic-movies-data.ts']
const TOP_PICKS_FILE = '../src/data/top-picks.json'
const OUT_FILE = '../src/data/watch-ids.json'

// Film, television program, web series, miniseries.
const WORK_ROOTS = ['Q11424', 'Q15416', 'Q526877', 'Q1259759']
const PRIME_GTI = /^amzn1\.dv\.gti\.[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/
const APPLE_UMC = /^umc\.cmc\.[a-z0-9]{22,25}$/

/** Wikidata property → Willow platform id and the value shape that platform accepts. Earlier properties win. */
export const WATCH_ID_PROPS = {
  P1874: { platformId: 'netflix', pattern: /^\d{6,9}$/ },
  P14462: { platformId: 'prime', pattern: PRIME_GTI },
  P14440: { platformId: 'prime', pattern: PRIME_GTI },
  P11049: { platformId: 'hotstar', pattern: /^\d{6,12}$/ },
  P9586: { platformId: 'appletv', pattern: APPLE_UMC, prefix: 'movie/' },
  P9751: { platformId: 'appletv', pattern: APPLE_UMC, prefix: 'show/' },
  P9465: { platformId: 'sonyliv', pattern: /^1\d{9}$/ },
}
const PROP_ORDER = Object.keys(WATCH_ID_PROPS)

/** Rows look like `['id', 'Title', 2019, 'movie', ...]`; titles may contain `\'`. */
export function readCatalogRows(source) {
  const rows = []
  const re = /^\s*\['([a-z0-9-]+)',\s*'((?:[^'\\]|\\.)+)',\s*(\d{4}),\s*'(movie|series)'/gm
  for (const match of String(source).matchAll(re)) {
    rows.push({ id: match[1], title: match[2].replace(/\\(.)/g, '$1'), year: Number(match[3]), kind: match[4] })
  }
  return rows
}

export function readTopPicks(json) {
  return (Array.isArray(json?.items) ? json.items : []).flatMap((item) =>
    typeof item?.id === 'string' && typeof item.title === 'string' && Number.isInteger(item.year)
      ? [{ id: item.id, title: item.title, year: item.year, kind: item.kind === 'series' ? 'series' : 'movie' }]
      : [],
  )
}

const literal = (text) => JSON.stringify(String(text))

export function labelQuery(titles) {
  const labels = [...new Set(titles)].flatMap((title) => [`${literal(title)}@en`, `${literal(title)}@mul`]).join(' ')
  const roots = WORK_ROOTS.map((qid) => `wd:${qid}`).join(' ')
  return `
SELECT ?item ?label (GROUP_CONCAT(DISTINCT STR(YEAR(?date)); separator=" ") AS ?years) WHERE {
  VALUES ?label { ${labels} }
  { ?item rdfs:label ?label } UNION { ?item skos:altLabel ?label }
  FILTER EXISTS { VALUES ?root { ${roots} } ?item wdt:P31/wdt:P279* ?root . }
  { ?item wdt:P577 ?date } UNION { ?item wdt:P580 ?date }
}
GROUP BY ?item ?label`
}

/** Exact title + year, one Wikidata item only: catalog id → QID. */
export function pickMatches(rows, bindings) {
  const byTitle = new Map()
  for (const row of bindings) {
    const qid = String(row.item?.value ?? '').split('/').pop() ?? ''
    const label = String(row.label?.value ?? '')
    if (!/^Q\d+$/.test(qid) || !label) continue
    const years = String(row.years?.value ?? '')
      .split(/\s+/)
      .filter((y) => /^\d{4}$/.test(y))
      .map(Number)
    const known = byTitle.get(label) ?? new Map()
    known.set(qid, [...new Set([...(known.get(qid) ?? []), ...years])])
    byTitle.set(label, known)
  }
  const matches = new Map()
  for (const row of rows) {
    const candidates = [...(byTitle.get(row.title) ?? new Map()).entries()].filter(([, years]) => years.includes(row.year))
    if (candidates.length === 1) matches.set(row.id, candidates[0][0])
  }
  return matches
}

export function watchIdsQuery(qids) {
  const items = [...new Set(qids)].map((qid) => `wd:${qid}`).join(' ')
  const props = PROP_ORDER.map((pid) => `("${pid}" p:${pid} ps:${pid})`).join(' ')
  return `
SELECT DISTINCT ?item ?pid ?value ?rank WHERE {
  VALUES ?item { ${items} }
  VALUES (?pid ?p ?ps) { ${props} }
  ?item ?p ?statement .
  ?statement ?ps ?value ;
             wikibase:rank ?rank .
  FILTER(?rank != wikibase:DeprecatedRank)
}`
}

/** QID → `{ platformId: id }`. Values that do not fit the platform's ID shape are dropped; the result is order-stable. */
export function toWatchIds(bindings) {
  const rows = bindings
    .map((row) => ({
      qid: String(row.item?.value ?? '').split('/').pop() ?? '',
      pid: String(row.pid?.value ?? ''),
      value: String(row.value?.value ?? '').trim(),
      preferred: String(row.rank?.value ?? '').endsWith('PreferredRank') ? 0 : 1,
    }))
    .filter((row) => /^Q\d+$/.test(row.qid) && WATCH_ID_PROPS[row.pid]?.pattern.test(row.value))
    .sort(
      (a, b) =>
        PROP_ORDER.indexOf(a.pid) - PROP_ORDER.indexOf(b.pid) || a.preferred - b.preferred || a.value.localeCompare(b.value),
    )
  const out = new Map()
  for (const row of rows) {
    const spec = WATCH_ID_PROPS[row.pid]
    const ids = out.get(row.qid) ?? {}
    if (ids[spec.platformId]) continue
    out.set(row.qid, { ...ids, [spec.platformId]: `${spec.prefix ?? ''}${row.value}` })
  }
  return out
}

export function buildWatchIdsFile(rows, matches, idsByQid) {
  const titles = {}
  for (const row of [...rows].sort((a, b) => a.id.localeCompare(b.id))) {
    const qid = matches.get(row.id)
    const ids = qid ? idsByQid.get(qid) : undefined
    if (!qid || !ids || !Object.keys(ids).length) continue
    titles[row.id] = { title: row.title, year: row.year, qid, ids }
  }
  return {
    schemaVersion: 1,
    source: 'Wikidata (CC0) — official streaming IDs matched on exact title and year',
    titles,
  }
}

export function countByPlatform(file) {
  const counts = {}
  for (const entry of Object.values(file.titles)) {
    for (const platformId of Object.keys(entry.ids)) counts[platformId] = (counts[platformId] ?? 0) + 1
  }
  return counts
}

export async function sparql(query, fetchImpl = fetch) {
  const res = await fetchImpl(ENDPOINT, {
    method: 'POST',
    headers: {
      accept: 'application/sparql-results+json',
      'content-type': 'application/x-www-form-urlencoded',
      'user-agent': USER_AGENT,
    },
    body: `format=json&query=${encodeURIComponent(query)}`,
    signal: AbortSignal.timeout(55_000),
  })
  if (!res.ok) throw new Error(`Wikidata HTTP ${res.status}`)
  const json = await res.json()
  return json.results?.bindings ?? []
}

const chunks = (list, size) => Array.from({ length: Math.ceil(list.length / size) }, (_, i) => list.slice(i * size, i * size + size))
const pause = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

export async function fetchWatchIds(qids, query = sparql) {
  const merged = new Map()
  for (const batch of chunks([...new Set(qids)], ID_BATCH)) {
    for (const [qid, ids] of toWatchIds(await query(watchIdsQuery(batch)))) merged.set(qid, ids)
    await pause(PAUSE_MS)
  }
  return merged
}

export async function matchCatalog(rows, query = sparql) {
  const bindings = []
  for (const batch of chunks([...new Set(rows.map((row) => row.title))], LABEL_BATCH)) {
    bindings.push(...(await query(labelQuery(batch))))
    await pause(PAUSE_MS)
  }
  return pickMatches(rows, bindings)
}

async function main() {
  const here = (path) => fileURLToPath(new URL(path, import.meta.url))
  const out = process.argv[2] ?? here(OUT_FILE)
  const seen = new Set()
  const rows = [
    ...DATA_FILES.flatMap((file) => readCatalogRows(readFileSync(here(file), 'utf8'))),
    ...readTopPicks(JSON.parse(readFileSync(here(TOP_PICKS_FILE), 'utf8'))),
  ].filter((row) => (seen.has(row.id) ? false : (seen.add(row.id), true)))
  const started = Date.now()
  try {
    const matches = await matchCatalog(rows)
    const file = buildWatchIdsFile(rows, matches, await fetchWatchIds([...matches.values()]))
    writeFileSync(out, `${JSON.stringify(file, null, 2)}\n`)
    const seconds = Math.round((Date.now() - started) / 1000)
    console.log(
      `wrote ${out}: ${rows.length} catalog titles, ${matches.size} matched on Wikidata, ${Object.keys(file.titles).length} with IDs (${seconds}s)`,
    )
    console.log(JSON.stringify(countByPlatform(file)))
  } catch (error) {
    console.warn(`watch IDs not refreshed: ${error instanceof Error ? error.message : error}`)
    if (existsSync(out)) console.warn(`keeping ${out}`)
    process.exitCode = 1
  }
}

if (process.argv[1]?.replace(/\\/g, '/').endsWith('scripts/fetch-watch-ids.mjs')) {
  await main()
}
