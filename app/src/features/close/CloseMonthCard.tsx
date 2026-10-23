import { Link } from 'react-router-dom'
import { Badge } from '../../components/ui'
import { today } from '../../data/seed'
import { closeProgress } from './progress'
import { periodKey, periodLabel } from './tasks'
import { useStore } from '../../store'

export function CloseMonthCard({ to = '/billing?focus=close' }: { to?: string }) {
  const { state } = useStore()
  const period = periodKey(today())
  const progress = closeProgress(state, period, state.currentSiteId)
  const tone = progress.locked ? 'pine' : progress.atRisk || progress.blocked ? 'gold' : 'sky'

  return (
    <aside className="card p-5" data-testid="close-month-card">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold tracking-wide text-muted uppercase">Director close</p>
          <h2 className="font-display text-xl">{periodLabel(period)}</h2>
        </div>
        <Badge tone={tone}>{progress.locked ? 'Locked' : `${progress.done}/${progress.total}`}</Badge>
      </div>
      <p className="mt-2 text-sm text-muted">
        {progress.locked
          ? 'This month is locked. Reopen from Billing if a fee still needs an edit.'
          : `${progress.atRisk} at risk · ${progress.blocked} blocked. Attendance, GST invoices, then lock.`}
      </p>
      <Link to={to} className="mt-3 inline-block text-sm font-semibold text-pine">
        Open close checklist
      </Link>
    </aside>
  )
}
