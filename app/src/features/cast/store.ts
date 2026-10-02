import { useSyncExternalStore } from 'react'
import { z } from 'zod'
import { randomB64u } from './bytes'
import type { LinkedPhone, LinkedTv } from './pairing'
import { cleanName, type Device } from './schema'

export type Role = 'tv' | 'phone'

const DEVICE_KEY: Record<Role, string> = { tv: 'willow-cast-device-tv', phone: 'willow-cast-device-phone' }
const DEFAULT_NAME: Record<Role, string> = { tv: 'Living room TV', phone: 'My phone' }
const TVS_KEY = 'willow-cast-tvs'
const PHONES_KEY = 'willow-cast-phones'
const CHANGE = 'willow-cast-change'

const b64u = z.string().regex(/^[A-Za-z0-9_-]+$/)
const deviceShape = z.object({ id: b64u.min(16).max(32), name: z.string().min(1).max(32) })
const tvShape = z.object({ id: b64u, key: b64u.length(43), tvId: b64u, name: z.string().max(32), addedAt: z.number() })
const phoneShape = z.object({ id: b64u, name: z.string().max(32), topic: b64u, key: b64u.length(43), addedAt: z.number() })

function read<T>(key: string, shape: z.ZodType<T>, fallback: T): T {
  try {
    const raw = localStorage.getItem(key)
    if (!raw) return fallback
    const parsed = shape.safeParse(JSON.parse(raw))
    return parsed.success ? parsed.data : fallback
  } catch {
    return fallback
  }
}

function write(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch {
    /* private mode */
  }
  window.dispatchEvent(new Event(CHANGE))
}

export function loadDevice(role: Role): Device {
  const saved = read(DEVICE_KEY[role], deviceShape, null)
  if (saved) return saved
  const fresh = { id: randomB64u(16), name: DEFAULT_NAME[role] }
  write(DEVICE_KEY[role], fresh)
  return fresh
}

export function hasCustomName(role: Role) {
  return loadDevice(role).name !== DEFAULT_NAME[role]
}

export function saveDeviceName(role: Role, name: string): Device {
  const next = { ...loadDevice(role), name: cleanName(name, DEFAULT_NAME[role]) }
  write(DEVICE_KEY[role], next)
  return next
}

export const linkedTvs = () => read(TVS_KEY, z.array(tvShape), [])
export const linkedPhones = () => read(PHONES_KEY, z.array(phoneShape), [])

/** Re-pairing the same TV replaces its old session; newest first. */
export function saveTv(tv: LinkedTv) {
  write(TVS_KEY, [tv, ...linkedTvs().filter((t) => t.tvId !== tv.tvId)])
}

export function forgetTv(tvId: string) {
  write(TVS_KEY, linkedTvs().filter((t) => t.tvId !== tvId))
}

export function savePhone(phone: LinkedPhone) {
  write(PHONES_KEY, [phone, ...linkedPhones().filter((p) => p.id !== phone.id)])
}

export function removePhone(id: string) {
  write(PHONES_KEY, linkedPhones().filter((p) => p.id !== id))
}

function subscribe(onChange: () => void) {
  const onStorage = (event: StorageEvent) => {
    if (event.key === TVS_KEY || event.key === PHONES_KEY) onChange()
  }
  window.addEventListener(CHANGE, onChange)
  window.addEventListener('storage', onStorage)
  return () => {
    window.removeEventListener(CHANGE, onChange)
    window.removeEventListener('storage', onStorage)
  }
}

function cachedSnapshot<T>(key: string, load: () => T[]) {
  let raw: string | null = null
  let value: T[] = []
  return () => {
    let next: string | null = null
    try {
      next = localStorage.getItem(key)
    } catch {
      next = null
    }
    if (next !== raw) {
      raw = next
      value = load()
    }
    return value
  }
}

const tvsSnapshot = cachedSnapshot(TVS_KEY, linkedTvs)
const phonesSnapshot = cachedSnapshot(PHONES_KEY, linkedPhones)
const empty = () => [] as never[]

export function useLinkedTvs(): LinkedTv[] {
  return useSyncExternalStore(subscribe, tvsSnapshot, empty)
}

export function useLinkedPhones(): LinkedPhone[] {
  return useSyncExternalStore(subscribe, phonesSnapshot, empty)
}
