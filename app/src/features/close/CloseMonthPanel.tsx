import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { Badge, Button, Stat, inputClass } from '../../components/ui'
import { today } from '../../data/seed'
import { money } from '../../lib'
import { useStore } from '../../store'
import type { CloseTaskId, CloseTaskStatus } from '../../types'
import { closeProgress } from './progress'
import { CLOSE_DAYS, CLOSE_TASKS, nearbyPeriods, periodKey, periodLabel } from './tasks'

const TONE: Record<CloseTaskStatus, 'sand' | 'pine' | 'sky' | 'rose' | 'gold'> = {
  not_started: 'sand',
  in_progress: 'sky',
  complete: 'pine',
  blocked: 'rose',
  at_risk: 'gold',
}

const LABEL: Record<CloseTaskStatus, string> = {
  not_started: 'Not started',
  in_progress: 'In progress',
  complete: 'Done',
  blocked: 'Blocked',
  at_risk: 'At risk',
}

export function CloseMonthPanel() {
  const { state, setCloseTask, lockClosePeriod } = useStore()
  const [params] = useSearchParams()
  const [period, setPeriod] = useState(() => periodKey(today()))
  const [notes, setNotes] = useState<Partial<Record<CloseTaskId, string>>>({})
  const periods = nearbyPeriods(periodKey(today()))
  const progress = closeProgress(state, period, state.currentSiteId)
  const rupee = (n: number) => money(n, state.countryCode)

  useEffect(() => {
    if (params.get('focus') !== 'close') return
    document.getElementById('close-month')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }, [params])

  const mark = (id: CloseTaskId, status: CloseTaskStatus) => {
    if (id === 'period-lock') {
      lockClosePeriod(period, status === 'complete')
      return
    }
    const existing = progress.tasks.find((t) => t.id === id)?.note
    setCloseTask(period, id, status, notes[id] ?? existing)
  }

  return (
    <section id="close-month" className="card mb-6 p-5" data-testid="close-month">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs font-semibold tracking-wide text-muted uppercase">Director close</p>
          <h2 className="font-display text-xl">Month-end close</h2>
          <p className="mt-1 max-w-2xl text-sm text-muted">
            Centre calendar for {periodLabel(period)}: lock attendance, issue GST invoices, chase overdue, then lock
            the month. Prepared for the director — not tax or accounting advice.
          </p>
        </div>
        <label className="text-sm">
          <span className="mb-1 block text-xs font-semibold tracking-wide text-muted uppercase">Period</span>
          <select
            className={inputClass}
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
            data-testid="close-period"
          >
            {periods.map((p) => (
              <option key={p} value={p}>
                {periodLabel(p)}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-4">
        <Stat label="Close progress" value={`${progress.done}/${progress.total}`} hint={progress.locked ? 'Month locked' : 'Tasks done'} />
        <Stat label="Outstanding" value={rupee(progress.signals.outstanding)} />
        <Stat label="Overdue invoices" value={progress.signals.overdueInvoices} />
        <Stat label="Low supplies" value={progress.signals.lowStock} />
      </div>

      {progress.locked ? (
        <p className="mt-4 rounded-xl bg-pine-soft px-3 py-2 text-sm text-pine" data-testid="close-locked">
          {periodLabel(period)} is locked
          {progress.lockedAt ? ` · ${new Date(progress.lockedAt).toLocaleDateString()}` : ''}. Reopen only if a fee
          still needs an edit.
        </p>
      ) : null}

      <div className="mt-5 space-y-5">
        {CLOSE_DAYS.map((group) => (
          <fieldset key={group.day}>
            <legend className="text-xs font-semibold tracking-wide text-muted uppercase">{group.label}</legend>
            <div className="mt-2 space-y-2">
              {CLOSE_TASKS.filter((t) => t.day === group.day).map((def) => {
                const row = progress.tasks.find((t) => t.id === def.id)!
                const freeze = progress.locked && def.id !== 'period-lock'
                return (
                  <article
                    key={def.id}
                    className="rounded-2xl border border-line px-4 py-3"
                    data-testid={`close-task-${def.id}`}
                    data-status={row.status}
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold">
                          {def.title}{' '}
                          <Link to={def.href} className="text-xs font-semibold text-pine">
                            Open
                          </Link>
                        </p>
                        <p className="text-sm text-muted">{def.detail}</p>
                        <p className="mt-1 text-xs text-muted">{row.hint}</p>
                        {row.note ? <p className="mt-1 text-xs text-rose">{row.note}</p> : null}
                      </div>
                      <Badge tone={TONE[row.status]}>{LABEL[row.status]}</Badge>
                    </div>
                    {def.id !== 'period-lock' ? (
                      <div className="mt-3 flex flex-wrap items-end gap-2">
                        <input
                          className={`${inputClass} max-w-sm`}
                          placeholder="Blocker or note — no child names"
                          value={notes[def.id] ?? row.note ?? ''}
                          disabled={freeze}
                          onChange={(e) => setNotes((n) => ({ ...n, [def.id]: e.target.value }))}
                          aria-label={`${def.title} note`}
                        />
                        <Button
                          disabled={freeze}
                          onClick={() => mark(def.id, 'complete')}
                          data-testid={`close-task-${def.id}-done`}
                        >
                          Done
                        </Button>
                        <Button variant="ghost" disabled={freeze} onClick={() => mark(def.id, 'blocked')}>
                          Blocked
                        </Button>
                        {row.status !== 'not_started' ? (
                          <Button variant="ghost" disabled={freeze} onClick={() => mark(def.id, 'not_started')}>
                            Reset
                          </Button>
                        ) : null}
                      </div>
                    ) : (
                      <div className="mt-3 flex flex-wrap gap-2">
                        <Button
                          disabled={!progress.canLock && !progress.locked}
                          onClick={() => mark('period-lock', progress.locked ? 'not_started' : 'complete')}
                          data-testid="close-lock"
                        >
                          {progress.locked ? 'Reopen month' : 'Lock month'}
                        </Button>
                        {!progress.canLock && !progress.locked ? (
                          <span className="self-center text-xs text-muted">Finish the other nine tasks first.</span>
                        ) : null}
                      </div>
                    )}
                  </article>
                )
              })}
            </div>
          </fieldset>
        ))}
      </div>
    </section>
  )
}
