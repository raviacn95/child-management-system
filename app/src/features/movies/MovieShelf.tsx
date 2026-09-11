import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { ExternalLink, RefreshCw } from 'lucide-react'
import { Badge, Button, Field, inputClass } from '../../components/ui'
import { platforms, recommendMovies } from './recommend'
import type { MovieKind, MovieLang, MovieShelfKind } from './schema'
import { useStore } from '../../store'
import { isTvMode } from '../../lib/tv'
import { fireTvIntent } from '../ott/fireTv'

const FAMILY_LANGS: { id: MovieLang | 'all'; label: string }[] = [
  { id: 'all', label: 'All languages' },
  { id: 'ml', label: 'Malayalam' },
  { id: 'hi', label: 'Hindi' },
  { id: 'en', label: 'English' },
  { id: 'ta', label: 'Tamil' },
  { id: 'te', label: 'Telugu' },
  { id: 'kn', label: 'Kannada' },
]

const EROTIC_LANGS: { id: MovieLang | 'all'; label: string }[] = [
  { id: 'all', label: 'All languages' },
  { id: 'ml', label: 'Malayalam' },
  { id: 'hi', label: 'Hindi' },
  { id: 'ta', label: 'Tamil' },
  { id: 'te', label: 'Telugu' },
  { id: 'kn', label: 'Kannada' },
  { id: 'bn', label: 'Bengali' },
  { id: 'mr', label: 'Marathi' },
  { id: 'en', label: 'English' },
  { id: 'fr', label: 'French' },
  { id: 'es', label: 'Spanish' },
  { id: 'it', label: 'Italian' },
  { id: 'ja', label: 'Japanese' },
  { id: 'ko', label: 'Korean' },
]

const DECADES = [1960, 1970, 1980, 1990, 2000, 2010, 2020] as const

