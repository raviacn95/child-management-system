import type { AuditEntry } from '../types'
import { publishRealtime } from './realtime'

export function makeAudit(userId: string | null, action: string, details: string): AuditEntry {
  return {
    id: `aud-${Math.random().toString(36).slice(2, 8)}`,
    at: new Date().toISOString(),
    userId,
    action,
    details,
  }
}

export function prependAudit(log: AuditEntry[] | undefined, entry: AuditEntry, cap = 200) {
  const next = [entry, ...(log ?? [])].slice(0, cap)
  publishRealtime('audit', entry)
  return next
}
