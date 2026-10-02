import { expect, test, type Page } from '@playwright/test'

const FIRE_TV_UA =
  'Mozilla/5.0 (Linux; Android 9; AFTKA Build/PS7633; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/120.0 Mobile Safari/537.36'
const NETFLIX_ID = '81999999'
const TITLE_PAGE = `https://www.netflix.com/title/${NETFLIX_ID}`
const year = new Date().getFullYear()
const daysAgo = (days: number) => new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)

const feed = {
  schemaVersion: 1,
  generatedAt: new Date().toISOString(),
  year,
  source: 'Wikidata (CC0); streaming data: JustWatch via TMDB',
  titles: [
    {
      id: 'wd-Q301',
      qid: 'Q301',
      title: 'Kites Over Kochi',
      year,
      released: daysAgo(70),
      lang: 'ml',
      india: true,
      sitelinks: 5,
      providersSource: 'tmdb',
      providers: [
        { platformId: 'netflix', kind: 'stream' },
        { platformId: 'manoramamax', kind: 'stream' },
      ],
      watchIds: { netflix: NETFLIX_ID },
    },
  ],
}

async function open(page: Page, opts: { tv: boolean; shell: boolean }) {
  await page.context().route(/movies-fresh\.json/, (route) => route.fulfill({ json: feed }))
  await page.addInitScript(({ tv, shell }) => {
    if (tv) localStorage.setItem('willow-tv-mode', '1')
    const opened: string[] = []
    Object.defineProperty(window, '__opened', { value: opened })
    window.open = (url?: string | URL) => {
      opened.push(String(url))
      return null
    }
    if (shell) Object.defineProperty(window, 'Capacitor', { value: { isNativePlatform: () => true } })
  }, opts)
  await page.goto('/#/login')
  await page.getByRole('button', { name: 'Sign in' }).click()
  await page.getByTestId('look-splash').waitFor({ state: 'hidden', timeout: 4000 }).catch(() => undefined)
  await page.goto('/#/movies')
  await expect(page.getByTestId('fresh-row')).toBeVisible()
}

function opened(page: Page) {
  return page.evaluate(() => (window as unknown as { __opened: string[] }).__opened)
}

async function watchNavigations(page: Page) {
  const urls: string[] = []
  const cdp = await page.context().newCDPSession(page)
  await cdp.send('Page.enable')
  cdp.on('Page.frameRequestedNavigation', (event) => urls.push(event.url))
  return urls
}

test('a desktop click on Netflix opens the movie’s own Netflix page in a new tab, not a search', async ({ page }) => {
  await open(page, { tv: false, shell: false })
  const card = page.getByTestId('fresh-card').filter({ hasText: 'Kites Over Kochi' })
  await card.getByRole('button', { name: 'Watch Kites Over Kochi on Netflix' }).click()
  await expect.poll(() => opened(page)).toEqual([TITLE_PAGE])
  await expect(page.getByTestId('watch-desk')).toHaveCount(0)
})

test.describe('Fire TV app shell with intent support', () => {
  test.use({ userAgent: `${FIRE_TV_UA} WillowIntents/1`, viewport: { width: 1280, height: 720 } })

  test('Netflix opens the title in the Netflix TV app with source=30 and the title page as fallback', async ({ page }) => {
    await open(page, { tv: true, shell: true })
    const navigations = await watchNavigations(page)
    const card = page.getByTestId('fresh-card').filter({ hasText: 'Kites Over Kochi' })
    await card.getByRole('button', { name: 'Watch Kites Over Kochi on Netflix' }).click()
    await expect.poll(() => navigations.find((url) => url.startsWith('intent://'))).toBeTruthy()
    const intent = navigations.find((url) => url.startsWith('intent://')) ?? ''
    expect(intent).toBe(
      `intent://www.netflix.com/title/${NETFLIX_ID}#Intent;scheme=https;package=com.netflix.ninja;S.browser_fallback_url=${encodeURIComponent(TITLE_PAGE)};S.source=30;end`,
    )
    expect(intent).not.toMatch(/PIN|allerg|childId/i)
    expect(await opened(page)).toEqual([])
    await expect(page.getByTestId('watch-desk')).toHaveCount(0)
  })

  test('TV movie cards say whether Watch opens the movie or just the app', async ({ page }) => {
    await open(page, { tv: true, shell: true })
    const hints = page.getByTestId('tv-movie-opens')
    await expect(hints.first()).toBeVisible()
    for (const text of await hints.allTextContents()) expect(['Opens the movie', 'Opens the app', 'Opens search']).toContain(text)
  })
})

test.describe('Fire TV shell installed before intent support', () => {
  test.use({ userAgent: FIRE_TV_UA, viewport: { width: 1280, height: 720 } })

  test('Netflix hands the verified title link to Android instead of the Appstore page', async ({ page }) => {
    await page.context().route(/^https:\/\/(www\.)?netflix\.com\//, (route) => route.abort())
    await open(page, { tv: true, shell: true })
    const navigations = await watchNavigations(page)
    const card = page.getByTestId('fresh-card').filter({ hasText: 'Kites Over Kochi' })
    await card.getByRole('button', { name: 'Watch Kites Over Kochi on Netflix' }).click()
    await expect.poll(() => navigations).toContain(`https://netflix.com/title/${NETFLIX_ID}`)
    expect(navigations.some((url) => url.startsWith('amzn://'))).toBe(false)
  })
})
