export type SteerDir = 'up' | 'down' | 'left' | 'right'

export function steerKey(key: string): SteerDir | null {
  if (key === 'ArrowUp') return 'up'
  if (key === 'ArrowDown') return 'down'
  if (key === 'ArrowLeft') return 'left'
  if (key === 'ArrowRight') return 'right'
  return null
}

export function nearestFocus(from: DOMRect, others: { el: HTMLElement; box: DOMRect }[], dir: SteerDir) {
  const fx = from.left + from.width / 2
  const fy = from.top + from.height / 2
  let best: HTMLElement | null = null
  let bestScore = Infinity
  for (const { el, box } of others) {
    const cx = box.left + box.width / 2
    const cy = box.top + box.height / 2
    const dx = cx - fx
    const dy = cy - fy
    if (dir === 'right' && dx <= 8) continue
    if (dir === 'left' && dx >= -8) continue
    if (dir === 'down' && dy <= 8) continue
    if (dir === 'up' && dy >= -8) continue
    const primary = dir === 'left' || dir === 'right' ? Math.abs(dx) : Math.abs(dy)
    const cross = dir === 'left' || dir === 'right' ? Math.abs(dy) : Math.abs(dx)
    const score = primary + cross * 2.4
    if (score < bestScore) {
      bestScore = score
      best = el
    }
  }
  return best
}

export function visibleTvFocus(root: ParentNode = document) {
  return [...root.querySelectorAll<HTMLElement>('[data-tv-focus]')].filter((el) => {
    if (el.closest('[disabled]') || el.getAttribute('aria-disabled') === 'true') return false
    const box = el.getBoundingClientRect()
    return box.width > 2 && box.height > 2
  })
}

export function moveTvFocus(dir: SteerDir, root: ParentNode = document) {
  const items = visibleTvFocus(root)
  if (!items.length) return null
  const active = document.activeElement
  const current = active instanceof HTMLElement && items.includes(active) ? active : items[0]
  if (!(active instanceof HTMLElement) || !items.includes(active)) {
    current.focus()
    current.scrollIntoView({ block: 'nearest', inline: 'center' })
    return current
  }
  const from = current.getBoundingClientRect()
  const next = nearestFocus(
    from,
    items.filter((el) => el !== current).map((el) => ({ el, box: el.getBoundingClientRect() })),
    dir,
  )
  if (!next) return current
  next.focus()
  next.scrollIntoView({ block: 'nearest', inline: 'center' })
  return next
}
