const SCREENS: Record<string, string> = {
  '/hub': 'Home',
  '/tv': 'TV tonight',
  '/movies': 'Movies',
  '/ott': 'My OTTs',
  '/learning': 'Learning',
  '/settings': 'Settings',
  '/tv-link': 'Link a phone',
}

/** Focus labels leave the TV only from catalog screens and the strip; household screens can show child names. */
const LABELLED = new Set(['/movies', '/ott', '/tv-link'])

export function screenName(pathname: string) {
  return SCREENS[pathname] ?? 'Willow'
}

export function focusLabel(pathname: string, el: Element | null): string | undefined {
  if (!(el instanceof HTMLElement) || !el.matches('[data-tv-focus]')) return undefined
  const inStrip = Boolean(el.closest('[data-testid="tv-strip"]'))
  if (!inStrip && !LABELLED.has(pathname)) return undefined
  const text = (el.getAttribute('aria-label') || el.textContent || '').replace(/\s+/g, ' ').trim().replace(/^Open /, '')
  return text ? text.slice(0, 60) : undefined
}

export function tvStatus(pathname: string, el: Element | null) {
  const focus = focusLabel(pathname, el)
  return { type: 'status' as const, screen: screenName(pathname), ...(focus ? { focus } : {}) }
}
