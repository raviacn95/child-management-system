import { QueryClient } from '@tanstack/react-query'
import { z } from 'zod'
import { env } from '../env'

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 60_000, retry: 1, refetchOnWindowFocus: false },
  },
})

export async function apiGet<T>(path: string, schema: z.ZodType<T>): Promise<T> {
  const res = await fetch(`${env.VITE_API_URL}${path}`)
  if (!res.ok) throw new Error(`GET ${path} failed (${res.status})`)
  return schema.parse(await res.json())
}

export async function apiPost<T>(path: string, body: unknown, schema: z.ZodType<T>): Promise<T> {
  const res = await fetch(`${env.VITE_API_URL}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  if (!res.ok) throw new Error(`POST ${path} failed (${res.status})`)
  return schema.parse(await res.json())
}
