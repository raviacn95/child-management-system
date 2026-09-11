import { useMemo, useState } from 'react'
import { Camera, ListChecks, ShoppingBasket, Sparkles, Users } from 'lucide-react'
import { Avatar, Badge, Button, Field, inputClass } from '../../components/ui'
import { ageYears, childName, todayIso } from '../../lib'
import { useStore } from '../../store'
import type { Child, FamilyMealLog } from '../../types'
import { listAgeBands } from './catalog'
import { childToPlanInput, planFamilyMeals } from './plan'
import { recognizeFoods } from './recognize'
import type { DietTag, MealSlot } from './schema'

const FILTERS: { id: DietTag; label: string }[] = [
  { id: 'vegetarian', label: 'Vegetarian' },
  { id: 'nut-free', label: 'Nut-free' },
  { id: 'dairy-free', label: 'Dairy-free' },
  { id: 'lactose-free', label: 'Lactose-free' },
  { id: 'jain', label: 'Jain' },
]

function ScoreBar({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <div className="mb-1 flex justify-between text-xs">
        <span>{label}</span>
        <span className="font-semibold">{value}</span>
      </div>
      <div className="h-2 rounded-full bg-sand">
        <div className="h-2 rounded-full bg-pine" style={{ width: `${Math.min(100, value)}%` }} />
      </div>
    </div>
  )
}

function latestGrowth(records: { childId: string; heightCm: number; weightKg: number }[], childId: string) {
  return records.find((g) => g.childId === childId)
}

