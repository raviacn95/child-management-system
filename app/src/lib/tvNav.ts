export const TV_NAV = [
  { to: '/hub', key: 'hub' },
  { to: '/movies', key: 'movies' },
  { to: '/tv', key: 'tv' },
  { to: '/ott', key: 'ott' },
  { to: '/learning', key: 'learning' },
  { to: '/parent-feed', key: 'parent-feed' },
  { to: '/shop', key: 'shop' },
  { to: '/settings', key: 'settings' },
] as const

export function tvNavAfter(path: string) {
  const index = TV_NAV.findIndex((item) => item.to === path)
  if (index < 0 || index >= TV_NAV.length - 1) return null
  return TV_NAV[index + 1]
}
