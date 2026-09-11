import { env, flagOn } from '../env'

const KEY = 'willow-flags-v1'

export interface FeatureFlags {
  learningChannels: boolean
  pwa: boolean
  realtime: boolean
  auditLog: boolean
  msw: boolean
  graphql: boolean
}

export const DEFAULT_FLAGS: FeatureFlags = {
  learningChannels: flagOn(env.VITE_FEATURE_LEARNING_CHANNELS),
  pwa: flagOn(env.VITE_ENABLE_PWA),
  realtime: true,
  auditLog: true,
  msw: flagOn(env.VITE_ENABLE_MSW, env.DEV),
  graphql: false,
}

export function readFlags(): FeatureFlags {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return { ...DEFAULT_FLAGS }
    return { ...DEFAULT_FLAGS, ...(JSON.parse(raw) as Partial<FeatureFlags>) }
  } catch {
    return { ...DEFAULT_FLAGS }
  }
}

export function writeFlags(next: FeatureFlags) {
  localStorage.setItem(KEY, JSON.stringify(next))
}

export function isOn(name: keyof FeatureFlags) {
  return readFlags()[name]
}