export function MovieShelf({
  compact = false,
  shelf = 'family',
}: {
  compact?: boolean
  shelf?: MovieShelfKind
}) {
  const erotic = shelf === 'erotic'
  const { state } = useStore()
  const tv = isTvMode()
  const connectedKey = (state.ottAccounts ?? [])
    .filter((a) => a.userId === state.currentUserId && a.connected)
    .map((a) => a.platformId)
    .sort()
    .join(',')
  const limit = erotic ? 150 : 100
  const langs = erotic ? EROTIC_LANGS : FAMILY_LANGS
  const [lang, setLang] = useState<MovieLang | 'all'>(erotic ? 'all' : 'ml')
  const [kind, setKind] = useState<MovieKind | 'all'>('all')
  const [platformId, setPlatformId] = useState('')
  const [decade, setDecade] = useState<number | 'all'>('all')
  const [sort, setSort] = useState<'mix' | 'critic' | 'youtube' | 'instagram' | 'erotic'>(erotic ? 'erotic' : 'mix')
  const [seed, setSeed] = useState(() => `live-${Date.now()}`)

  const result = useMemo(() => {
    const nextWeights =
      sort === 'erotic'
        ? { critic: 0.05, audience: 0.1, youtube: 0.15, instagram: 0.2, erotic: 0.5 }
        : sort === 'critic'
          ? { critic: 0.7, audience: 0.15, youtube: 0.1, instagram: 0.05, erotic: erotic ? 0.1 : 0 }
          : sort === 'youtube'
            ? { critic: 0.15, audience: 0.1, youtube: 0.6, instagram: 0.15, erotic: erotic ? 0.15 : 0 }
            : sort === 'instagram'
              ? { critic: 0.15, audience: 0.1, youtube: 0.15, instagram: 0.6, erotic: erotic ? 0.15 : 0 }
              : erotic
                ? { critic: 0.1, audience: 0.15, youtube: 0.2, instagram: 0.2, erotic: 0.35 }
                : { critic: 0.35, audience: 0.2, youtube: 0.25, instagram: 0.2, erotic: 0 }
    return recommendMovies({
      shelf,
      limit,
      languages: lang === 'all' ? undefined : [lang],
      kind: kind === 'all' ? undefined : kind,
      platformId: platformId || undefined,
      decade: decade === 'all' ? undefined : decade,
      weights: nextWeights,
      seed,
      tv,
      connectedPlatformIds: connectedKey ? connectedKey.split(',') : [],
    })
  }, [shelf, limit, lang, kind, platformId, decade, sort, seed, erotic, tv, connectedKey])

  return (
    <section className={compact ? '' : 'mt-10'} data-testid={erotic ? 'erotic-shelf' : 'movie-shelf'}>
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div>
          {compact ? null : (
            <h2 className="font-display text-2xl">{erotic ? '150 erotic titles (18+)' : '100 movies & series'}</h2>
          )}
          <p className={`${compact ? '' : 'mt-1 '}text-sm text-muted`}>
            {result.platformCount} official storefronts · catalog {result.totalCatalog} · ranked by critics, audience,
            YouTube{erotic ? ', Instagram and erotic heat' : ' and Instagram heat'}. New {limit} each refresh.
          </p>
        </div>
        <Button onClick={() => setSeed(`live-${Date.now()}`)} aria-label={`Shuffle ${limit} titles`}>
          <RefreshCw size={16} /> Shuffle {limit}
        </Button>
      </div>

      <div className="mb-4 flex flex-wrap gap-2">
        {langs.map((l) => (
          <Button key={l.id} variant={lang === l.id ? 'primary' : 'ghost'} onClick={() => setLang(l.id)}>
            {l.label}
          </Button>
        ))}
      </div>
      {erotic ? (
        <div className="mb-4 flex flex-wrap gap-2">
          <Button variant={decade === 'all' ? 'primary' : 'ghost'} onClick={() => setDecade('all')}>
            All years
          </Button>
          {DECADES.map((d) => (
            <Button key={d} variant={decade === d ? 'primary' : 'ghost'} onClick={() => setDecade(d)}>
              {d}s
            </Button>
          ))}
        </div>
      ) : null}
      <div className="mb-4 grid gap-3 md:grid-cols-3">
        <Field label="Type">
          <select className={inputClass} value={kind} onChange={(e) => setKind(e.target.value as MovieKind | 'all')}>
            <option value="all">Movies + series</option>
            <option value="movie">Movies</option>
            <option value="series">Series</option>
          </select>
        </Field>
        <Field label="Rank by">
          <select className={inputClass} value={sort} onChange={(e) => setSort(e.target.value as typeof sort)}>
            {erotic ? <option value="erotic">Erotic / nude heat first</option> : null}
            <option value="mix">Critics + YT + Insta mix</option>
            <option value="critic">Critics first</option>
            <option value="youtube">YouTube recs</option>
            <option value="instagram">Instagram recs</option>
          </select>
        </Field>
        <Field label="Channel">
          <select className={inputClass} value={platformId} onChange={(e) => setPlatformId(e.target.value)}>
            <option value="">All 50+ channels</option>
            {platforms.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </Field>
      </div>

      <p className="mb-3 text-xs text-muted" data-testid={erotic ? 'erotic-count' : 'movie-count'}>
        Showing {result.count} titles · seed {result.seed}
      </p>
      <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {result.titles.map((t, i) => (
          <li key={`${t.id}-${i}`} className="card p-4" data-testid={erotic ? 'erotic-card' : 'movie-card'}>
            <div className="flex items-start justify-between gap-2">
              <h3 className="font-semibold">
                {i + 1}. {t.title}
              </h3>
              <Badge tone={erotic ? 'clay' : t.languages.includes('ml') ? 'pine' : 'sand'}>{t.kind}</Badge>
            </div>
            <p className="mt-1 text-xs text-muted">
              {t.year} · {t.languages.join(', ')} · {t.genres.slice(0, 2).join(', ')}
            </p>
            <p className="mt-2 text-sm">{t.why}</p>
            <p className="mt-1 text-xs text-pine">
              Score {t.score.toFixed(0)} · {t.reasons.slice(0, 3).join(' · ')}
            </p>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {t.watchLinks.map((w) => (
                <a
                  key={w.platformId}
                  className="rounded-lg border border-line px-2 py-1 text-xs font-semibold text-pine hover:border-pine"
                  href={tv ? fireTvIntent(w.platformId, t.title, t.year) : w.url}
                  target="_blank"
                  rel="noreferrer"
                >
                  {w.platformName} <ExternalLink className="inline" size={10} />
                </a>
              ))}
            </div>
          </li>
        ))}
      </ul>
      <ul className="mt-4 space-y-1 text-xs text-muted">
        {result.safeguards.map((s) => (
          <li key={s}>{s}</li>
        ))}
      </ul>
    </section>
  )
}

export function MovieShelfPanel() {
  return (
    <section className="card p-5" data-testid="movie-shelf-panel" aria-labelledby="movie-shelf-heading">
      <div className="mb-3 flex items-center justify-between gap-2">
        <h2 id="movie-shelf-heading" className="font-display text-xl">
          100 movies
        </h2>
        <Link to="/movies" className="text-sm font-semibold text-pine">
          Open shelf →
        </Link>
      </div>
      <p className="text-xs text-muted">
        Malayalam-first mix across Prime, Google Movies, SonyLIV and 50+ official channels. Shuffle a new 100 anytime.
      </p>
    </section>
  )
}
