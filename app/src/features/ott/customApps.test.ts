import { beforeEach, describe, expect, it } from 'vitest'
import {
  CUSTOM_APPS_KEY,
  addCustomApp,
  appLinkFromParts,
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

  it('accepts the app’s own link when it has {q}', () => {
    const result = parseCustomApp({ ...draft, searchUrl: 'filmsapp://films.example/open?q={q}' })
    expect(result.ok && result.app.searchUrl).toBe('filmsapp://films.example/open?q={q}')
  })

  it('refuses web links that are not https, and links that are not a real app address', () => {
    for (const searchUrl of [
      'http://films.example.com/?q={q}',
      'javascript:alert(1)//{q}',
      'intent://x/{q}',
      'films {q}',
      'filmsapp://films.example/open?q={q};end',
    ]) {
      expect(parseCustomApp({ ...draft, searchUrl }).ok).toBe(false)
    }
  })

  it('refuses apps blocked in India by name or by link', () => {
    expect(parseCustomApp({ ...draft, name: 'Ullu' })).toEqual({ ok: false, error: 'This app is blocked in India' })
    expect(parseCustomApp({ ...draft, searchUrl: 'https://www.altbalaji.com/search?q={q}' }).ok).toBe(false)
  })

  it('checks the optional Android package name', () => {
    expect(parseCustomApp({ ...draft, androidPackage: 'com.example.films' }).ok).toBe(true)
    const apk = parseCustomApp({ ...draft, androidPackage: 'com.example.films.apk' })
    expect(apk.ok && apk.app.androidPackage).toBe('com.example.films')
    expect(parseCustomApp({ ...draft, androidPackage: '' }).ok).toBe(true)
    expect(parseCustomApp({ ...draft, androidPackage: 'com.ullu.app' })).toEqual({ ok: false, error: 'This app is blocked in India' })
    expect(parseCustomApp({ ...draft, androidPackage: 'not a package' }).ok).toBe(false)
    expect(parseCustomApp({ ...draft, androidPackage: 'com.x;S.evil=1' }).ok).toBe(false)
  })

  it('needs a short name', () => {
    expect(parseCustomApp({ ...draft, name: ' ' }).ok).toBe(false)
    expect(parseCustomApp({ ...draft, name: 'x'.repeat(31) }).ok).toBe(false)
  })

  it('opens the named app when the website is left blank', () => {
    const result = parseCustomApp({ name: 'My Films', searchUrl: ' ', scope: 'all' })
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.app.searchUrl).toBeUndefined()
    expect(result.app.androidPackage).toBeUndefined()
    expect(customAppLink(result.app, 'Drishyam', 2013)).toBe(
      'intent:#Intent;action=android.intent.action.MAIN;category=android.intent.category.LAUNCHER;S.app_name=My%20Films;end',
    )
  })

  it('launches an installed app from its package, and a screen when one is given', () => {
    const pkgOnly = parseCustomApp({ name: 'Films', searchUrl: '', androidPackage: 'com.example.films', scope: 'all' })
    expect(pkgOnly.ok && customAppLink(pkgOnly.app, 'Drishyam')).toBe(
      'intent:#Intent;action=android.intent.action.MAIN;category=android.intent.category.LAUNCHER;package=com.example.films;S.app_name=Films;end',
    )
    const screen = parseCustomApp({
      name: 'Films',
      searchUrl: '',
      androidPackage: 'com.example.films',
      activity: '.MainActivity',
      scope: 'all',
    })
    expect(screen.ok && screen.app.activity).toBe('com.example.films.MainActivity')
    expect(screen.ok && customAppLink(screen.app, 'Drishyam')).toContain('S.activity=com.example.films.MainActivity')
  })

  it('keeps the activity inside the package', () => {
    expect(parseCustomApp({ name: 'Films', androidPackage: 'com.example.films', activity: 'com.other.Evil', scope: 'all' }).ok).toBe(false)
    expect(parseCustomApp({ name: 'Films', activity: '.MainActivity', scope: 'all' })).toEqual({
      ok: false,
      error: 'Add the package name for this screen',
    })
  })
})

describe('appLinkFromParts', () => {
  it('builds an app link and puts the movie name in q', () => {
    const built = appLinkFromParts('FilmsApp', 'films.example', 'open')
    expect(built).toEqual({ ok: true, searchUrl: 'filmsapp://films.example/open?q={q}' })
    if (!built.ok) return
    const parsed = parseCustomApp({ name: 'Films', searchUrl: built.searchUrl, androidPackage: 'com.example.films', scope: 'all' })
    expect(parsed.ok && customAppLink(parsed.app, 'Drishyam', 2013)).toContain('scheme=filmsapp')
    expect(parsed.ok && customAppLink(parsed.app, 'Drishyam', 2013)).toContain('q=Drishyam%202013')
  })

  it('refuses a scheme or host on its own, and a blocked host', () => {
    expect(appLinkFromParts('filmsapp', '', '/open')).toEqual({ ok: false, error: 'Add both the scheme and the host' })
    expect(appLinkFromParts('javascript', 'films.example', '/open').ok).toBe(false)
    const ullu = appLinkFromParts('filmsapp', 'ullu.example', '/open')
    expect(ullu.ok).toBe(true)
    if (!ullu.ok) return
    expect(parseCustomApp({ name: 'Films', searchUrl: ullu.searchUrl, scope: 'all' }).ok).toBe(false)
  })
})

describe('links', () => {
  const app: CustomApp = { id: 'a1', ...draft }

  it('puts the encoded title (and year) where {q} is', () => {
    expect(customSearchUrl(app, 'Rang De Basanti', 2006)).toBe('https://films.example.com/search?q=Rang%20De%20Basanti%202006')
    expect(customSearchUrl(app, 'Tom & Jerry')).toBe('https://films.example.com/search?q=Tom%20%26%20Jerry')
  })

  it('opens the web search when no package is saved', () => {
    expect(customAppLink(app, 'Drishyam', 2013)).toBe(customSearchUrl(app, 'Drishyam', 2013))
  })

  it('sends the movie title to the installed app when a search link is saved', () => {
    const withPkg = { ...app, androidPackage: 'com.example.films' }
    const web = customSearchUrl(withPkg, 'Drishyam', 2013)
    expect(customAppLink(withPkg, 'Drishyam', 2013)).toBe(
      `intent://${new URL(web).host}${new URL(web).pathname}${new URL(web).search}#Intent;scheme=https;package=com.example.films;S.app_name=My%20Films;S.query=Drishyam%202013;S.browser_fallback_url=${encodeURIComponent(web)};end`,
    )
  })

  it('sends an app link, with the movie title filled in, to the installed package', () => {
    const result = parseCustomApp({
      name: 'Films',
      searchUrl: 'filmsapp://films.example/open?q={q}',
      androidPackage: 'com.example.films',
      activity: '.MainActivity',
      scope: 'all',
    })
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(customAppLink(result.app, 'Drishyam', 2013)).toBe(
      'intent://films.example/open?q=Drishyam%202013#Intent;scheme=filmsapp;package=com.example.films;S.app_name=Films;S.query=Drishyam%202013;S.screen=com.example.films.MainActivity;end',
    )
    expect(customAppLink(result.app, 'Drishyam', 2013)).not.toContain('S.activity=')
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

  it('keeps an app that has a package and no website', () => {
    const added = addCustomApp({ name: 'Pocket', searchUrl: '', androidPackage: 'com.pocket.app', scope: 'all' }, storage)
    expect(added.ok).toBe(true)
    expect(loadCustomApps(storage).map((a) => a.name)).toEqual(['Pocket'])
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
