import { createSeed } from '../data/seed'
import type { AppState } from '../types'
import type { RecommendationInput } from '../features/learning/recommend'

export const CMS_KEYS = ['willow-cms-v5', 'willow-cms-v4', 'willow-cms-v3', 'willow-cms-v2', 'willow-cms-v1'] as const

/** Drop leftover schema versions so old plaintext blobs do not linger. */
export function wipeLegacyCmsKeys(keepCurrent = true) {
  try {
    for (const key of CMS_KEYS) {
      if (keepCurrent && key === 'willow-cms-v5') continue
      localStorage.removeItem(key)
    }
  } catch {
    /* private mode */
  }
}

export function wipeCmsKeys() {
  try {
    for (const key of CMS_KEYS) localStorage.removeItem(key)
  } catch {
    /* ignore */
  }
}

/** Never write passwords or the signed-in user id to disk. */
export function sanitizeForDisk(state: AppState): AppState {
  return {
    ...state,
    currentUserId: null,
    users: state.users.map((user) => ({ ...user, password: '' })),
    shopOrders: state.shopOrders.map((order) => ({
      ...order,
      address: order.address ? '' : order.address,
    })),
    handoffs: (state.handoffs ?? []).map((handoff) => ({
      ...handoff,
      notes: handoff.notes?.replace(/PIN\s*\d+/gi, 'PIN verified') ?? handoff.notes,
    })),
  }
}

/** Restore demo passwords in memory only, after loading a sanitized snapshot. */
export function withDemoSecrets(state: AppState): AppState {
  const seeded = createSeed()
  const byId = new Map(seeded.users.map((user) => [user.id, user.password]))
  const byEmail = new Map(seeded.users.map((user) => [user.email.toLowerCase(), user.password]))
  return {
    ...state,
    users: state.users.map((user) => ({
      ...user,
      password: user.password || byId.get(user.id) || byEmail.get(user.email.toLowerCase()) || '',
    })),
  }
}

/** Safe to POST or copy — no child name, id, or medical details. */
export function publicRecommendInput(input: RecommendationInput): RecommendationInput {
  return {
    ageYears: input.ageYears,
    stage: input.stage,
    interests: input.interests,
    countryCode: input.countryCode,
    allergies: [],
  }
}

export function publicRecommendCopy(result: { ageBand: string; channels: { id: string; name: string }[] }) {
  return JSON.stringify(
    {
      ageBand: result.ageBand,
      channels: result.channels.map((channel) => ({ id: channel.id, name: channel.name })),
    },
    null,
    2,
  )
}
