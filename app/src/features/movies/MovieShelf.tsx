import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, ExternalLink, RefreshCw } from 'lucide-react'
import { Badge, Button, Field, inputClass } from '../../components/ui'
import { platforms, recommendMovies } from './recommend'
import { trailerUrl } from './catalog'
import { LANG_LABEL, type MovieKind, type MovieLang, type MovieShelfKind } from './schema'
import { useStore } from '../../store'
import { isTvMode } from '../../lib/tv'
import { PlayOnTv } from '../cast/PlayOnTv'
import { CustomAppLinks } from '../ott/CustomAppLinks'
import { fireTvIntent } from '../ott/fireTv'
import { useWatchDesk } from '../ott/WatchPane'
import { applyYearOrder, type YearSort } from './yearSort'
import { freshToCatalogTitles, withFreshTitles } from './freshShelf'
import { useFreshMovies } from './useFreshMovies'

const FAMILY_LANGS: { id: MovieLang | 'all'; label: string }[] = [
  { id: 'all', label: 'All languages' },
  { id: 'ml', label: 'Malayalam' },
  { id: 'hi', label: 'Hindi' },
  { id: 'en', label: 'English' },
  { id: 'ta', label: 'Tamil' },
  { id: 'te', label: 'Telugu' },
  { id: 'kn', label: 'Kannada' },
  { id: 'bn', label: 'Bengali' },
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
const FRESH_ON_SHELF = 30

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
  const adFreeKey = (state.ottAccounts ?? [])
    .filter((a) => a.userId === state.currentUserId && a.connected && a.adTier === 'ad-free')
    .map((a) => a.platformId)
    .sort()
    .join(',')
  const preferAdFree = state.preferAdFree !== false
  const { cache: freshCache } = useFreshMovies(!erotic)
  const limit = erotic ? 150 : 100
  const langs = erotic ? EROTIC_LANGS : FAMILY_LANGS
  const [lang, setLang] = useState<MovieLang | 'all'>('all')
  const [kind, setKind] = useState<MovieKind | 'all'>('all')
  const [platformId, setPlatformId] = useState('')
  const [decade, setDecade] = useState<number | 'all'>('all')
  const [sort, setSort] = useState<'mix' | 'critic' | 'youtube' | 'instagram' | 'erotic' | YearSort>(erotic ? 'erotic' : 'mix')
  const [seed, setSeed] = useState(() => `live-${Date.now()}`)
  const [openKey, setOpenKey] = useState<string | null>(null)
  const { openOfficialNow } = useWatchDesk()

  useEffect(() => {
    setOpenKey(null)
  }, [lang, kind, platformId, decade, sort, seed])

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key === 'Escape') setOpenKey(null)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  useEffect(() => {
    if (!openKey) return
    document.querySelector<HTMLButtonElement>('[data-testid="movie-back"]')?.focus()
  }, [openKey])

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
      originalsOnly: lang !== 'all',
      kind: kind === 'all' ? undefined : kind,
      platformId: platformId || undefined,
      decade: decade === 'all' ? undefined : decade,
      weights: nextWeights,
      seed,
      region: state.countryCode,
      tv,
      connectedPlatformIds: connectedKey ? connectedKey.split(',') : [],
      adFreePlatformIds: adFreeKey ? adFreeKey.split(',') : [],
      preferAdFree,
    })
  }, [shelf, limit, lang, kind, platformId, decade, sort, seed, erotic, tv, connectedKey, adFreeKey, preferAdFree, state.countryCode])

  const shelfTitles = useMemo(() => {
    if (erotic) return result.titles
    return withFreshTitles(result.titles, freshToCatalogTitles(freshCache?.feed), {
      limit,
      maxFresh: FRESH_ON_SHELF,
      lang: lang === 'all' ? undefined : lang,
      kind: kind === 'all' ? undefined : kind,
      platformId: platformId || undefined,
      region: state.countryCode,
      links: {
        tv,
        connectedIds: connectedKey ? connectedKey.split(',') : [],
        adFreeIds: adFreeKey ? adFreeKey.split(',') : [],
        preferAdFree,
      },
    })
  }, [result, freshCache, erotic, limit, lang, kind, platformId, state.countryCode, tv, connectedKey, adFreeKey, preferAdFree])
  const titles = applyYearOrder(shelfTitles, sort === 'newest' || sort === 'oldest' ? sort : 'ranked')
  const langLabel = lang === 'all' ? null : LANG_LABEL[lang]
  const countLine = langLabel
    ? `Showing ${titles.length} original ${langLabel} titles`
    : `Showing ${titles.length} titles`

  return (
    <section className={compact ? '' : 'mt-10'} data-testid={erotic ? 'erotic-shelf' : 'movie-shelf'}>
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div>
          {compact ? null : <h2 className="font-display text-2xl">{erotic ? '150 mature titles (18+)' : '100 movies & series'}</h2>}
          <p className={`${compact ? '' : 'mt-1 '}text-sm text-muted`}>
            {result.platformCount} official storefronts · catalog {result.totalCatalog} · ranked by critic/audience
            agreement, hidden gems and diversity{erotic ? ', with mature-cinema quality signals' : ''}. Channels open on
            this page — Close returns here. Region discovery follows the active country pack ({state.countryCode}); a
            language chip is originals only — no dubbed copies.
          </p>
        </div>
        <Button data-tv-focus="1" onClick={() => setSeed(`live-${Date.now()}`)} aria-label={`Shuffle ${limit} titles`}>
          <RefreshCw size={16} /> Shuffle {limit}
        </Button>
      </div>

      <div className="mb-4 flex flex-wrap gap-2">
        {langs.map((l) => (
          <Button
            key={l.id}
            data-tv-focus="1"
            variant={lang === l.id ? 'primary' : 'ghost'}
            aria-pressed={lang === l.id}
            onClick={() => setLang(l.id)}
          >
            {l.label}
          </Button>
        ))}
      </div>
      {langLabel ? (
        <p className="mb-4 text-xs font-semibold text-pine" data-testid="originals-only">
          Original {langLabel} only — remakes and dubbed copies of the same story are hidden.
        </p>
      ) : null}
      {erotic ? (
        <div className="mb-4 flex flex-wrap gap-2">
          <Button variant={decade === 'all' ? 'primary' : 'ghost'} aria-pressed={decade === 'all'} onClick={() => setDecade('all')}>
            All years
          </Button>
          {DECADES.map((d) => (
            <Button key={d} variant={decade === d ? 'primary' : 'ghost'} aria-pressed={decade === d} onClick={() => setDecade(d)}>
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
            {erotic ? <option value="erotic">Mature cinema quality</option> : null}
            <option value="mix">Taste + diversity mix</option>
            <option value="critic">Critics first</option>
            <option value="youtube">YouTube recs</option>
            <option value="instagram">Instagram recs</option>
            <option value="newest">Newest first</option>
            <option value="oldest">Oldest first</option>
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
        {countLine} · seed {result.seed}
      </p>
      <ul className={tv ? 'movie-rail' : 'movie-grid'}>
        {titles.map((t, i) => {
          const key = `${t.id}-${i}`
          const open = openKey === key
          return (
            <li key={key} className="card movie-card p-4" data-testid={erotic ? 'erotic-card' : 'movie-card'}>
              {open ? (
                <div data-testid="movie-detail">
                  <Button
                    type="button"
                    variant="ghost"
                    className="movie-back mb-3"
                    data-tv-focus="1"
                    data-testid="movie-back"
                    onClick={() => setOpenKey(null)}
                  >
                    <ArrowLeft size={16} /> Back
                  </Button>
                  <h3 className="font-semibold">{t.title}</h3>
                  <p className="mt-2 text-sm" data-testid="movie-summary">
                    {t.why}
                  </p>
                </div>
              ) : (
                <div>
                  <div className="movie-banner" aria-hidden="true">
                    <span className="movie-banner-mark">W</span>
                    <span className="movie-banner-title">{t.title}</span>
                    <span className="movie-banner-meta">{t.year} · {LANG_LABEL[t.originalLang]}</span>
                  </div>
                  <button
                    type="button"
                    className="movie-open w-full text-left"
                    data-tv-focus="1"
                    data-testid={erotic ? 'erotic-open' : 'movie-open'}
                    aria-expanded={false}
                    aria-label={`Open ${t.title}`}
                    onClick={() => setOpenKey(key)}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="font-semibold">
                        <span className="movie-rank">{i + 1}.</span> {t.title}
                      </h3>
                      <Badge tone={erotic ? 'clay' : t.originalLang === 'ml' ? 'pine' : 'sand'}>{t.kind}</Badge>
                    </div>
                    <p className="mt-1 text-xs text-muted">
                      {t.year} · Original {LANG_LABEL[t.originalLang]}
                    </p>
                  </button>
                  <div className="mt-3 flex flex-wrap gap-1.5" data-testid={erotic ? 'erotic-watch' : 'movie-watch'}>
                    <PlayOnTv title={t.title} year={t.year} lang={t.originalLang} links={t.watchLinks} />
                    <a
                      className="movie-trailer-link rounded-lg bg-pine px-2 py-1 text-xs font-semibold text-[var(--color-pine-ink)] hover:brightness-110"
                      data-tv-focus="1"
                      href={trailerUrl(t.title, t.year, t.originalLang)}
                      onClick={(e) => {
                        e.preventDefault()
                        openOfficialNow({
                          url: trailerUrl(t.title, t.year, t.originalLang),
                          title: `${t.title} trailer`,
                          platformName: 'YouTube trailer',
                        })
                      }}
                    >
                      YouTube trailer <ExternalLink className="inline" size={10} />
                    </a>
                    {t.watchLinks.map((w) => {
                      const href = tv ? fireTvIntent(w.platformId, t.title, t.year, t.originalLang) : w.url
                      return (
                        <a
                          key={w.platformId}
                          data-watch-link={w.platformId}
                          className="rounded-lg border border-line px-2 py-1 text-xs font-semibold text-pine hover:border-pine"
                          data-tv-focus="1"
                          href={href}
                          onClick={(e) => {
                            e.preventDefault()
                            openOfficialNow({ url: href, title: t.title, platformName: w.platformName })
                          }}
                        >
                          {w.resolver ? w.platformName : `Search ${w.platformName}`} <ExternalLink className="inline" size={10} />
                          {w.adLabel === 'ad-free' || w.adLabel === 'has-ads' ? (
                            <span
                              className={`ml-1 rounded px-1 text-[10px] ${w.adLabel === 'ad-free' ? 'bg-pine-soft text-pine' : 'bg-sand text-muted'}`}
                              data-testid="watch-ad-marker"
                              title={adFreeKey.split(',').includes(w.platformId) ? 'Ad-free on your plan' : undefined}
                            >
                              {w.adLabel === 'ad-free' ? 'Ad-free' : 'Has ads'}
                            </span>
                          ) : null}
                        </a>
                      )
                    })}
                    <CustomAppLinks title={t.title} year={t.year} shelf={erotic ? 'erotic' : 'family'} />
                  </div>
                </div>
              )}
            </li>
          )
        })}
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
        Original-language shelf across Prime, Google Movies, SonyLIV and 50+ official channels. Pick Malayalam or
        Bengali and you only get that cinema — not dubbed copies.
      </p>
    </section>
  )
}
