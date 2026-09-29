import { beforeEach, describe, expect, it, vi } from 'vitest'
import { EMPTY_AFFILIATE_IDS } from '../shopping/affiliate'
import { clickReport, missedClicks, readShopClicks, recordShopClick, resetShopClicks, sourceEarns } from './clicks'
import { readRevenueConfig, safeCheckoutUrl, safeEmail, safeWhatsapp } from './config'
import { activeGiftGuides, giftLink, GIFT_GUIDES } from './giftGuides'
import { leadText, submitLead, validateLead } from './leads'
import { checkoutUrlFor, formatInr, PLANS } from './plans'
import {
  captureReferral,
  inviteText,
  inviteUrl,
  isReferralCode,
  myReferralCode,
  newReferralCode,
  referralFrom,
} from './referral'
import { lastBasketLabel, readLastBasket, repeatBasketUrl, saveLastBasket } from './repeatBasket'
import { shareListText, whatsappShareHref } from './shareList'
import { liveSponsored } from './sponsored'

const SITE = 'https://raviacn95.github.io/child-management-system/'
const CONFIG = {
  plusCheckout: 'https://rzp.io/l/willow-plus',
  packsCheckout: '',
  leadsEndpoint: '',
  salesEmail: '',
  salesWhatsapp: '',
}
const LEAD = { kind: 'center', org: 'Little Oaks Daycare', city: 'Pune', size: 40, contact: 'hello@littleoaks.in', message: '' }

beforeEach(() => {
  localStorage.clear()
})

describe('revenue config', () => {
  it('accepts only https hosted-checkout links', () => {
    expect(safeCheckoutUrl('https://rzp.io/l/abc')).toBe('https://rzp.io/l/abc')
    expect(safeCheckoutUrl('https://pages.razorpay.com/willow')).toContain('pages.razorpay.com')
    expect(safeCheckoutUrl('https://buy.stripe.com/test_123')).toContain('buy.stripe.com')
    expect(safeCheckoutUrl('http://rzp.io/l/abc')).toBe('')
    expect(safeCheckoutUrl('https://evil.example/pay')).toBe('')
    expect(safeCheckoutUrl('javascript:alert(1)')).toBe('')
  })

  it('validates sales contacts and ignores junk env values', () => {
    expect(safeEmail('sales@willow.app')).toBe('sales@willow.app')
    expect(safeEmail('not an email')).toBe('')
    expect(safeWhatsapp('+91 98765 43210')).toBe('919876543210')
    expect(safeWhatsapp('123')).toBe('')
    expect(readRevenueConfig({ VITE_PLUS_CHECKOUT_URL: 'https://evil.example', VITE_LEADS_ENDPOINT: 'http://x.y' })).toEqual({
      plusCheckout: '',
      packsCheckout: '',
      leadsEndpoint: '',
      salesEmail: '',
      salesWhatsapp: '',
    })
  })
})

describe('plans', () => {
  it('lists free, plus, packs and center plans with honest prices', () => {
    expect(PLANS.map((plan) => plan.id)).toEqual(['free', 'plus', 'packs', 'center'])
    expect(formatInr(0)).toBe('Free')
    expect(formatInr(199)).toBe('₹199')
  })

  it('builds checkout links only when a hosted checkout is configured', () => {
    expect(checkoutUrlFor('plus', CONFIG, '')).toBe('https://rzp.io/l/willow-plus')
    expect(checkoutUrlFor('packs', CONFIG, '')).toBe('')
    expect(checkoutUrlFor('center', CONFIG, '')).toBe('')
    expect(checkoutUrlFor('plus', CONFIG, 'WIL-ABCDEF')).toBe('https://rzp.io/l/willow-plus?ref=WIL-ABCDEF')
  })
})

describe('referrals', () => {
  it('creates stable, unambiguous invite codes', () => {
    expect(isReferralCode(newReferralCode(() => 0))).toBe(true)
    const code = myReferralCode()
    expect(isReferralCode(code)).toBe(true)
    expect(myReferralCode()).toBe(code)
    expect(isReferralCode('WIL-ABC0O1')).toBe(false)
  })

  it('captures the first valid incoming code but never your own', () => {
    const own = myReferralCode()
    expect(captureReferral(`?ref=${own}`)).toBe('')
    expect(captureReferral('?ref=<script>')).toBe('')
    expect(captureReferral('?ref=wil-abcdef')).toBe('WIL-ABCDEF')
    expect(captureReferral('?ref=WIL-ZZZZZZ')).toBe('')
    expect(referralFrom()).toBe('WIL-ABCDEF')
  })

  it('puts the code in the query so it survives the hash router', () => {
    expect(inviteUrl('WIL-ABCDEF', SITE)).toBe(`${SITE}?ref=WIL-ABCDEF#/get-app`)
    expect(inviteUrl('bad', SITE)).toBe(`${SITE}#/get-app`)
    expect(inviteText('WIL-ABCDEF', SITE)).toContain('?ref=WIL-ABCDEF')
  })
})

describe('affiliate click tracking', () => {
  it('counts clicks per official store and ignores unknown sources', () => {
    recordShopClick('amazon')
    recordShopClick('amazon')
    recordShopClick('zepto')
    recordShopClick('evil-shop')
    expect(readShopClicks()).toEqual({ amazon: 2, zepto: 1 })
    resetShopClicks()
    expect(readShopClicks()).toEqual({})
  })

  it('reports clicks that could have earned without a tracking ID', () => {
    const rows = clickReport({ amazon: 5, flipkart: 2, zepto: 9 }, { ...EMPTY_AFFILIATE_IDS, amazonTag: 'willow-21' })
    expect(rows[0]).toEqual({ source: 'zepto', clicks: 9, earning: false, program: false })
    expect(missedClicks(rows)).toBe(2)
    expect(sourceEarns('myntra', { ...EMPTY_AFFILIATE_IDS, cuelinksPubId: '123' })).toBe(true)
  })
})

