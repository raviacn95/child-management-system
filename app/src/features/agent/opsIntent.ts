import type { AgentPage, AgentReply } from './schema'

/** Counts only. Never names, rooms, or invoice IDs. */
export type OpsSnapshot = {
  enrolled: number
  presentToday: number
  overdueInvoices: number
  invoiceCount: number
  closeDone: number
  closeTotal: number
  closeLocked: boolean
  ratioAlerts: number
  lowStock: number
}

const OVERDUE = /\b(overdue|unpaid invoices?|chase (fees|invoices)|collections?)\b/i
const CLOSE_STATUS = /\b(close (progress|status)|how (is|are) (the )?(month[- ]end )?close|close tasks?( left| done)?|month[- ]end (status|progress))\b/i
const PRESENT = /\b(how many (are )?(here|in|present|checked in)|headcount|today'?s attendance|checked in today)\b/i
const ENROLLED = /\bhow many (children |kids )?(enrolled|on roll)\b/i
const RATIO = /\b(ratio(s| alert)?|short staff|licensing ratio)\b/i
const STOCK = /\b(low stock|reorder|inventory (alert|low))\b/i

function go(page: AgentPage, say: string): AgentReply {
  return { say, action: { type: 'navigate', page } }
}

/** Tool-style centre stats on device. Null when the ask is not an ops question. */
export function opsIntent(raw: string, ops: OpsSnapshot): AgentReply | null {
  const text = raw.replace(/\s+/g, ' ').trim()
  if (text.length < 4) return null
  if (OVERDUE.test(text)) {
    return go('billing', `${ops.overdueInvoices} overdue of ${ops.invoiceCount} invoices this month. Opening Billing.`)
  }
  if (CLOSE_STATUS.test(text)) {
    if (ops.closeLocked) return go('billing', 'This month is locked. Opening Billing.')
    return go('billing', `Close is ${ops.closeDone} of ${ops.closeTotal} tasks. Opening Billing.`)
  }
  if (PRESENT.test(text)) {
    return go('attendance', `${ops.presentToday} of ${ops.enrolled} enrolled are checked in. Opening Attendance.`)
  }
  if (ENROLLED.test(text)) {
    return go('children', `${ops.enrolled} children enrolled. Opening Children.`)
  }
  if (RATIO.test(text)) {
    return go(
      'staff',
      ops.ratioAlerts
        ? `${ops.ratioAlerts} ${ops.ratioAlerts === 1 ? 'room' : 'rooms'} short of ratio. Opening Staff.`
        : 'Ratios look covered. Opening Staff.',
    )
  }
  if (STOCK.test(text)) {
    return go(
      'inventory',
      ops.lowStock ? `${ops.lowStock} items at or below reorder. Opening Inventory.` : 'No reorder alerts. Opening Inventory.',
    )
  }
  return null
}
