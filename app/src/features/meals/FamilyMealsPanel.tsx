import { ArrowUpRight, UtensilsCrossed } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Badge } from '../../components/ui'
import { childToPlanInput, planFamilyMeals } from './plan'
import type { Child, GrowthRecord } from '../../types'

export function FamilyMealsPanel({
  kids,
  growthRecords,
}: {
  kids: Child[]
  growthRecords: GrowthRecord[]
}) {
  const sample = kids.slice(0, 3)
  if (!sample.length) return null
  const plan = planFamilyMeals({
    children: sample.map((c) => childToPlanInput(c, growthRecords.find((g) => g.childId === c.id))),
    filters: [],
  })
  const top = plan.children[0]

  return (
    <section className="card p-5" data-testid="family-meals" aria-labelledby="family-meals-heading">
      <div className="mb-3 flex items-center justify-between gap-2">
        <h2 id="family-meals-heading" className="font-display text-xl">
          Family meal planner
        </h2>
        <Link to="/meals" className="inline-flex items-center gap-1 text-sm font-semibold text-pine">
          Open planner <ArrowUpRight size={14} />
        </Link>
      </div>
      <p className="mb-3 text-xs text-muted">Age + BMI percentile → pediatric nutrient targets → shared Indian plate.</p>
      {top ? (
        <div className="rounded-xl border border-line p-3">
          <div className="flex items-center justify-between gap-2">
            <p className="font-semibold">{top.childName}</p>
            <Badge tone="pine">Growth score {top.scores.overall}</Badge>
          </div>
          <p className="mt-1 text-xs text-muted">{top.growthCue}</p>
          <ul className="mt-2 space-y-1 text-sm">
            {plan.shared.slice(0, 3).map((row) => (
              <li key={row.slot} className="flex justify-between gap-2">
                <span className="text-muted">{row.slot}</span>
                <span className="text-right">{row.recipeName}</span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
      <p className="mt-3 inline-flex items-center gap-1 text-xs text-pine">
        <UtensilsCrossed size={12} aria-hidden /> {sample.map((c) => c.firstName).join(', ')}
      </p>
    </section>
  )
}
