import { describe, expect, it } from 'vitest'
import { matchingMartIds, packRequiredBaskets, tripHasPii } from './baskets'
import { launchOfficialShop } from './launch'
import { publicShopInput } from './privacy'
import { COD_PARENT_CAP, recommendShopping } from './recommend'
import { isOfficialShopUrl, officialShopUrl } from './sources'

const baseInput = publicShopInput({
  ageMonths: 66,
  sizeBand: '5–6Y',
  veg: true,
  needTags: ['school', 'tiffin', 'hygiene'],
  allergyNames: ['peanuts'],
  pinPrefix: '56',
  preferCodCap: true,
})

describe('kids shopping aggregator', () => {
  it('keeps only official HTTPS storefronts', () => {
    expect(officialShopUrl('flipkart', 'baby wipes')).toBe('https://www.flipkart.com/search?q=baby%20wipes')
    expect(officialShopUrl('meesho', 'baby wipes')).toContain('meesho.com')
    expect(officialShopUrl('zepto', 'baby wipes')).toContain('zeptonow.com')
    expect(isOfficialShopUrl('https://evil.example/search?q=wipes')).toBe(false)
    expect(isOfficialShopUrl('http://www.flipkart.com/search?q=wipes')).toBe(false)
  })

  it('defaults to COD under ₹200 and drops peanut snacks for that profile', () => {
    const picks = recommendShopping(baseInput)
    expect(picks.length).toBeGreaterThan(2)
    expect(picks.every((pick) => pick.chosen.price <= COD_PARENT_CAP)).toBe(true)
    expect(picks.every((pick) => pick.chosen.codAvailable)).toBe(true)
    expect(picks.some((pick) => /chikki|peanut/i.test(pick.title))).toBe(false)
    expect(picks.some((pick) => pick.title === 'Soft night suit set')).toBe(false)
  })

  it('falls back when the 10-minute source is out of stock', () => {
    const picks = recommendShopping({ ...baseInput, now: new Date('2026-07-15T10:00:00+05:30') })
    const poncho = picks.find((pick) => pick.id === 'ess-poncho')
    expect(poncho).toBeTruthy()
    expect(poncho?.chosen.source).not.toBe('zepto')
    expect(poncho?.reason).toMatch(/Fallback after Zepto/i)
    expect(isOfficialShopUrl(poncho!.chosen.officialUrl)).toBe(true)
  })

  it('never puts a child name into the official search query', () => {
    const picks = recommendShopping(baseInput)
    for (const pick of picks) {
      expect(pick.query).not.toMatch(/Leo|Mira|Shah|@/i)
      expect(pick.chosen.officialUrl).not.toMatch(/Leo|Mira|childId|PIN/i)
    }
  })

  it('strips identity fields from the public shop input', () => {
    const safe = publicShopInput({
      ageMonths: 66,
      sizeBand: '5–6Y',
      veg: true,
      needTags: ['school'],
      allergyNames: ['Peanuts'],
      pinPrefix: '560001',
      preferCodCap: true,
    })
    expect(safe.pinPrefix).toBe('56')
    expect(JSON.stringify(safe)).not.toMatch(/Leo|medical|epipen/i)
  })

  it('packs every required item into the fewest official apps without child names', () => {
    const picks = recommendShopping(baseInput)
    const baskets = packRequiredBaskets(picks)
    expect(baskets.length).toBeGreaterThan(0)
    expect(baskets.length).toBeLessThanOrEqual(picks.length)
    expect(baskets.reduce((n, b) => n + b.lines.length, 0)).toBe(picks.length)
    expect(tripHasPii(baskets)).toBe(false)
    expect(baskets.every((b) => b.officialUrl.startsWith('https://'))).toBe(true)
    expect(baskets.flatMap((b) => [b.listText, b.officialUrl]).join(' ')).not.toMatch(/Leo|Shah|c-leo|PIN/i)
    expect(matchingMartIds(picks.map((p) => p.title))).toContain('fc-wipes')
  })

  it('refuses to launch a foreign shop URL', () => {
    expect(
      launchOfficialShop({
        url: 'https://evil.example/checkout',
        title: 'Sensitive wet wipes 80s',
        sourceName: 'Zepto',
        screen: '/shop',
      }),
    ).toBeNull()
  })
})
