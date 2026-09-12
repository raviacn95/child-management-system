import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { ExternalLink, ThumbsDown, ThumbsUp } from 'lucide-react'
import { Badge, Button, Field, PageHead, inputClass } from '../../components/ui'
import { useStore } from '../../store'
import type { ParentCategory, ParentGoal, ParentLang, ParentTimeMode } from './schema'
import { DEFAULT_PARENT_PROFILE, planParentFeed } from './plan'
import { MovieShelf } from '../movies/MovieShelf'
import { TopPicksShelf } from '../top-picks/TopPicksShelf'

const INTERESTS: { id: ParentCategory; label: string }[] = [
  { id: 'movies', label: 'Movies' },
  { id: 'learning', label: 'Learning' },
  { id: 'parenting', label: 'Parenting' },
  { id: 'finance', label: 'Finance' },
  { id: 'health', label: 'Health' },
]

const GOALS: { id: ParentGoal; label: string }[] = [
  { id: 'parenting', label: 'Parenting excellence' },
  { id: 'wealth', label: 'Wealth growth' },
  { id: 'learning', label: 'Lifelong learning' },
  { id: 'career', label: 'Career' },
  { id: 'health', label: 'Health' },
]

function toggle<T>(list: T[], id: T) {
  return list.includes(id) ? list.filter((x) => x !== id) : [...list, id]
}

