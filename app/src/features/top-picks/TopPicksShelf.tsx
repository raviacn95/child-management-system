import { Badge } from '../../components/ui'
import { isTvMode } from '../../lib/tv'
import { useTheme } from '../../theme/ThemeProvider'
import { fireTvIntent } from '../ott/fireTv'
import { useOpenWatch } from '../ott/WatchPane'
import { hubRowTitle, recommendTopPicks } from './feed'

export function TopPicksShelf() {
  const { look } = useTheme()
  const tv = isTvMode()
  const picks = recommendTopPicks(look)
  const openWatch = useOpenWatch()

  return (
    <section className="mb-8" data-testid="top-picks">
      <div className="mb-3">
        <h2 className="font-display text-2xl font-semibold">{hubRowTitle(look)}</h2>
        <p className="mt-1 text-sm text-muted">
          Five films and five series with a short plot and a clear why-to-watch. Ratings are cited from public reviews —
          Willow does not scrape IMDb or send child records. Watch buttons open official storefronts only.
        </p>
      </div>
      <ul className="grid gap-3 md:grid-cols-2">
        {picks.map((pick) => (
          <li key={pick.id} className="card p-4" data-testid="top-pick-card">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div className="min-w-0">
                <h3 className="font-semibold">{pick.title}</h3>
                <p className="text-xs text-muted">
                  {pick.year} · {pick.kind === 'series' ? 'Series' : 'Movie'} · {pick.genres.slice(0, 2).join(', ')}
                </p>
              </div>
              <Badge tone="gold">{pick.rating}</Badge>
            </div>
            <p className="mt-2 text-sm">{pick.summary}</p>
            <p className="mt-2 rounded-xl bg-pine-soft px-3 py-2 text-sm text-pine" data-testid="why-to-watch">
              <span className="font-semibold">Why watch: </span>
              {pick.whyToWatch}
            </p>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {pick.watchLinks.map((link) => {
                const href = tv ? fireTvIntent(link.platformId, pick.title, pick.year, pick.originalLang) : link.url
                return (
                  <button
                    key={link.platformId}
                    type="button"
                    className="rounded-lg border border-line px-2 py-1 text-xs font-semibold text-pine hover:border-pine"
                    onClick={() => openWatch({ url: href, title: pick.title, platformName: link.platformName })}
                  >
                    {link.platformName}
                  </button>
                )
              })}
              <button
                type="button"
                className="rounded-lg border border-line px-2 py-1 text-xs font-semibold text-muted"
                data-testid="top-pick-source"
                onClick={() =>
                  openWatch({ url: pick.sourceLink, title: `${pick.title} · cited review`, platformName: pick.sourceName })
                }
              >
                {pick.sourceName}
              </button>
            </div>
          </li>
        ))}
      </ul>
    </section>
  )
}
