const KEY = 'willow-shop-telemetry-v1'

export type ShopTelemetry = {
  checks: number
  fills: number
  blocked: number
}

function read(): ShopTelemetry {
  try {
    const raw = sessionStorage.getItem(KEY)
    if (!raw) return { checks: 0, fills: 0, blocked: 0 }
    const parsed = JSON.parse(raw) as ShopTelemetry
    return {
      checks: Number(parsed.checks) || 0,
      fills: Number(parsed.fills) || 0,
      blocked: Number(parsed.blocked) || 0,
    }
  } catch {
    return { checks: 0, fills: 0, blocked: 0 }
  }
}

function write(next: ShopTelemetry) {
  try {
    sessionStorage.setItem(KEY, JSON.stringify(next))
  } catch {
    /* private mode */
  }
}

export function recordShopCheck(filled: boolean) {
  const cur = read()
  cur.checks += 1
  if (filled) cur.fills += 1
  write(cur)
}

export function recordShopBlocked() {
  const cur = read()
  cur.blocked += 1
  write(cur)
}

export function shopFillRate() {
  const cur = read()
  if (!cur.checks) return 0
  return Math.round((cur.fills / cur.checks) * 100)
}
