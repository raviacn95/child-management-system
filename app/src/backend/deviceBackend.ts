import { z } from 'zod'
import { env } from '../env'
import { publicRecommendInput } from '../lib/privacy'
import type { RecommendationInput } from '../features/learning/recommend'

export type BackendMode = 'local-first' | 'remote'

export function backendMode(): BackendMode {
  const url = env.VITE_API_URL
  if (!url || url === '/api' || env.PROD) return 'local-first'
  return 'remote'
}

export function backendHealth() {
  return {
    mode: backendMode(),
    encryptedTransport: true,
    piiEgress: false as const,
    surfaces: ['windows', 'android-phone', 'fire-stick'] as const,
  }
}

export async function localFirstPost<T>(
  path: string,
  body: unknown,
  schema: z.ZodType<T>,
  fallback: () => T,
): Promise<T> {
  if (backendMode() === 'local-first') return fallback()
  try {
    const res = await fetch(`${env.VITE_API_URL}${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    if (!res.ok) return fallback()
    return schema.parse(await res.json())
  } catch {
    return fallback()
  }
}

export function recommendPayload(input: RecommendationInput) {
  return publicRecommendInput(input)
}
