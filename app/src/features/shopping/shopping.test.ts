import { beforeEach, describe, expect, it } from 'vitest'
import { AFFILIATE_KEY, AFFILIATE_PROGRAMS, applyAffiliate, sanitizeAffiliateId, writeAffiliateIds } from './affiliate'
import { matchingMartIds, packRequiredBaskets, tripHasPii } from './baskets'
import { launchOfficialShop } from './launch'
import { publicShopInput } from './privacy'
import { COD_PARENT_CAP, recommendShopping } from './recommend'
import { fetchLiveAffiliate } from './liveAffiliate'
import { combinedSearches, searchesForApp, selectedTogetherList, togetherHasPii, TOGETHER_APPS } from './together'
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
  beforeEach(() => {
    localStorage.removeItem(AFFILIATE_KEY)
  })

  it('points apply buttons at official affiliate programs only', () => {
    expect(AFFILIATE_PROGRAMS.map((p) => p.href)).toEqual([
      'https://affiliate.flipkart.com/',
      'https://affiliate-program.amazon.in/',
      'https://www.cuelinks.com/',
      'https://www.admitad.com/',
    ])
  })

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

  it('stamps public affiliate IDs onto official Flipkart and Amazon links', () => {
    writeAffiliateIds({
      flipkartAffid: 'willowfk',
      amazonTag: 'willowcare-21',
      meeshoId: '',
      cuelinksPubId: '',
      admitadCode: '',
    })
    const flipkart = officialShopUrl('flipkart', 'baby wipes')
    const amazon = officialShopUrl('amazon', 'baby wipes')
    expect(flipkart).toContain('affid=willowfk')
    expect(amazon).toContain('tag=willowcare-21')
    expect(isOfficialShopUrl(flipkart)).toBe(true)
    expect(isOfficialShopUrl(amazon)).toBe(true)
    expect(sanitizeAffiliateId('parent@willow.care')).toBe('')
    expect(
      applyAffiliate('myntra', 'https://www.myntra.com/kids-night-suit', {
        flipkartAffid: '',
        amazonTag: '',
        meeshoId: '',
        cuelinksPubId: 'cue99',
        admitadCode: '',
      }),
    ).toContain('linksredirect.com')
    expect(
      isOfficialShopUrl(
        applyAffiliate('myntra', 'https://www.myntra.com/kids-night-suit', {
          flipkartAffid: '',
          amazonTag: '',
          meeshoId: '',
          cuelinksPubId: 'cue99',
          admitadCode: '',
        }),
      ),
    ).toBe(true)
    expect(isOfficialShopUrl('https://linksredirect.com/?url=https://evil.example/x')).toBe(false)
  })

  it('keeps live affiliate results only when the deep link is official', async () => {
    const fetchImpl = (async () => ({
      ok: true,
      json: async () => ({
        items: [
          {
            id: 'live-1',
            title: 'Sensitive wet wipes 80s',
            price: 189,
            source: 'flipkart',
            affiliateLink: 'https://www.flipkart.com/search?q=wipes&affid=willowfk',
            codAvailable: true,
          },
          {
            id: 'live-bad',
            title: 'Spam',
            price: 10,
            source: 'flipkart',
            affiliateLink: 'https://evil.example/buy',
          },
        ],
      }),
    })) as unknown as typeof fetch
    const live = await fetchLiveAffiliate('wipes', baseInput, { fetchImpl, api: 'https://shop.willow.invalid' })
    expect(live).toHaveLength(1)
    expect(live[0].affiliateLink).toContain('flipkart.com')
  })

  it('lists every required search together for Zepto so a parent can pick and order there', () => {
    const picks = recommendShopping(baseInput)
    const zepto = searchesForApp(picks, 'zepto')
    expect(zepto.length).toBe(picks.length)
    expect(zepto.every((row) => row.officialUrl.includes('zeptonow.com'))).toBe(true)
    expect(togetherHasPii(zepto)).toBe(false)
    const selected = selectedTogetherList(zepto, picks.slice(0, 2).map((pick) => pick.id))
    expect(selected.rows).toHaveLength(2)
    expect(selected.listText).toContain(picks[0].title)
    expect(selected.listText).not.toMatch(/Leo|Shah|c-leo/i)
  })

  it('puts every ticked name into one search for each delivery app', () => {
    const picks = recommendShopping(baseInput)
    const titles = picks.map((pick) => pick.title)
    const apps = combinedSearches(titles)
    expect(apps.map((row) => row.source)).toEqual(TOGETHER_APPS)
    expect(apps[0].query).toContain(picks[0].title)
    expect(apps[0].query).toContain(picks[picks.length - 1].title)
    expect(apps[0].query).toContain(', ')
    for (const app of apps) {
      expect(app.query).toBe(apps[0].query)
      expect(isOfficialShopUrl(app.officialUrl)).toBe(true)
      expect(decodeURIComponent(app.officialUrl)).toContain(picks[0].title.split(' ')[0])
    }
    expect(apps.find((row) => row.source === 'zepto')?.officialUrl).toContain('zeptonow.com')
    expect(togetherHasPii(searchesForApp(picks, 'zepto'), apps[0].query)).toBe(false)
    expect(apps.map((row) => row.officialUrl).join(' ')).not.toMatch(/Leo|Shah|c-leo/i)
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
