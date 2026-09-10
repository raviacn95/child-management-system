import { Link } from 'react-router-dom'
import { useMemo, useState } from 'react'
import { clothingNeeds, recommendedItems, sizeForChild } from '../data/catalog'
import { gamesFor, homeMeals, SKILLS, skillActivity, tricksFor } from '../data/grow'
import { Avatar, Badge, Button, PageHead, inputClass } from '../components/ui'
import { ageYears, bmiProfile, childName, clothingSize, money } from '../lib'
import { packOf } from '../data/country'
import { useStore } from '../store'
import type { SkillId } from '../types'

const TABS = ['meals', 'dress', 'games', 'tricks', 'skills'] as const

export function Grow() {
  const { state, logGrowth, practiceSkill, logGame, completeTrick, addToCart } = useStore()
  const user = state.users.find((u) => u.id === state.currentUserId)!
  const kids = state.children.filter((c) => {
    if (c.status !== 'enrolled') return false
    if (user.role === 'parent') return user.childIds.includes(c.id)
    return c.siteId === state.currentSiteId
  })
  const [childId, setChildId] = useState(kids[0]?.id ?? '')
  const [tab, setTab] = useState<(typeof TABS)[number]>('meals')
  const [cm, setCm] = useState('')
  const [kg, setKg] = useState('')
  const child = kids.find((c) => c.id === childId) ?? kids[0]
  const growth = (state.growthRecords ?? []).filter((g) => g.childId === child?.id)
  const latest = growth[0]
  const profile = latest && child ? bmiProfile(child.dob, latest.weightKg, latest.heightCm) : null
  const meals = child && profile ? homeMeals(child, profile.band) : child ? homeMeals(child, 'healthy') : null
  const games = child ? gamesFor(child.dob) : []
  const tricks = child ? tricksFor(child) : []
  const skills = (state.skillProgress ?? []).filter((s) => s.childId === child?.id)
  const plays = (state.gamePlays ?? []).filter((g) => g.childId === child?.id)
  const doneTricks = new Set((state.tricksDone ?? []).filter((t) => t.childId === child?.id).map((t) => t.trickId))
  const catalog = state.shopCatalog ?? []
  const dress = child ? recommendedItems(catalog, child).slice(0, 4) : []
  const needs = child ? clothingNeeds(child) : []
  const avgLevel = skills.length ? skills.reduce((n, s) => n + s.level, 0) / skills.length : 1

  const holistics = useMemo(() => {
    if (!skills.length) return 'Start practicing to build the ten-skill map.'
    if (avgLevel >= 4) return 'High-performer track: keep stretching the weakest skill.'
    if (avgLevel >= 2.5) return 'Solid all-rounder. Add 10 minutes on the lowest bar.'
    return 'Foundation year — short daily reps beat long weekend cram.'
  }, [avgLevel, skills.length])

  if (!child) return <p>No children on this account.</p>

  return (
    <div>
      <PageHead
        title="Grow at home"
        subtitle="Parent tools by age: IAP-aware meals, Willow Mart COD kits, games, tricks, and ten skills."
      />
      <div className="mb-5 flex flex-wrap gap-2">
        {kids.map((c) => (
          <button
            key={c.id}
            className={`card flex items-center gap-2 px-3 py-2 ${c.id === child.id ? 'border-pine ring-2 ring-pine/20' : ''}`}
            onClick={() => setChildId(c.id)}
          >
            <Avatar name={childName(c)} hue={c.avatarHue} size={32} />
            <span className="text-sm font-semibold">
              {c.firstName} · {ageYears(c.dob)}
            </span>
          </button>
        ))}
      </div>

      <div className="mb-6 grid gap-3 md:grid-cols-4">
        <div className="card p-4">
          <p className="text-xs font-semibold tracking-wide text-muted uppercase">Size / age</p>
          <p className="font-display mt-1 text-2xl">{clothingSize(child.dob)}</p>
          <p className="text-xs text-muted">{ageYears(child.dob)}</p>
        </div>
        <div className="card p-4">
          <p className="text-xs font-semibold tracking-wide text-muted uppercase">BMI screen</p>
          <p className="font-display mt-1 text-2xl">{profile ? profile.bmi.toFixed(1) : '—'}</p>
          <p className="text-xs text-muted">{profile?.label ?? 'Log height and weight'}</p>
        </div>
        <div className="card p-4">
          <p className="text-xs font-semibold tracking-wide text-muted uppercase">Skill average</p>
          <p className="font-display mt-1 text-2xl">{avgLevel.toFixed(1)} / 5</p>
          <p className="text-xs text-muted">{holistics}</p>
        </div>
        <div className="card p-4">
          <p className="text-xs font-semibold tracking-wide text-muted uppercase">Latest measure</p>
          <p className="mt-1 text-sm">
            {latest ? `${latest.heightCm} cm · ${latest.weightKg} kg` : 'None yet'}
          </p>
          <form
            className="mt-2 flex gap-2"
            onSubmit={(e) => {
              e.preventDefault()
              const h = Number(cm)
              const w = Number(kg)
              if (h > 40 && w > 2) {
                logGrowth(child.id, h, w)
                setCm('')
                setKg('')
              }
            }}
          >
            <input className={inputClass} placeholder="cm" value={cm} onChange={(e) => setCm(e.target.value)} />
            <input className={inputClass} placeholder="kg" value={kg} onChange={(e) => setKg(e.target.value)} />
            <Button type="submit">Log</Button>
          </form>
        </div>
      </div>
      <p className="mb-4 text-xs text-muted">
        BMI bands here are a simple home screen, not a medical diagnosis. {packOf(state.countryCode).growthStandard}.
      </p>

      <div className="mb-4 flex flex-wrap gap-2">
        {TABS.map((t) => (
          <Button key={t} variant={tab === t ? 'primary' : 'ghost'} onClick={() => setTab(t)}>
            {t === 'meals' ? 'Meal plan' : t === 'dress' ? 'Dress orders' : t === 'games' ? 'Games' : t === 'tricks' ? 'Tricks & plans' : '10 skills'}
          </Button>
        ))}
      </div>

      {tab === 'meals' && meals ? (
        <section className="card p-5">
          <Badge tone={profile?.band === 'under' ? 'gold' : profile?.band === 'high' || profile?.band === 'watch' ? 'rose' : 'pine'}>
            {profile?.band ?? 'healthy'} plate
          </Badge>
          <p className="mt-2 text-sm">{meals.focus}</p>
          {child.allergies.length ? (
            <p className="mt-2 text-sm text-rose">Never serve: {child.allergies.map((a) => a.name).join(', ')}.</p>
          ) : null}
          <ul className="mt-4 space-y-2">
            {meals.days.map((d) => (
              <li key={d.meal} className="flex justify-between gap-4 border-b border-line py-2 text-sm">
                <span className="font-semibold">{d.meal}</span>
                <span className="text-right">{d.menu}</span>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {tab === 'dress' ? (
        <section className="card p-5">
          <p className="text-sm text-muted">
            Size {clothingSize(child.dob)}. Recommended to buy on COD when the PIN is serviceable.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {needs.map((n) => (
              <Badge key={n.id} tone="pine">
                {n.label}
              </Badge>
            ))}
          </div>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {dress.map(({ item }) => (
              <article key={item.id} className="rounded-xl border border-line p-3">
                <p className="font-semibold">{item.name}</p>
                <p className="text-xs text-muted">{item.why}</p>
                <p className="mt-1 text-sm">
                  {money(item.price, state.countryCode)} · {sizeForChild(item, child)}
                  {item.codOk ? ' · COD' : ''}
                </p>
                <Button className="mt-2" variant="soft" onClick={() => addToCart(item.id, child.id, sizeForChild(item, child))}>
                  Add — buy on COD
                </Button>
              </article>
            ))}
          </div>
          <Link to="/shop" className="mt-4 inline-block text-sm font-semibold text-pine">
            Open Willow Mart (COD recommended) →
          </Link>
        </section>
      ) : null}

      {tab === 'games' ? (
        <section className="space-y-3">
          {games.map((g) => (
            <article key={g.id} className="card flex flex-wrap items-start justify-between gap-3 p-4">
              <div>
                <p className="font-semibold">{g.name}</p>
                <p className="text-sm text-muted">{g.how}</p>
                <p className="mt-1 text-xs text-muted">
                  {g.minutes} min · trains {SKILLS.find((s) => s.id === g.skill)?.name}
                </p>
              </div>
              <Button onClick={() => logGame(child.id, g.id, g.minutes)}>Log play</Button>
            </article>
          ))}
          {plays.length ? (
            <p className="text-xs text-muted">
              Recent: {plays.slice(0, 4).map((p) => `${p.minutes}m`).join(' · ')} logged
            </p>
          ) : null}
        </section>
      ) : null}

      {tab === 'tricks' ? (
        <section className="space-y-3">
          {tricks.map((t) => (
            <article key={t.id} className="card p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-semibold">{t.title}</p>
                  <p className="mt-1 text-sm text-muted">{t.detail}</p>
                </div>
                <Button variant={doneTricks.has(t.id) ? 'soft' : 'primary'} onClick={() => completeTrick(child.id, t.id)}>
                  {doneTricks.has(t.id) ? 'Tried' : 'I tried this'}
                </Button>
              </div>
            </article>
          ))}
        </section>
      ) : null}

      {tab === 'skills' ? (
        <section className="grid gap-3 md:grid-cols-2">
          {SKILLS.map((skill) => {
            const prog = skills.find((s) => s.skillId === skill.id)
            const level = prog?.level ?? 1
            const xp = prog?.xp ?? 0
            return (
              <article key={skill.id} className="card p-4">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-semibold">{skill.name}</h3>
                  <Badge tone="pine">Lv {level}</Badge>
                </div>
                <p className="mt-1 text-xs text-muted">{skill.why}</p>
                <p className="mt-2 text-sm">{skillActivity(skill, child.dob)}</p>
                <div className="mt-3 h-2 rounded-full bg-sand">
                  <div className="h-2 rounded-full bg-pine" style={{ width: `${Math.min(100, (xp % 50) * 2)}%` }} />
                </div>
                <Button className="mt-3" variant="soft" onClick={() => practiceSkill(child.id, skill.id)}>
                  Practice 10 min
                </Button>
              </article>
            )
          })}
        </section>
      ) : null}
    </div>
  )
}
