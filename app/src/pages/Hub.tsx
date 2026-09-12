import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { WillowCard } from '../components/design/WillowCard'
import { ShareButton } from '../features/share/ShareSheet'
import { PageHead } from '../components/ui'
import { buildHub, weeklyDigest } from '../features/experience/buildHub'
import { useExperience } from '../features/experience/ExperienceProvider'
import type { HubTile } from '../features/experience/buildHub'
import { useOpenWatch } from '../features/ott/WatchPane'
import { ageMonths, childName } from '../lib'
import { today } from '../data/seed'
import { useStore } from '../store'
import { useTheme } from '../theme/ThemeProvider'

const BADGE: Record<string, string> = {
  hub: 'Opened Tonight',
  look: 'Picked a look',
  search: 'Smart search',
  together: 'Watch together',
  digest: 'Heard the digest',
  resume: 'Picked up again',
}

export function HubPage() {
  const { state } = useStore()
  const { look } = useTheme()
  const { profile, remember, earn } = useExperience()
  const openWatch = useOpenWatch()
  const user = state.users.find((u) => u.id === state.currentUserId)!
  const siteChildren = state.children.filter(
    (c) => c.siteId === state.currentSiteId && (user.role !== 'parent' || user.childIds.includes(c.id)),
  )
  const enrolled = siteChildren.filter((c) => c.status === 'enrolled')
  const present = enrolled.filter((c) =>
    state.attendance.some((a) => a.childId === c.id && a.date === today() && a.checkIn && !a.checkOut),
  )
  const firstChild = enrolled[0]
  const childAgeYears = firstChild ? Math.max(1, Math.floor(ageMonths(firstChild.dob) / 12)) : undefined
  const rows = buildHub({
    look,
    role: user.role,
    resume: profile.resume,
    watchTogether: profile.watchTogether,
    childAgeYears,
  })
  const digest = weeklyDigest({
    present: present.length,
    enrolled: enrolled.length,
    look,
    childNames: enrolled.map(childName),
  })

  useEffect(() => {
    earn('hub')
  }, [earn])

  function openTile(tile: HubTile) {
    remember({ id: tile.id, kind: tile.kind === 'care' ? 'page' : tile.kind === 'page' ? 'page' : tile.kind, title: tile.title, href: tile.href })
    if (tile.id.startsWith('page-') || profile.resume.some((card) => card.id === tile.id)) earn('resume')
    if (tile.kind === 'learning' && profile.watchTogether) earn('together')
    if (tile.watchUrl) {
      openWatch({ url: tile.watchUrl, title: tile.title, platformName: tile.kind === 'learning' ? 'YouTube Kids' : 'Official' })
    }
  }

  function speakDigest() {
    if (!('speechSynthesis' in window)) return
    window.speechSynthesis.cancel()
    window.speechSynthesis.speak(new SpeechSynthesisUtterance(digest.join(' ')))
    earn('digest')
  }

  return (
    <div data-testid="household-hub">
      <PageHead
        title="Household Hub"
        subtitle={`${user.name.split(' ')[0]} · ${look} look · kids’ learning, parent growth, and family movies`}
        actions={
          <div className="flex flex-wrap gap-2">
            <ShareButton className="px-3 py-2 text-sm" />
            <button type="button" className="rounded-xl border border-line bg-paper px-3 py-2 text-sm font-semibold" onClick={speakDigest}>
              Hear this week
            </button>
          </div>
        }
      />
      <div className="mb-6" data-testid="weekly-digest">
        <WillowCard look={look} kicker="This week" title="Household digest" subtitle={digest.join(' ')} />
      </div>
      {profile.achievements.length > 0 ? (
        <div className="mb-6 flex flex-wrap gap-2" data-testid="hub-achievements">
          {profile.achievements.map((id) => (
            <span key={id} className="rounded-full bg-pine-soft px-2.5 py-1 text-[11px] font-semibold text-pine">
              {BADGE[id] ?? id}
            </span>
          ))}
        </div>
      ) : null}
      {rows.map((row) => (
        <section key={row.id} className="hub-row" data-testid={`hub-row-${row.id}`}>
          <h2 className="hub-row-title">{row.title}</h2>
          <div className="hub-rail">
            {row.tiles.map((tile) => (
              <Link
                key={tile.id}
                to={tile.href}
                className={`hub-tile hub-tile-${tile.kind}`}
                onClick={() => openTile(tile)}
              >
                <span className="hub-tile-kicker">{tile.kind}</span>
                <span className="hub-tile-title">{tile.title}</span>
                <span className="hub-tile-sub">{tile.subtitle}</span>
              </Link>
            ))}
          </div>
        </section>
      ))}
      <p className="mt-6 text-xs text-muted">
        Grocery lists still export to Zepto or Blinkit from Meals. Watch links open official storefronts only.
      </p>
    </div>
  )
}
