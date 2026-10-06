import { readRevenueConfig, type RevenueConfig } from './config'
import { referralFrom } from './referral'

export type PlanId = 'free' | 'plus' | 'packs' | 'center'
export type PlanAction = 'start' | 'checkout' | 'contact'

export type Plan = {
  id: PlanId
  name: string
  priceInr: number
  period: string
  blurb: string
  features: string[]
  action: PlanAction
  /** Ten months of the monthly price: two months free. */
  yearlyPriceInr?: number
}

export const PLANS: Plan[] = [
  {
    id: 'free',
    name: 'Free',
    priceInr: 0,
    period: 'forever',
    blurb: 'For one family getting started.',
    features: ['Household hub, learning and movies', 'Search-together shopping lists', 'Parent feed and daily plans'],
    action: 'start',
  },
  {
    id: 'plus',
    name: 'Willow Plus',
    priceInr: 199,
    period: 'month',
    yearlyPriceInr: 1990,
    blurb: 'Keeps Willow ad-free and funds new features.',
    features: ['Priority WhatsApp support', 'Early access to new features', 'Monthly printable planner pack', 'Ad-free promise'],
    action: 'checkout',
  },
  {
    id: 'packs',
    name: 'Learning packs',
    priceInr: 299,
    period: 'one-time',
    blurb: 'Printable age 2–6 activity packs.',
    features: ['60+ printable activities', 'Age-by-age skill checklist', 'Reuse for every child at home'],
    action: 'checkout',
  },
  {
    id: 'center',
    name: 'Daycare / Center',
    priceInr: 49,
    period: 'child / month',
    blurb: 'Run a daycare or preschool on Willow.',
    features: ['Attendance, daily care and billing', 'Parent feed and messages', 'Staff, classrooms and reports', 'Onboarding help'],
    action: 'contact',
  },
]

export function formatInr(amount: number) {
  if (!amount) return 'Free'
  return `₹${amount.toLocaleString('en-IN')}`
}

export function checkoutUrlFor(
  planId: PlanId,
  config: RevenueConfig = readRevenueConfig(),
  ref: string = referralFrom(),
  billing: 'month' | 'year' = 'month',
) {
  const base =
    planId === 'plus'
      ? billing === 'year'
        ? config.plusYearlyCheckout
        : config.plusCheckout
      : planId === 'packs'
        ? config.packsCheckout
        : ''
  if (!base) return ''
  if (!ref) return base
  const url = new URL(base)
  url.searchParams.set('ref', ref)
  return url.href
}
