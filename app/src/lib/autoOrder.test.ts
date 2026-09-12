import { describe, expect, it } from 'vitest'
import { isOfficialShopUrl } from '../features/shopping/sources'
import { partnerCombinedUrl, partnerQueryHasPii } from './autoOrder'

describe('auto-order combined partner search', () => {
  it('puts every ticked product name into one official search per app', () => {
    const names = [
      'Roasted chana 200g (nut-free plant)',
      'Diaper rash cream 50g',
      'Iron-on name tape 30pc',
    ]
    const zepto = partnerCombinedUrl('zepto', names)
    const blinkit = partnerCombinedUrl('blinkit', names)
    expect(isOfficialShopUrl(zepto)).toBe(true)
    expect(isOfficialShopUrl(blinkit)).toBe(true)
    expect(zepto).toContain('zeptonow.com')
    expect(decodeURIComponent(zepto)).toContain(names[0])
    expect(decodeURIComponent(zepto)).toContain(names[2])
    expect(decodeURIComponent(zepto)).toContain(', ')
    expect(decodeURIComponent(blinkit)).toContain(names[1])
    expect(partnerQueryHasPii(names)).toBe(false)
    expect(`${zepto} ${blinkit}`).not.toMatch(/Leo|Shah|c-leo|@/i)
  })
})
