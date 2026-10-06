import { Check, Sparkles } from 'lucide-react'
import { Link } from 'react-router-dom'
import { BrandRights } from '../components/BrandRights'
import { homePath } from '../lib/tv'
import { FeedbackCard } from '../features/revenue/FeedbackCard'
import { LeadForm } from '../features/revenue/LeadForm'
import { checkoutUrlFor, formatInr, PLANS, type Plan } from '../features/revenue/plans'
import { useStore } from '../store'

function PlanAction({ plan, signedIn }: { plan: Plan; signedIn: boolean }) {
  const buttonClass = 'pricing-cta mt-4 inline-flex w-full items-center justify-center rounded-xl px-4 py-2 text-sm font-semibold'
  if (plan.action === 'start') {
    return (
      <Link className={`${buttonClass} border border-line`} to={signedIn ? homePath() : '/get-app'} data-testid={`plan-${plan.id}-cta`}>
        {signedIn ? 'Open Willow' : 'Install free'}
      </Link>
    )
  }
  if (plan.action === 'contact') {
    return (
      <button
        type="button"
        className={`${buttonClass} border border-line`}
        data-testid={`plan-${plan.id}-cta`}
        onClick={() => document.getElementById('lead-form')?.scrollIntoView({ behavior: 'smooth' })}
      >
        Book a demo
      </button>
    )
  }
  const href = checkoutUrlFor(plan.id)
  const yearly = plan.yearlyPriceInr ? checkoutUrlFor(plan.id, undefined, undefined, 'year') : ''
  if (!href && !yearly) {
    return (
      <p className={`${buttonClass} border border-dashed border-line text-muted`} data-testid={`plan-${plan.id}-cta`}>
        Opening soon
      </p>
    )
  }
  return (
    <>
      {href ? (
        <a className={`${buttonClass} bg-pine text-white`} href={href} target="_blank" rel="noreferrer" data-testid={`plan-${plan.id}-cta`}>
          {plan.id === 'plus' ? 'Get Willow Plus' : 'Buy packs'}
        </a>
      ) : (
        <p className={`${buttonClass} border border-dashed border-line text-muted`} data-testid={`plan-${plan.id}-cta`}>
          Opening soon
        </p>
      )}
      {yearly ? (
        <a className={`${buttonClass} border border-line`} href={yearly} target="_blank" rel="noreferrer" data-testid={`plan-${plan.id}-yearly`}>
          {formatInr(plan.yearlyPriceInr ?? 0)} / year
        </a>
      ) : null}
    </>
  )
}

export function PricingPage() {
  const { state } = useStore()
  const signedIn = Boolean(state.currentUserId)

  return (
    <div className="look-shell min-h-screen" data-testid="pricing">
      <header className="flex items-center justify-between border-b border-line px-6 py-4">
        <Link to="/get-app" className="flex items-center gap-2 text-pine">
          <Sparkles size={20} />
          <span className="font-display text-xl font-semibold">Willow™</span>
        </Link>
        <Link className="text-sm font-semibold text-pine" to={signedIn ? homePath() : '/login'}>
          {signedIn ? 'Open Willow →' : 'Sign in →'}
        </Link>
      </header>
      <main className="mx-auto max-w-5xl px-6 py-10">
        <p className="text-xs font-semibold tracking-wide text-muted uppercase">Pricing</p>
        <h1 className="font-display mt-2 text-4xl font-semibold">Free for families. Fair for daycares.</h1>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted">
          Willow never sells data and never shows ads to children. Families can use it free forever; Plus, learning
          packs and the daycare plan keep it running. Payments happen on the official Razorpay checkout.
        </p>
        <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {PLANS.map((plan) => (
            <article key={plan.id} className={`card pricing-plan flex flex-col p-5 ${plan.id === 'plus' ? 'pricing-plan-featured ring-2 ring-pine/30' : ''}`} data-testid={`plan-${plan.id}`}>
              <h2 className="font-display text-xl font-semibold">{plan.name}</h2>
              <p className="mt-2">
                <span className="text-3xl font-semibold tabular-nums">{formatInr(plan.priceInr)}</span>
                {plan.priceInr ? <span className="text-sm text-muted"> / {plan.period}</span> : null}
              </p>
              <p className="mt-1 text-sm text-muted">{plan.blurb}</p>
              {plan.yearlyPriceInr ? (
                <p className="mt-1 text-sm text-muted" data-testid="plan-plus-yearly-price">
                  or {formatInr(plan.yearlyPriceInr)} / year, two months free
                </p>
              ) : null}
              <ul className="mt-4 flex-1 space-y-2 text-sm">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex gap-2">
                    <Check size={16} className="mt-0.5 shrink-0 text-pine" />
                    {feature}
                  </li>
                ))}
              </ul>
              <PlanAction plan={plan} signedIn={signedIn} />
            </article>
          ))}
        </div>
        <div id="lead-form" className="mt-10">
          <LeadForm />
        </div>
        <FeedbackCard />
        <p className="mt-6 text-xs text-muted">
          Free guides: <a className="text-pine underline" href="guides/">parenting checklists and printable planners</a>.
        </p>
        <BrandRights className="mt-3" />
      </main>
    </div>
  )
}
