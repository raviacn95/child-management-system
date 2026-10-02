import { beforeEach, describe, expect, it } from 'vitest'
import {
  CUSTOM_APPS_KEY,
  addCustomApp,
  appsForShelf,
  customAppLink,
  customSearchUrl,
  loadCustomApps,
  parseCustomApp,
  removeCustomApp,
  type CustomApp,
} from './customApps'

const draft = { name: 'My Films', searchUrl: 'https://films.example.com/search?q={q}', scope: 'all' as const }

function memoryStorage(): Storage {
  const data = new Map<string, string>()
  return {
    get length() {
      return data.size
    },
    clear: () => data.clear(),
    getItem: (k) => data.get(k) ?? null,
    key: (i) => [...data.keys()][i] ?? null,
    removeItem: (k) => void data.delete(k),
    setItem: (k, v) => void data.set(k, String(v)),
  }
}

describe('parseCustomApp', () => {
  it('accepts an https search link with {q}', () => {
    const result = parseCustomApp(draft)
    expect(result.ok).toBe(true)
    if (result.ok) expect(result.app).toMatchObject({ name: 'My Films', scope: 'all' })
  })

  it('trims the name and search link', () => {
    const result = parseCustomApp({ ...draft, name: '  My Films ', searchUrl: ` ${draft.searchUrl} ` })
    expect(result.ok && result.app.name).toBe('My Films')
    expect(result.ok && result.app.searchUrl).toBe(draft.searchUrl)
  })

  it('needs {q} where the title goes', () => {
    const result = parseCustomApp({ ...draft, searchUrl: 'https://films.example.com/search' })
    expect(result).toEqual({ ok: false, error: 'Put {q} in the link where the movie name goes' })
  })

  it('refuses links that are not https', () => {
    for (const searchUrl of ['http://films.example.com/?q={q}', 'javascript:alert(1)//{q}', 'intent://x/{q}', 'films {q}']) {
      expect(parseCustomApp({ ...draft, searchUrl }).ok).toBe(false)
    }
  })

  it('refuses apps blocked in India by name or by link', () => {
    expect(parseCustomApp({ ...draft, name: 'Ullu' })).toEqual({ ok: false, error: 'This app is blocked in India' })
    expect(parseCustomApp({ ...draft, searchUrl: 'https://www.altbalaji.com/search?q={q}' }).ok).toBe(false)
  })

  it('checks the optional Android package name', () => {
    expect(parseCustomApp({ ...draft, androidPackage: 'com.example.films' }).ok).toBe(true)
    expect(parseCustomApp({ ...draft, androidPackage: '' }).ok).toBe(true)
    expect(parseCustomApp({ ...draft, androidPackage: 'not a package' }).ok).toBe(false)
    expect(parseCustomApp({ ...draft, androidPackage: 'com.x;S.evil=1' }).ok).toBe(false)
  })

  it('needs a short name', () => {
    expect(parseCustomApp({ ...draft, name: ' ' }).ok).toBe(false)
    expect(parseCustomApp({ ...draft, name: 'x'.repeat(31) }).ok).toBe(false)
  })
})

describe('links', () => {
  const app: CustomApp = { id: 'a1', ...draft }

  it('puts the encoded title (and year) where {q} is', () => {
    expect(customSearchUrl(app, 'Rang De Basanti', 2006)).toBe('https://films.example.com/search?q=Rang%20De%20Basanti%202006')
    expect(customSearchUrl(app, 'Tom & Jerry')).toBe('https://films.example.com/search?q=Tom%20%26%20Jerry')
  })

  it('opens the web search on phones and TVs without a package', () => {
    expect(customAppLink(app, 'Drishyam', 2013, false)).toBe(customSearchUrl(app, 'Drishyam', 2013))
    expect(customAppLink(app, 'Drishyam', 2013, true)).toBe(customSearchUrl(app, 'Drishyam', 2013))
  })

  it('asks Android to open the app on TV when a package is saved', () => {
    const withPkg = { ...app, androidPackage: 'com.example.films' }
    const web = customSearchUrl(withPkg, 'Drishyam', 2013)
    expect(customAppLink(withPkg, 'Drishyam', 2013, true)).toBe(
      `intent://films.example.com/search?q=Drishyam%202013#Intent;scheme=https;package=com.example.films;S.browser_fallback_url=${encodeURIComponent(web)};end`,
    )
    expect(customAppLink(withPkg, 'Drishyam', 2013, false)).toBe(web)
  })
})

describe('storage', () => {
  let storage: Storage
  beforeEach(() => {
    storage = memoryStorage()
  })

  it('starts empty and keeps added apps on this device', () => {
    expect(loadCustomApps(storage)).toEqual([])
    const added = addCustomApp(draft, storage)
    expect(added.ok).toBe(true)
    expect(loadCustomApps(storage)).toHaveLength(1)
    expect(JSON.parse(storage.getItem(CUSTOM_APPS_KEY) ?? '[]')[0].name).toBe('My Films')
  })

  it('does not save an invalid app', () => {
    expect(addCustomApp({ ...draft, searchUrl: 'https://x.example.com' }, storage).ok).toBe(false)
    expect(loadCustomApps(storage)).toEqual([])
  })

  it('removes an app by id', () => {
    const added = addCustomApp(draft, storage)
    if (!added.ok) throw new Error('expected ok')
    removeCustomApp(added.app.id, storage)
    expect(loadCustomApps(storage)).toEqual([])
  })

  it('drops tampered or blocked entries when loading', () => {
    storage.setItem(
      CUSTOM_APPS_KEY,
      JSON.stringify([
        { id: 'ok', ...draft },
        { id: 'bad', name: 'X', searchUrl: 'javascript:{q}', scope: 'all' },
        { id: 'ban', name: 'Ullu', searchUrl: 'https://ullu.app/?q={q}', scope: 'all' },
      ]),
    )
    expect(loadCustomApps(storage).map((a) => a.id)).toEqual(['ok'])
    storage.setItem(CUSTOM_APPS_KEY, '{not json')
    expect(loadCustomApps(storage)).toEqual([])
  })

  it('caps the list at 12 apps', () => {
    for (let i = 0; i < 12; i++) expect(addCustomApp({ ...draft, name: `App ${i}` }, storage).ok).toBe(true)
    expect(addCustomApp(draft, storage)).toEqual({ ok: false, error: 'You can save up to 12 apps' })
  })
})

describe('appsForShelf', () => {
  const all: CustomApp = { id: 'a', ...draft }
  const erotic: CustomApp = { id: 'b', ...draft, scope: 'erotic' }

  it('shows erotic-only apps just on the erotic shelf', () => {
    expect(appsForShelf([all, erotic], 'family')).toEqual([all])
    expect(appsForShelf([all, erotic], 'erotic')).toEqual([all, erotic])
  })
})