describe('repeat last basket', () => {
  it('saves ticked names and reopens them in the same store', () => {
    const saved = saveLastBasket(['Milk', 'Bread', 'Diapers'], 'blinkit', new Date('2026-09-28T10:00:00Z'))
    expect(saved?.titles).toEqual(['Milk', 'Bread', 'Diapers'])
    const basket = readLastBasket()
    expect(basket?.source).toBe('blinkit')
    expect(repeatBasketUrl(basket!)).toContain('blinkit.com/s/?q=Milk%2C%20Bread%2C%20Diapers')
    expect(lastBasketLabel(basket!, new Date('2026-09-30T10:00:00Z'))).toBe('3 items in Blinkit · 2 days ago')
  })

  it('refuses anything that looks like child data', () => {
    expect(saveLastBasket(['peanut allergy snack'], 'zepto')).toBeNull()
    expect(saveLastBasket(['mom@example.com'], 'zepto')).toBeNull()
    localStorage.setItem('willow-last-basket-v1', JSON.stringify({ titles: ['medical kit'], source: 'zepto' }))
    expect(readLastBasket()).toBeNull()
  })
})

describe('WhatsApp list share', () => {
  it('shares item names plus an invite link and nothing else', () => {
    const text = shareListText(['Milk', 'Bread'], 'WIL-ABCDEF')
    expect(text).toContain('• Milk')
    expect(text).toContain('?ref=WIL-ABCDEF')
    expect(whatsappShareHref(text)).toMatch(/^https:\/\/wa\.me\/\?text=/)
  })

  it('blocks PII and empty lists', () => {
    expect(shareListText(['PIN 1234'], 'WIL-ABCDEF')).toBe('')
    expect(shareListText([], 'WIL-ABCDEF')).toBe('')
    expect(whatsappShareHref('')).toBe('')
  })
})

describe('lead capture', () => {
  it('validates organisation leads and blocks child details', () => {
    expect(validateLead(LEAD).ok).toBe(true)
    expect(validateLead({ ...LEAD, contact: 'nope' })).toEqual({ ok: false, error: 'Add a work email or phone number' })
    expect(validateLead({ ...LEAD, message: 'Aarav has a nut allergy' })).toEqual({
      ok: false,
      error: 'Please leave out any child details',
    })
  })

  it('posts to the leads endpoint when configured', async () => {
    const fetcher = vi.fn().mockResolvedValue({ ok: true })
    const result = await submitLead(LEAD, { config: { ...CONFIG, leadsEndpoint: 'https://leads.example/in' }, fetcher })
    expect(result).toEqual({ ok: true, via: 'endpoint' })
    expect(fetcher).toHaveBeenCalledWith('https://leads.example/in', expect.objectContaining({ method: 'POST', credentials: 'omit' }))
  })

  it('falls back to WhatsApp, then email, then copy', async () => {
    const wa = await submitLead(LEAD, { config: { ...CONFIG, salesWhatsapp: '919876543210' } })
    expect(wa.ok && wa.via === 'whatsapp' && wa.href.startsWith('https://wa.me/919876543210?text=')).toBe(true)
    const mail = await submitLead(LEAD, { config: { ...CONFIG, salesEmail: 'sales@willow.app' } })
    expect(mail.ok && mail.via === 'email' && mail.href.startsWith('mailto:sales@willow.app')).toBe(true)
    const copy = await submitLead(LEAD, { config: CONFIG, ref: 'WIL-ABCDEF' })
    const valid = validateLead(LEAD)
    if (!valid.ok) throw new Error(valid.error)
    expect(copy).toEqual({ ok: true, via: 'copy', text: leadText(valid.lead, 'WIL-ABCDEF') })
    expect(leadText(valid.lead, 'WIL-ABCDEF')).toContain('Referred by: WIL-ABCDEF')
  })
})

describe('gift guides', () => {
  it('shows the seasonal guide first and birthdays all year', () => {
    expect(activeGiftGuides(new Date('2026-10-15')).map((guide) => guide.id)).toEqual(['festive', 'birthday'])
    expect(activeGiftGuides(new Date('2026-01-10')).map((guide) => guide.id)).toEqual(['winter', 'birthday'])
    expect(activeGiftGuides(new Date('2026-09-30'), 3).map((guide) => guide.id)).toEqual(['festive', 'monsoon', 'birthday'])
  })

  it('links gifts to official store searches', () => {
    expect(giftLink(GIFT_GUIDES[0].items[0], 'amazon')).toMatch(/^https:\/\/www\.amazon\.in\/s\?k=/)
  })
})

describe('sponsored shelf', () => {
  it('ships empty and only shows live, https, labelled slots', () => {
    expect(liveSponsored()).toEqual([])
    const slot = { id: 'a', brand: 'Brand', title: 'Offer', blurb: 'Nice', url: 'https://brand.example', until: '2026-12-31' }
    expect(liveSponsored([slot], new Date('2026-10-01'))).toHaveLength(1)
    expect(liveSponsored([slot], new Date('2027-01-02'))).toHaveLength(0)
    expect(liveSponsored([{ ...slot, url: 'http://brand.example' }], new Date('2026-10-01'))).toHaveLength(0)
  })
})
