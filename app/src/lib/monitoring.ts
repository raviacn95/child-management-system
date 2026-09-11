import { env } from '../env'

export function initMonitoring() {
  if (!env.VITE_SENTRY_DSN) return
  console.info('[monitoring] Sentry DSN is set. Add @sentry/react in production deploys.')
}
