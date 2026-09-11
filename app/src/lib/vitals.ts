import { onCLS, onINP, onLCP } from 'web-vitals'

export function initVitals() {
  if (typeof window === 'undefined') return
  const report = (metric: { name: string; value: number; rating: string }) => {
    if (import.meta.env.DEV) {
      console.debug(`[web-vitals] ${metric.name}`, metric.value.toFixed(1), metric.rating)
    }
  }
  onCLS(report)
  onINP(report)
  onLCP(report)
}
