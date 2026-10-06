import { canOpen } from '../../lib/rbac'
import type { Role } from '../../types'
import type { AgentPage } from './schema'

const OPEN_PAGES = new Set<AgentPage>(['tv-link', 'pricing', 'get-app'])

export const PAGE_LABEL: Record<AgentPage, string> = {
  dashboard: 'Home',
  hub: 'Tonight',
  movies: 'Movies',
  tv: 'TV tonight',
  ott: 'My OTTs',
  learning: 'Learning',
  grow: 'Grow at home',
  'parent-feed': 'Parent feed',
  meals: 'Meals',
  shop: 'Willow Mart',
  calendar: 'Calendar',
  messages: 'Messages',
  children: 'Children',
  attendance: 'Attendance',
  'daily-care': 'Daily care',
  health: 'Health',
  billing: 'Billing',
  staff: 'Staff & ratios',
  classrooms: 'Rooms',
  transport: 'Van routes',
  documents: 'Documents',
  workers: 'Teacher workers',
  enrollment: 'Enrollment',
  inventory: 'Supplies',
  reports: 'Reports',
  settings: 'Settings',
  'tv-link': 'Link phone and TV',
  pricing: 'Plans',
  'get-app': 'Get the app',
}

function routeFor(page: AgentPage, tv: boolean) {
  if (page === 'dashboard') return '/'
  if (page === 'tv-link') return tv ? '/tv-link' : '/link'
  return `/${page}`
}

/** Route for an agent page, or null when this role cannot open it. */
export function pagePath(page: AgentPage, role: Role, tv = false) {
  if (!OPEN_PAGES.has(page) && !canOpen(role, page)) return null
  return routeFor(page, tv)
}
