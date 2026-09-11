import { describe, expect, it } from 'vitest'
import { fillSearchUrl, watchUrl } from './catalog'
import { fireTvIntent } from '../ott/fireTv'

describe('official watch links', () => {
  it('puts the movie title into JioHotstar search, not a blank /search page', () => {
    const url = watchUrl('hotstar', 'Drishyam', 2013)
    expect(url).toContain('jiohotstar.com')
    expect(url).toContain('search_query=Drishyam')
    expect(url).toContain('2013')
    expect(url).not.toMatch(/\/search$/)
  })

  it('puts the movie title into Prime Video navbar search', () => {
    const url = watchUrl('prime', 'Kumbalangi Nights', 2019)
    expect(url).toContain('primevideo.com/search')
    expect(url).toContain('phrase=Kumbalangi')
    expect(url).toContain('2019')
    expect(url).toContain('ref=atv_nb_sr')
  })

  it('still fills a template that forgot {q}', () => {
    expect(fillSearchUrl('https://www.hotstar.com/in/search', 'Manjummel Boys')).toBe(
      'https://www.hotstar.com/in/search?q=Manjummel%20Boys',
    )
  })

  it('keeps the title inside Fire TV Hotstar intents', () => {
    const href = fireTvIntent('hotstar', 'Drishyam', 2013)
    expect(href).toContain('package=in.startv.hotstar')
    expect(href).toContain('search_query=Drishyam')
  })
})