export function MealPlanner({ kids }: { kids: Child[] }) {
  const { state, logSharedMeal } = useStore()
  const [selected, setSelected] = useState<string[]>(() => kids.slice(0, 2).map((c) => c.id))
  const [filters, setFilters] = useState<DietTag[]>([])
  const [tab, setTab] = useState<'plan' | 'scores' | 'log' | 'grocery'>('plan')
  const [chat, setChat] = useState('')
  const [photoName, setPhotoName] = useState('')

  const chosen = kids.filter((c) => selected.includes(c.id))
  const plan = useMemo(() => {
    if (!chosen.length) return null
    return planFamilyMeals({
      children: chosen.map((c) => childToPlanInput(c, latestGrowth(state.growthRecords ?? [], c.id))),
      filters,
    })
  }, [chosen, filters, state.growthRecords])

  const recognized = useMemo(() => recognizeFoods(photoName || chat), [photoName, chat])
  const logs = (state.familyMealLogs ?? []).filter((l) => l.childIds.some((id) => selected.includes(id)))

  function toggleChild(id: string) {
    setSelected((cur) => (cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id]))
  }

  function toggleFilter(id: DietTag) {
    setFilters((cur) => (cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id]))
  }

  function logRecipe(recipeId: string, recipeName: string, slot: MealSlot, source: FamilyMealLog['source'], note?: string) {
    if (!chosen.length) return
    logSharedMeal({
      date: todayIso(),
      recipeId,
      recipeName,
      slot,
      childIds: chosen.map((c) => c.id),
      source,
      note,
    })
  }

  if (!kids.length) return <p className="text-sm text-muted">No children on this account.</p>

  return (
    <div data-testid="meal-planner">
      <div className="mb-4 flex flex-wrap gap-2">
        {kids.map((c) => {
          const on = selected.includes(c.id)
          return (
            <button
              key={c.id}
              type="button"
              className={`card flex items-center gap-2 px-3 py-2 ${on ? 'border-pine ring-2 ring-pine/20' : ''}`}
              onClick={() => toggleChild(c.id)}
              aria-pressed={on}
            >
              <Avatar name={childName(c)} hue={c.avatarHue} size={32} />
              <span className="text-sm font-semibold">
                {c.firstName} · {ageYears(c.dob)}
              </span>
            </button>
          )
        })}
      </div>

      <div className="mb-4 flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <Button key={f.id} variant={filters.includes(f.id) ? 'primary' : 'ghost'} onClick={() => toggleFilter(f.id)}>
            {f.label}
          </Button>
        ))}
      </div>

      <div className="mb-4 flex flex-wrap gap-2">
        {(
          [
            ['plan', 'Family plate', Users],
            ['scores', 'Growth scores', Sparkles],
            ['log', 'Log once', Camera],
            ['grocery', 'Grocery list', ShoppingBasket],
          ] as const
        ).map(([id, label, Icon]) => (
          <Button key={id} variant={tab === id ? 'primary' : 'ghost'} onClick={() => setTab(id)}>
            <Icon size={14} aria-hidden /> {label}
          </Button>
        ))}
      </div>

      {!plan ? (
        <p className="text-sm text-muted">Select at least one child.</p>
      ) : null}

      {tab === 'plan' && plan ? (
        <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
          <section className="card p-5" data-testid="shared-meals">
            <h2 className="font-display text-xl">Cook once, portion by age</h2>
            <p className="mt-1 text-sm text-muted">
              Shared family recipes with per-child portions. Autoplay-style calorie ceilings stay off — this is growth fuel.
            </p>
            <ul className="mt-4 space-y-3">
              {plan.shared.map((row) => (
                <li key={row.slot} className="rounded-xl border border-line p-3">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <p className="text-xs font-semibold tracking-wide text-muted uppercase">{row.slot}</p>
                      <p className="font-semibold">{row.recipeName}</p>
                      {row.tip ? <p className="mt-1 text-xs text-muted">{row.tip}</p> : null}
                    </div>
                    <Button
                      variant="soft"
                      onClick={() => logRecipe(row.recipeId, row.recipeName, row.slot, 'shared')}
                    >
                      Log for family
                    </Button>
                  </div>
                  <p className="mt-2 text-xs text-muted">
                    {row.portions.map((p) => `${p.childName?.split(' ')[0] ?? 'Child'} × ${p.portion}`).join(' · ')}
                  </p>
                </li>
              ))}
            </ul>
          </section>
          <aside className="space-y-3">
            {plan.children.map((c) => (
              <article key={c.childId} className="card p-4" data-testid={`child-plan-${c.childId}`}>
                <div className="flex items-center justify-between gap-2">
                  <h3 className="font-semibold">{c.childName}</h3>
                  <Badge tone={c.bmiBand === 'under' ? 'gold' : c.bmiBand === 'high' || c.bmiBand === 'watch' ? 'rose' : 'pine'}>
                    {c.ageBand} · {c.bmiBand}
                  </Badge>
                </div>
                <p className="mt-1 text-xs text-muted">{c.growthCue}</p>
                {c.percentile != null ? (
                  <p className="mt-1 text-xs">BMI {c.bmi?.toFixed(1)} · ~{Math.round(c.percentile)}th percentile</p>
                ) : (
                  <p className="mt-1 text-xs text-muted">Log height and weight on Grow at home for a percentile.</p>
                )}
                {c.neverServe.length ? <p className="mt-2 text-sm text-rose">Never serve: {c.neverServe.join(', ')}</p> : null}
                <ul className="mt-2 space-y-1 text-sm">
                  {c.meals.map((m) => (
                    <li key={`${m.slot}-${m.recipeId}`} className="flex justify-between gap-2 border-b border-line py-1">
                      <span className="text-muted">{m.slot}</span>
                      <span className="text-right">
                        {m.recipeName}
                        {!m.safe && m.swap ? <span className="block text-xs text-rose">{m.swap}</span> : null}
                      </span>
                    </li>
                  ))}
                </ul>
              </article>
            ))}
          </aside>
        </div>
      ) : null}

      {tab === 'scores' && plan ? (
        <section className="grid gap-4 md:grid-cols-2">
          {plan.children.map((c) => (
            <article key={c.childId} className="card p-5">
              <div className="flex items-center justify-between">
                <h3 className="font-display text-xl">{c.childName}</h3>
                <Badge tone="pine">Growth score {c.scores.overall}</Badge>
              </div>
              <p className="mt-1 text-xs text-muted">Nutrient sufficiency vs pediatric targets. No calorie ceilings.</p>
              <div className="mt-4 space-y-3">
                <ScoreBar label="Protein" value={c.scores.protein} />
                <ScoreBar label="Calcium" value={c.scores.calcium} />
                <ScoreBar label="Iron" value={c.scores.iron} />
                <ScoreBar label="Vitamin D" value={c.scores.vitaminD} />
                <ScoreBar label="Fiber" value={c.scores.fiber} />
              </div>
            </article>
          ))}
        </section>
      ) : null}

      {tab === 'log' && plan ? (
        <section className="card p-5">
          <h2 className="font-display text-xl">Photo & chat logging</h2>
          <p className="mt-1 text-sm text-muted">
            Demo recognizer maps a plate photo name or a sentence to the Indian staple catalog. Confirm before it writes the family log.
          </p>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <Field label="Plate photo (filename)">
              <input
                className={inputClass}
                placeholder="idli-sambar.jpg"
                value={photoName}
                onChange={(e) => setPhotoName(e.target.value)}
              />
            </Field>
            <Field label="Or type what they ate">
              <input
                className={inputClass}
                placeholder="Leo and Mira ate dal rice"
                value={chat}
                onChange={(e) => setChat(e.target.value)}
              />
            </Field>
          </div>
          <div className="mt-4 rounded-xl border border-line p-3" data-testid="food-recognize">
            <p className="text-sm font-semibold">{recognized.recipeName ?? 'No match yet'}</p>
            <p className="text-xs text-muted">{recognized.note}</p>
            {recognized.confidence ? (
              <p className="mt-1 text-xs">Confidence {Math.round(recognized.confidence * 100)}%</p>
            ) : null}
            {recognized.recipeId && recognized.slot ? (
              <Button
                className="mt-3"
                onClick={() =>
                  logRecipe(recognized.recipeId!, recognized.recipeName ?? recognized.recipeId!, recognized.slot!, photoName ? 'photo' : 'chat', photoName || chat)
                }
              >
                Log matched plate
              </Button>
            ) : null}
          </div>
          {logs.length ? (
            <ul className="mt-4 space-y-2 text-sm">
              {logs.slice(0, 6).map((l) => (
                <li key={l.id} className="flex justify-between gap-2 border-b border-line py-2">
                  <span>
                    {l.recipeName} <span className="text-muted">· {l.slot} · {l.source}</span>
                  </span>
                  <span className="text-muted">{l.date}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-4 text-xs text-muted">No shared logs yet today.</p>
          )}
        </section>
      ) : null}

      {tab === 'grocery' && plan ? (
        <section className="card p-5" data-testid="grocery-list">
          <div className="mb-3 flex items-center gap-2">
            <ListChecks size={18} aria-hidden />
            <h2 className="font-display text-xl">Weekly-style grocery from today’s plate</h2>
          </div>
          <ul className="space-y-2">
            {plan.grocery.map((g) => (
              <li key={g.grocery} className="flex justify-between border-b border-line py-2 text-sm">
                <span>{g.grocery}</span>
                <span className="text-muted">
                  {g.qty} {g.unit}
                </span>
              </li>
            ))}
          </ul>
          <p className="mt-3 text-xs text-muted">Indian staples (dal, roti, idli, poha). Add Willow Mart COD for packaged extras.</p>
        </section>
      ) : null}

      {plan ? (
        <ul className="mt-4 space-y-1 text-xs text-muted">
          {plan.safeguards.map((s) => (
            <li key={s}>{s}</li>
          ))}
          <li>
            Age bands in catalog: {listAgeBands().map((b) => b.label).join(' · ')}.
          </li>
        </ul>
      ) : null}
    </div>
  )
}

