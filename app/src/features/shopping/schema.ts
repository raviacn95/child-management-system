import { z } from 'zod'
import { SHOP_SOURCE_IDS } from './sources'

export const SAFE_SHOP_CATEGORIES = ['clothing', 'hygiene', 'school', 'toys', 'feeding'] as const

export const shopSourceIdSchema = z.enum(SHOP_SOURCE_IDS)

export const shopOfferSchema = z.object({
  source: shopSourceIdSchema,
  price: z.number().nonnegative().max(20000),
  mrp: z.number().nonnegative().max(40000),
  etaMin: z.number().int().nonnegative().max(10080),
  stock: z.number().int().nonnegative().max(9999),
  codOk: z.boolean(),
})

export const shopItemSchema = z.object({
  id: z.string().min(1).max(64).regex(/^ess-[a-z0-9-]+$/),
  title: z.string().min(1).max(80),
  brand: z.string().min(1).max(40),
  category: z.enum(SAFE_SHOP_CATEGORIES),
  ageMinMonths: z.number().int().min(0).max(216),
  ageMaxMonths: z.number().int().min(0).max(216),
  ageRange: z.string().max(16),
  query: z.string().min(2).max(80),
  rating: z.number().min(0).max(5),
  veg: z.boolean(),
  allergens: z.array(z.string().max(24)).max(8),
  tags: z.array(z.string().max(24)).max(12),
  why: z.string().max(160),
  offers: z.array(shopOfferSchema).min(1).max(8),
})

export const shopCatalogSchema = z.object({
  schemaVersion: z.string(),
  source: z.string(),
  codCapInr: z.number().int().positive(),
  items: z.array(shopItemSchema).max(40),
})

export type ShopCatalogItem = z.infer<typeof shopItemSchema>
export type ShopOfferRow = z.infer<typeof shopOfferSchema>
