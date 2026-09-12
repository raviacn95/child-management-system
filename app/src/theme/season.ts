export type SeasonId = 'none' | 'pongal' | 'holi' | 'diwali' | 'christmas'

export function detectSeason(now = new Date()): SeasonId {
  const month = now.getMonth() + 1
  const day = now.getDate()
  if (month === 1 && day >= 10 && day <= 17) return 'pongal'
  if (month === 3 && day <= 10) return 'holi'
  if ((month === 10 && day >= 20) || (month === 11 && day <= 15)) return 'diwali'
  if (month === 12 && day >= 20) return 'christmas'
  return 'none'
}

export function applySeason(now = new Date()) {
  if (typeof document === 'undefined') return detectSeason(now)
  const season = detectSeason(now)
  document.documentElement.dataset.season = season
  return season
}
