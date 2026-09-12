import { z } from 'zod'

const flag = z.enum(['true', 'false']).optional()

const schema = z.object({
  VITE_APP_NAME: z.string().default('Willow'),
  VITE_API_URL: z.string().default('/api'),
  VITE_ENABLE_PWA: flag,
  VITE_ENABLE_MSW: flag,
  VITE_FEATURE_LEARNING_CHANNELS: flag,
  VITE_SENTRY_DSN: z.string().optional().default(''),
  VITE_SHOP_API: z.string().optional().default(''),
  VITE_FLIPKART_AFFILIATE_ID: z.string().optional().default(''),
  VITE_AMAZON_ASSOCIATE_TAG: z.string().optional().default(''),
  VITE_MEESHO_AFFILIATE_ID: z.string().optional().default(''),
  VITE_CUELINKS_PUB_ID: z.string().optional().default(''),
  VITE_ADMITAD_CODE: z.string().optional().default(''),
  MODE: z.string().default('development'),
  DEV: z.boolean().default(true),
  PROD: z.boolean().default(false),
})

export const env = schema.parse({
  VITE_APP_NAME: import.meta.env.VITE_APP_NAME ?? 'Willow',
  VITE_API_URL: import.meta.env.VITE_API_URL ?? '/api',
  VITE_ENABLE_PWA: import.meta.env.VITE_ENABLE_PWA ?? 'true',
  VITE_ENABLE_MSW: import.meta.env.VITE_ENABLE_MSW ?? (import.meta.env.DEV ? 'true' : 'false'),
  VITE_FEATURE_LEARNING_CHANNELS: import.meta.env.VITE_FEATURE_LEARNING_CHANNELS ?? 'true',
  VITE_SENTRY_DSN: import.meta.env.VITE_SENTRY_DSN ?? '',
  VITE_SHOP_API: import.meta.env.VITE_SHOP_API ?? '',
  VITE_FLIPKART_AFFILIATE_ID: import.meta.env.VITE_FLIPKART_AFFILIATE_ID ?? '',
  VITE_AMAZON_ASSOCIATE_TAG: import.meta.env.VITE_AMAZON_ASSOCIATE_TAG ?? '',
  VITE_MEESHO_AFFILIATE_ID: import.meta.env.VITE_MEESHO_AFFILIATE_ID ?? '',
  VITE_CUELINKS_PUB_ID: import.meta.env.VITE_CUELINKS_PUB_ID ?? '',
  VITE_ADMITAD_CODE: import.meta.env.VITE_ADMITAD_CODE ?? '',
  MODE: import.meta.env.MODE,
  DEV: import.meta.env.DEV,
  PROD: import.meta.env.PROD,
})

export function flagOn(value: string | undefined, fallback = true) {
  if (value == null) return fallback
  return value === 'true'
}
