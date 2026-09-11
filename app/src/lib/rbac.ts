import type { Role } from '../types'

export const MODULE_KEYS = [
  'dashboard',
  'grow',
  'children',
  'workers',
  'enrollment',
  'attendance',
  'daily-care',
  'health',
  'billing',
  'staff',
  'classrooms',
  'messages',
  'calendar',
  'learning',
  'meals',
  'shop',
  'transport',
  'documents',
  'inventory',
  'reports',
  'settings',
] as const

export type ModuleKey = (typeof MODULE_KEYS)[number]

const TEACHER: ModuleKey[] = [
  'dashboard',
  'children',
  'attendance',
  'daily-care',
  'health',
  'classrooms',
  'messages',
  'calendar',
  'learning',
  'meals',
  'staff',
  'workers',
  'shop',
  'grow',
  'transport',
]

const PARENT: ModuleKey[] = [
  'dashboard',
  'children',
  'daily-care',
  'health',
  'billing',
  'messages',
  'calendar',
  'documents',
  'learning',
  'meals',
  'workers',
  'shop',
  'grow',
  'transport',
]

const ACTIONS = {
  'audit.read': ['director'] as Role[],
  'flags.write': ['director'] as Role[],
  'learning.observe': ['director', 'teacher'] as Role[],
  'learning.recommend': ['director', 'teacher', 'parent'] as Role[],
}

export type ActionKey = keyof typeof ACTIONS

export function canSee(role: Role, module: string) {
  if (role === 'director') return true
  if (role === 'teacher') return TEACHER.includes(module as ModuleKey)
  return PARENT.includes(module as ModuleKey)
}

export function canDo(role: Role, action: ActionKey) {
  if (role === 'director') return true
  return ACTIONS[action].includes(role)
}

export function moduleFromPath(pathname: string): ModuleKey | null {
  const seg = pathname.replace(/^\//, '').split('/')[0]
  const key = (seg === '' ? 'dashboard' : seg) as ModuleKey
  return MODULE_KEYS.includes(key) ? key : null
}