export function ParentGrowthFeed() {
  const { state, upsertParentFeedProfile, rateParentFeed } = useStore()
  const userId = state.currentUserId ?? ''
  const saved = (state.parentFeedProfiles ?? []).find((p) => p.userId === userId)
  const [ageYears, setAgeYears] = useState(saved?.ageYears ?? DEFAULT_PARENT_PROFILE.ageYears)
  const [interests, setInterests] = useState<ParentCategory[]>(
    saved?.interests ?? [...DEFAULT_PARENT_PROFILE.interests],
  )
  const [goals, setGoals] = useState<ParentGoal[]>(saved?.goals ?? [...DEFAULT_PARENT_PROFILE.goals])
  const [timeMode, setTimeMode] = useState<ParentTimeMode>(saved?.timeMode ?? 'mixed')
  const [languages, setLanguages] = useState<ParentLang[]>(saved?.languages ?? ['en', 'hi'])

  const ratings = Object.fromEntries(
    (state.parentFeedRatings ?? [])
      .filter((r) => r.userId === userId)
      .map((r) => [r.itemId, r.rating] as const),
  )

  const plan = useMemo(
    () =>
      planParentFeed({
        ageYears,
        interests,
        goals,
        timeMode,
        languages,
        ratings,
      }),
    [ageYears, interests, goals, timeMode, languages, ratings],
  )

  function persist() {
    upsertParentFeedProfile({ userId, ageYears, interests, goals, timeMode, languages })
  }

  return (
    <div data-testid="parent-feed">
      <PageHead
        title="Parent growth feed"
        subtitle="Ages 33–50 in India: movies, learning, parenting science, and finance — official links, ranked by impact."
      />
      <TopPicksShelf />
      <MovieShelf />

      <section className="card mb-6 p-5">
        <h2 className="font-display text-xl">Your profile</h2>
        <p className="mt-1 text-sm text-muted">Content-based rank + your thumbs. Not a Netflix algorithm clone.</p>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <Field label="Your age">
            <input
              className={inputClass}
              type="number"
              min={18}
              max={80}
              value={ageYears}
              onChange={(e) => setAgeYears(Number(e.target.value) || 38)}
            />
          </Field>
          <Field label="Time today">
            <select className={inputClass} value={timeMode} onChange={(e) => setTimeMode(e.target.value as ParentTimeMode)}>
              <option value="short">Short clips (≤25 min)</option>
              <option value="mixed">Mixed</option>
              <option value="long">Long / weekly deep dive</option>
            </select>
          </Field>
        </div>
        <p className="mt-3 text-xs font-semibold tracking-wide text-muted uppercase">Interests</p>
        <div className="mt-2 flex flex-wrap gap-2">
          {INTERESTS.map((i) => (
            <Button key={i.id} variant={interests.includes(i.id) ? 'primary' : 'ghost'} onClick={() => setInterests(toggle(interests, i.id))}>
              {i.label}
            </Button>
          ))}
        </div>
        <p className="mt-3 text-xs font-semibold tracking-wide text-muted uppercase">Goals</p>
        <div className="mt-2 flex flex-wrap gap-2">
          {GOALS.map((g) => (
            <Button key={g.id} variant={goals.includes(g.id) ? 'primary' : 'ghost'} onClick={() => setGoals(toggle(goals, g.id))}>
              {g.label}
            </Button>
          ))}
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          {(['en', 'hi'] as const).map((l) => (
            <Button key={l} variant={languages.includes(l) ? 'primary' : 'ghost'} onClick={() => setLanguages(toggle(languages, l))}>
              {l === 'hi' ? 'हिन्दी' : 'English'}
            </Button>
          ))}
          <Button className="ml-auto" onClick={persist}>
            Save profile
          </Button>
        </div>
      </section>

      <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
        <section className="card p-5" data-testid="parent-daily">
          <h2 className="font-display text-xl">Today’s playlist</h2>
          <p className="mt-1 text-sm text-muted">Balanced across categories. One clip, one note. Autoplay off.</p>
          <ul className="mt-4 space-y-3">
            {plan.daily.map((item) => (
              <li key={item.id} className="rounded-xl border border-line p-3">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <p className="text-xs font-semibold tracking-wide text-muted uppercase">
                      {item.n}. {item.category} · {item.durationMin} min · {item.platform}
                    </p>
                    <p className="font-semibold">{item.title}</p>
                    <p className="mt-1 text-sm">{item.why}</p>
                    {item.indiaNote ? <p className="mt-1 text-xs text-muted">{item.indiaNote}</p> : null}
                    <p className="mt-1 text-xs text-pine">Impact {item.impactScore} · {item.reasons.slice(0, 2).join(' · ')}</p>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="ghost" aria-label={`Like ${item.title}`} onClick={() => rateParentFeed(userId, item.id, 1)}>
                      <ThumbsUp size={16} />
                    </Button>
                    <Button variant="ghost" aria-label={`Skip ${item.title}`} onClick={() => rateParentFeed(userId, item.id, -1)}>
                      <ThumbsDown size={16} />
                    </Button>
                    <a
                      className="inline-flex items-center gap-1 rounded-xl bg-pine px-3 py-2 text-sm font-semibold text-white"
                      href={item.url}
                      target="_blank"
                      rel="noreferrer"
                    >
                      Open <ExternalLink size={14} />
                    </a>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </section>
        <aside className="space-y-4">
          <section className="card p-5" data-testid="parent-weekly">
            <h2 className="font-display text-xl">Weekly deep dive</h2>
            <Badge tone="pine">{plan.weekly.format}</Badge>
            <p className="mt-2 font-semibold">{plan.weekly.title}</p>
            <p className="mt-1 text-sm">{plan.weekly.why}</p>
            <p className="mt-1 text-xs text-muted">{plan.weekly.evidence}</p>
            <a className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-pine" href={plan.weekly.url} target="_blank" rel="noreferrer">
              Open on {plan.weekly.platform} <ExternalLink size={14} />
            </a>
          </section>
          <section className="card p-5">
            <h2 className="font-display text-xl">Full 15</h2>
            <ol className="mt-3 space-y-2 text-sm">
              {plan.ranked.map((item) => (
                <li key={item.id} className="flex justify-between gap-2 border-b border-line py-1">
                  <span>
                    {item.n}. {item.title}
                  </span>
                  <span className="text-muted">{item.score.toFixed(0)}</span>
                </li>
              ))}
            </ol>
          </section>
        </aside>
      </div>
      <ul className="mt-4 space-y-1 text-xs text-muted">
        {plan.safeguards.map((s) => (
          <li key={s}>{s}</li>
        ))}
      </ul>
    </div>
  )
}

export function ParentFeedPanel() {
  const plan = planParentFeed({
    ...DEFAULT_PARENT_PROFILE,
    interests: [...DEFAULT_PARENT_PROFILE.interests],
    goals: [...DEFAULT_PARENT_PROFILE.goals],
    languages: [...DEFAULT_PARENT_PROFILE.languages],
  })
  return (
    <section className="card p-5" data-testid="parent-feed-panel" aria-labelledby="parent-feed-heading">
      <div className="mb-3 flex items-center justify-between gap-2">
        <h2 id="parent-feed-heading" className="font-display text-xl">
          Parent growth feed
        </h2>
        <Link to="/parent-feed" className="text-sm font-semibold text-pine">
          Open feed →
        </Link>
      </div>
      <p className="mb-2 text-xs text-muted">{plan.audience}. Daily mix + weekly deep dive.</p>
      <ul className="space-y-2 text-sm">
        {plan.daily.slice(0, 3).map((item) => (
          <li key={item.id} className="flex justify-between gap-2">
            <span>
              {item.n}. {item.title}
            </span>
            <Badge tone="sand">{item.category}</Badge>
          </li>
        ))}
      </ul>
    </section>
  )
}
