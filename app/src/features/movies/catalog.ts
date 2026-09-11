import platformsJson from '../../data/streaming-platforms.json'
import { MOVIE_ROWS, type MovieRow } from '../../data/movies-data'
import { EROTIC_ROWS, type EroticRow } from '../../data/erotic-movies-data'
import {
  LANG_LABEL,
  platformSchema,
  titleSchema,
  type MovieLang,
  type MovieShelfKind,
  type MovieTitle,
} from './schema'
import { z } from 'zod'

/** Remake / shared-story clusters so we do not list the same plot twice as if it were two originals. */
const STORY_ID: Record<string, string> = {
  drishyam: 'drishyam-2013',
  papanasam: 'drishyam-2013',
  'drishyam-2': 'drishyam-2',
  'er-arjun-reddy': 'arjun-reddy',
  'er-kabir-singh': 'arjun-reddy',
  'er-lady-chatterley-06': 'lady-chatterley',
  'er-lady-chatterley-22': 'lady-chatterley',
}

export const platforms = z.array(platformSchema).min(50).parse(platformsJson.platforms)

const platformIds = new Set(platforms.map((p) => p.id))

function split(s: string) {
  return s
    .split(',')
    .map((x) => x.trim())
    .filter(Boolean)
}

function hydrate(rows: Array<MovieRow | EroticRow>, shelf: MovieShelfKind): MovieTitle[] {
  const seen = new Set<string>()
  const out: MovieTitle[] = []
  for (const row of rows) {
    if (seen.has(row[0])) continue
    seen.add(row[0])
    const langs = split(row[4]) as MovieLang[]
    const platformList = split(row[6]).filter((id) => platformIds.has(id))
    const eroticHeat = row.length > 12 ? Number(row[12]) : 0
    out.push(
      titleSchema.parse({
        id: row[0],
        title: row[1],
        year: row[2],
        kind: row[3],
        originalLang: langs[0],
        languages: langs,
        genres: split(row[5]),
        platformIds: platformList.length ? platformList : ['youtube', 'play', 'prime'],
        scores: { critic: row[7], audience: row[8], youtube: row[9], instagram: row[10], erotic: eroticHeat },
        why: row[11],
        adult: shelf === 'erotic',
        shelf,
        storyId: STORY_ID[row[0]],
      }),
    )
  }
  return out
}

export const titles: MovieTitle[] = hydrate(MOVIE_ROWS, 'family')
export const eroticTitles: MovieTitle[] = hydrate(EROTIC_ROWS, 'erotic')

export function fillSearchUrl(template: string, query: string) {
  const q = query.trim()
  const encoded = encodeURIComponent(q)
  if (!q) return template
  if (template.includes('{q}')) return template.replaceAll('{q}', encoded)
  const sep = template.includes('?') ? '&' : '?'
  return `${template}${sep}q=${encoded}`
}

export function watchQuery(movieTitle: string, year?: number, originalLang?: MovieLang) {
  return [movieTitle.trim(), year, originalLang ? LANG_LABEL[originalLang] : null].filter(Boolean).join(' ')
}

export function watchUrl(platformId: string, movieTitle: string, year?: number, originalLang?: MovieLang) {
  const query = watchQuery(movieTitle, year, originalLang)
  const p = platforms.find((x) => x.id === platformId)
  if (!p) return `https://www.youtube.com/results?search_query=${encodeURIComponent(`${query} movie`)}`
  return fillSearchUrl(p.searchUrl, query)
}

export function watchLinks(title: MovieTitle, opts?: { tv?: boolean; connectedIds?: string[] }) {
  const extras = opts?.tv ? ['justwatch'] : ['justwatch', 'youtube']
  const ids = [...title.platformIds.filter((id) => !(opts?.tv && id === 'play'))]
  for (const id of extras) {
    if (!ids.includes(id) && platformIds.has(id)) ids.push(id)
  }
  if (opts?.connectedIds?.length) {
    for (const id of opts.connectedIds) {
      if (!ids.includes(id) && platformIds.has(id)) ids.unshift(id)
    }
  }
  return ids.map((id) => {
    const p = platforms.find((x) => x.id === id)
    return {
      platformId: id,
      platformName: p?.name ?? id,
      url: watchUrl(id, title.title, title.year, title.originalLang),
    }
  })
}

export function catalogStats() {
  return {
    schemaVersion: '1.0.0' as const,
    platformCount: platforms.length,
    titleCount: titles.length,
    eroticTitleCount: eroticTitles.length,
    malayalam: titles.filter((t) => t.originalLang === 'ml').length,
    eroticMalayalam: eroticTitles.filter((t) => t.originalLang === 'ml').length,
  }
}
