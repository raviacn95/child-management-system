import { useEffect } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { prefetchRoute } from '../app/prefetch'
import { TV_NAV } from '../lib/tvNav'
import { moveTvFocus, steerKey } from '../lib/tvSteer'
import { canSee } from '../lib/rbac'
import type { Role } from '../types'

export function TvStrip({ role }: { role: Role }) {
  const location = useLocation()
  const items = TV_NAV.filter((item) => canSee(role, item.key))

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      const dir = steerKey(event.key)
      if (!dir) return
      const tag = (event.target as HTMLElement | null)?.tagName
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return
      event.preventDefault()
      moveTvFocus(dir)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  useEffect(() => {
    const current = document.querySelector<HTMLElement>(`[data-tv-strip] [aria-current='page']`)
    const first = document.querySelector<HTMLElement>('main [data-tv-focus]')
    ;(current ?? first)?.focus()
  }, [location.pathname])

  return (
    <nav className="tv-strip" data-testid="tv-strip" aria-label="Living room">
      {items.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          data-tv-focus="1"
          data-testid={`tv-strip-${item.key}`}
          onFocus={() => prefetchRoute(item.to)}
          className={({ isActive }) => `tv-strip-item${isActive ? ' tv-strip-item-active' : ''}`}
        >
          {item.key === 'hub' ? 'Home' : item.key === 'tv' ? 'TV tonight' : label(item.key)}
        </NavLink>
      ))}
    </nav>
  )
}

function label(key: string) {
  if (key === 'movies') return 'Movies'
  if (key === 'ott') return 'My OTTs'
  if (key === 'learning') return 'Learning'
  if (key === 'parent-feed') return 'Parent feed'
  if (key === 'shop') return 'Shop'
  if (key === 'settings') return 'Settings'
  return key
}
