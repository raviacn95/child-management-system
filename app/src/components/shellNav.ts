import type { Role } from '../types'

type GroupId = 'home' | 'watch' | 'care' | 'centre' | 'more'

const GROUPS: { id: GroupId; label: string; keys: string[] }[] = [
  { id: 'home', label: 'Home', keys: ['hub', 'dashboard'] },
  { id: 'watch', label: 'Watch & learn', keys: ['movies', 'tv', 'ott', 'learning', 'parent-feed', 'grow'] },
  {
    id: 'care',
    label: 'Care',
    keys: ['children', 'attendance', 'daily-care', 'health', 'meals', 'transport', 'messages', 'calendar'],
  },
  {
    id: 'centre',
    label: 'Run the centre',
    keys: ['workers', 'enrollment', 'staff', 'classrooms', 'billing', 'documents', 'inventory', 'reports'],
  },
  { id: 'more', label: 'Shop & settings', keys: ['shop', 'settings'] },
]

export function groupNav<T extends { key: string }>(items: readonly T[]) {
  const known = new Set(GROUPS.flatMap((g) => g.keys))
  return GROUPS.map((group) => ({
    id: group.id,
    label: group.label,
    items: items.filter((item) => (group.id === 'more' ? !known.has(item.key) || group.keys.includes(item.key) : group.keys.includes(item.key))),
  })).filter((group) => group.items.length > 0)
}

const TAB_PRIORITY: Record<Role, string[]> = {
  parent: ['dashboard', 'hub', 'movies', 'learning'],
  teacher: ['dashboard', 'attendance', 'learning', 'messages'],
  director: ['dashboard', 'hub', 'movies', 'attendance'],
}
const TAB_FALLBACK = ['dashboard', 'hub', 'movies', 'learning', 'attendance', 'messages', 'shop', 'settings']
const MAX_TABS = 4

export function phoneTabs(role: Role, visibleKeys: readonly string[]) {
  const visible = new Set(visibleKeys)
  const ordered = [...TAB_PRIORITY[role], ...TAB_FALLBACK].filter((key) => visible.has(key))
  return [...new Set(ordered)].slice(0, MAX_TABS)
}
