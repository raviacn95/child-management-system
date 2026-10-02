import { describe, expect, it } from 'vitest'
import { groupNav, phoneTabs } from './shellNav'

const item = (key: string) => ({ key })

describe('groupNav', () => {
  it('keeps menu order inside named sections and drops empty sections', () => {
    const groups = groupNav(['hub', 'dashboard', 'movies', 'attendance', 'learning', 'settings'].map(item))
    expect(groups.map((g) => g.label)).toEqual(['Home', 'Watch & learn', 'Care', 'Shop & settings'])
    expect(groups[0].items.map((i) => i.key)).toEqual(['hub', 'dashboard'])
    expect(groups[1].items.map((i) => i.key)).toEqual(['movies', 'learning'])
  })

  it('puts unknown pages under Shop & settings instead of losing them', () => {
    const groups = groupNav([item('dashboard'), item('brand-new-page')])
    expect(groups.at(-1)).toMatchObject({ id: 'more', items: [{ key: 'brand-new-page' }] })
  })

  it('does not mutate the input list', () => {
    const items = [item('settings'), item('dashboard')]
    groupNav(items)
    expect(items.map((i) => i.key)).toEqual(['settings', 'dashboard'])
  })
})

describe('phoneTabs', () => {
  const all = ['hub', 'dashboard', 'movies', 'tv', 'learning', 'attendance', 'messages', 'shop', 'settings']

  it('gives parents home, tonight, movies and learning', () => {
    expect(phoneTabs('parent', all)).toEqual(['dashboard', 'hub', 'movies', 'learning'])
  })

  it('gives teachers attendance and messages for the care day', () => {
    expect(phoneTabs('teacher', all)).toEqual(['dashboard', 'attendance', 'learning', 'messages'])
  })

  it('gives directors home, tonight, movies and attendance', () => {
    expect(phoneTabs('director', all)).toEqual(['dashboard', 'hub', 'movies', 'attendance'])
  })

  it('skips pages the role cannot see and fills up to four tabs', () => {
    expect(phoneTabs('teacher', ['dashboard', 'learning', 'shop', 'movies'])).toEqual([
      'dashboard',
      'learning',
      'movies',
      'shop',
    ])
  })

  it('never returns more tabs than visible pages', () => {
    expect(phoneTabs('parent', ['dashboard'])).toEqual(['dashboard'])
  })
})
