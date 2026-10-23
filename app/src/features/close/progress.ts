import type { AppState, ClosePeriod, CloseTaskId, CloseTaskStatus } from '../../types'
import { CLOSE_TASKS } from './tasks'
import { closeSignals, signalHint, suggestedStatus, type CloseSignals } from './signals'

const OPEN: CloseTaskStatus[] = ['not_started', 'in_progress', 'at_risk', 'blocked']

export interface CloseTaskView {
  id: CloseTaskId
  status: CloseTaskStatus
  hint: string
  note?: string
  locked: boolean
}

export interface CloseProgress {
  period: string
  siteId: string
  locked: boolean
  lockedAt?: string
  done: number
  total: number
  atRisk: number
  blocked: number
  canLock: boolean
  signals: CloseSignals
  tasks: CloseTaskView[]
}

export function findClosePeriod(state: AppState, period: string, siteId: string): ClosePeriod | undefined {
  return (state.closePeriods ?? []).find((p) => p.period === period && p.siteId === siteId)
}

export function closeProgress(state: AppState, period: string, siteId: string): CloseProgress {
  const saved = findClosePeriod(state, period, siteId)
  const signals = closeSignals(state, period, siteId)
  const locked = Boolean(saved?.lockedAt)
  const tasks: CloseTaskView[] = CLOSE_TASKS.map((def) => {
    const row = saved?.tasks.find((t) => t.id === def.id)
    const status =
      def.id === 'period-lock' && locked
        ? 'complete'
        : (row?.status ?? suggestedStatus(def.id, signals) ?? 'not_started')
    return {
      id: def.id,
      status,
      hint: signalHint(def.id, signals),
      note: row?.note,
      locked,
    }
  })
  const work = tasks.filter((t) => t.id !== 'period-lock')
  const done = work.filter((t) => t.status === 'complete').length
  const canLock = !locked && work.every((t) => t.status === 'complete')
  return {
    period,
    siteId,
    locked,
    lockedAt: saved?.lockedAt,
    done,
    total: work.length,
    atRisk: tasks.filter((t) => t.status === 'at_risk').length,
    blocked: tasks.filter((t) => t.status === 'blocked').length,
    canLock,
    signals,
    tasks,
  }
}

export function isOpenStatus(status: CloseTaskStatus) {
  return OPEN.includes(status)
}
