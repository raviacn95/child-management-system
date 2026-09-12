import { describe, expect, it } from 'vitest'
import { COPYRIGHT_LINE, shareCopy } from '../../brand'
import { shareHref, sharePayload } from './share'

describe('Willow share cards', () => {
  it('brands every outbound share as Willow and never leaks child data', () => {
    const { text, url } = sharePayload()
    expect(text).toContain('Willow™')
    expect(text).toContain(COPYRIGHT_LINE)
    expect(text).toContain(url)
    expect(text).not.toMatch(/PIN|allerg|Leo|director@/i)
    expect(shareHref('whatsapp')).toContain('wa.me')
    expect(shareHref('facebook')).toContain('facebook.com/sharer')
    expect(decodeURIComponent(shareHref('whatsapp'))).toContain('Willow™')
  })

  it('keeps the install URL on the official Willow site', () => {
    expect(shareCopy()).toContain('raviacn95.github.io/child-management-system')
  })
})
