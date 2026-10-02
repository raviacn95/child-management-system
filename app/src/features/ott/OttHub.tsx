import { useState } from 'react'
import { Badge, Button, Field, inputClass, PageHead } from '../../components/ui'
import { platforms } from '../movies/catalog'
import { watchUrl } from '../movies/catalog'
import { CustomAppsCard } from './CustomAppsCard'
import { fireTvIntent } from './fireTv'
import { useOpenWatch } from './WatchPane'
import { useStore } from '../../store'
import { isTvMode } from '../../lib/tv'
import type { OttAdTier } from '../../types'

const PRIORITY = ['prime', 'netflix', 'hotstar', 'sonyliv', 'zee5', 'youtube', 'aha', 'sunnxt', 'manoramamax', 'mubi']

const PLAN_CHOICES: { id: OttAdTier; label: string }[] = [
  { id: 'ad-free', label: 'Ad-free' },
  { id: 'with-ads', label: 'Has ads' },
  { id: 'unknown', label: 'Not sure' },
]

type Platform = (typeof platforms)[number]

function planHint(p: Platform | undefined) {
  if (!p?.ads) return null
  if (p.ads === 'none') return `${p.name}: every plan is ad-free`
  if (p.ads === 'always') return `${p.name}: always shows ads`
  if (p.ads === 'tiered') return p.adFreeTier ? `${p.name} ad-free plan: ${p.adFreeTier}` : `${p.name}: ad-free only on some plans`
  return null
}

function PlanPicker({ label, value, onChange }: { label: string; value: OttAdTier; onChange: (tier: OttAdTier) => void }) {
  return (
    <div className="flex flex-wrap gap-2" role="group" aria-label={label}>
      {PLAN_CHOICES.map((choice) => (
        <Button
          key={choice.id}
          type="button"
          data-tv-focus="1"
          variant={value === choice.id ? 'soft' : 'ghost'}
          aria-pressed={value === choice.id}
          onClick={() => onChange(choice.id)}
        >
          {choice.label}
        </Button>
      ))}
    </div>
  )
}

export function OttHub() {
  const { state, upsertOttAccount, disconnectOtt, touchOtt, setPreferAdFree } = useStore()
  const userId = state.currentUserId ?? ''
  const mine = (state.ottAccounts ?? []).filter((a) => a.userId === userId)
  const [platformId, setPlatformId] = useState('prime')
  const [email, setEmail] = useState('')
  const [adTier, setAdTier] = useState<OttAdTier>('unknown')
  const tv = isTvMode()
  const openWatch = useOpenWatch()
  const preferAdFree = state.preferAdFree !== false
  const ordered = [...platforms].sort((a, b) => {
    const ra = PRIORITY.includes(a.id) ? PRIORITY.indexOf(a.id) : 80
    const rb = PRIORITY.includes(b.id) ? PRIORITY.indexOf(b.id) : 80
    return ra - rb || a.name.localeCompare(b.name)
  })
  const selectedHint = planHint(platforms.find((p) => p.id === platformId))

  return (
    <div data-testid="ott-hub">
      <PageHead
        title="My OTT logins"
        subtitle="Save which streaming apps this Willow user uses. Passwords stay in Prime, Netflix, SonyLIV and the rest on your Fire Stick — Willow only remembers the account email and opens the official app."
      />
      <section className="card mb-6 flex flex-wrap items-center justify-between gap-3 p-5">
        <div>
          <h2 className="font-display text-xl">Ad-free first</h2>
          <p className="mt-1 text-sm text-muted">
            Movies list the services you marked as an ad-free plan first, and the TV Watch button opens one of them. Willow
            only opens official apps — it never hides or skips ads.
          </p>
        </div>
        <Button
          type="button"
          role="switch"
          data-tv-focus="1"
          data-testid="ad-free-first"
          variant={preferAdFree ? 'primary' : 'ghost'}
          aria-checked={preferAdFree}
          onClick={() => setPreferAdFree(!preferAdFree)}
        >
          Ad-free first: {preferAdFree ? 'On' : 'Off'}
        </Button>
      </section>
      <section className="card mb-6 p-5">
        <h2 className="font-display text-xl">Connect a channel</h2>
        <p className="mt-1 text-sm text-muted">
          One vault per Willow login. On Fire TV, Open app jumps into the storefront you already signed into on the Stick.
        </p>
        <div className="mt-4 grid gap-3 md:grid-cols-3">
          <Field label="OTT">
            <select className={inputClass} value={platformId} onChange={(e) => setPlatformId(e.target.value)}>
              {ordered.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Account email / ID (reminder only)">
            <input
              className={inputClass}
              value={email}
              autoComplete="username"
              placeholder="you@family.com"
              onChange={(e) => setEmail(e.target.value)}
            />
          </Field>
          <div className="flex items-end">
            <Button
              onClick={() => {
                if (!userId) return
                upsertOttAccount({ userId, platformId, email: email.trim(), connected: true, adTier })
                setEmail('')
                setAdTier('unknown')
              }}
            >
              Save to my vault
            </Button>
          </div>
        </div>
        <div className="mt-4">
          <p className="mb-1.5 text-sm font-medium text-ink">My plan</p>
          <PlanPicker label="My plan" value={adTier} onChange={setAdTier} />
          {selectedHint ? <p className="mt-1.5 text-xs text-muted">{selectedHint}</p> : null}
        </div>
      </section>
      <CustomAppsCard />
      <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {mine.length === 0 ? (
          <li className="card p-5 text-sm text-muted">No OTTs saved yet. Add Prime, Netflix, SonyLIV, Hotstar…</li>
        ) : (
          mine.map((a) => {
            const p = platforms.find((x) => x.id === a.platformId)
            const name = p?.name ?? a.platformId
            const tier = a.adTier ?? 'unknown'
            const hint = planHint(p)
            return (
              <li key={a.id} className="card p-4" data-testid="ott-card">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-semibold">{name}</h3>
                  <div className="flex flex-wrap justify-end gap-1">
                    {tier === 'ad-free' ? <Badge tone="pine">Ad-free plan</Badge> : null}
                    {tier === 'with-ads' ? <Badge>Has ads</Badge> : null}
                    <Badge tone="pine">Saved</Badge>
                  </div>
                </div>
                <p className="mt-1 text-sm">{a.email || 'Email not stored'}</p>
                <p className="mt-1 text-xs text-muted">
                  {a.lastOpenedAt ? `Last opened ${a.lastOpenedAt.slice(0, 16).replace('T', ' ')}` : 'Not opened yet'}
                </p>
                {hint ? <p className="mt-1 text-xs text-muted">{hint}</p> : null}
                <div className="mt-3">
                  <PlanPicker
                    label={`My plan for ${name}`}
                    value={tier}
                    onChange={(next) =>
                      upsertOttAccount({
                        id: a.id,
                        userId: a.userId,
                        platformId: a.platformId,
                        email: a.email,
                        connected: true,
                        adTier: next,
                      })
                    }
                  />
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Button
                    data-tv-focus="1"
                    onClick={() => {
                      touchOtt(a.id)
                      openWatch({
                        url: tv ? fireTvIntent(a.platformId, p?.name) : watchUrl(a.platformId, p?.name || a.platformId),
                        title: name,
                        platformName: name,
                      })
                    }}
                  >
                    Open app
                  </Button>
                  <Button variant="ghost" data-tv-focus="1" onClick={() => disconnectOtt(a.id)}>
                    Remove
                  </Button>
                </div>
              </li>
            )
          })
        )}
      </ul>
    </div>
  )
}
