import { expect, test, type Page } from '@playwright/test'

const FIRE_TV_UA =
  'Mozilla/5.0 (Linux; Android 9; AFTKA Build/PS7633; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/120.0 Mobile Safari/537.36'

async function openTvMovies(page: Page, opts: { shell: boolean }) {
  await page.addInitScript((shell) => {
    localStorage.setItem('willow-tv-mode', '1')
    const opened: string[] = []
    Object.defineProperty(window, '__opened', { value: opened })
    window.open = (url?: string | URL) => {
      opened.push(String(url))
      return null
    }
    if (shell) Object.defineProperty(window, 'Capacitor', { value: { isNativePlatform: () => true } })
  }, opts.shell)
  await page.goto('/#/login')
  await page.getByRole('button', { name: 'Sign in' }).click()
  await page.getByTestId('look-splash').waitFor({ state: 'hidden', timeout: 4000 }).catch(() => undefined)
  await expect(page.getByTestId('household-hub')).toBeVisible()
  await page.getByTestId('tv-strip-movies').click()
  await expect(page.getByTestId('tv-movie-watch').first()).toBeVisible()
}

async function watchNavigations(page: Page) {
  const urls: string[] = []
  const cdp = await page.context().newCDPSession(page)
  await cdp.send('Page.enable')
  cdp.on('Page.frameRequestedNavigation', (event) => urls.push(event.url))
  return urls
}

function opened(page: Page) {
  return page.evaluate(() => (window as unknown as { __opened: string[] }).__opened)
}

test.describe('Fire TV app shell', () => {
  test.use({ userAgent: `${FIRE_TV_UA} WillowIntents/1`, viewport: { width: 1280, height: 720 } })

  test('a movie launches the official app through its intent and never a blocked frame', async ({ page }) => {
    await openTvMovies(page, { shell: true })
    const navigations = await watchNavigations(page)
    await page.getByTestId('tv-movie-watch').first().click()
    await expect.poll(() => navigations.find((url) => url.startsWith('intent://'))).toBeTruthy()
    const intent = navigations.find((url) => url.startsWith('intent://')) ?? ''
    expect(intent).toMatch(/#Intent;scheme=https;package=[\w.]+;S\.browser_fallback_url=https%3A%2F%2F/)
    expect(intent).not.toMatch(/PIN|allerg|childId/i)
    await expect(page.getByTestId('watch-desk')).toHaveCount(0)
    await expect(page.locator('iframe')).toHaveCount(0)
    expect(await opened(page)).toEqual([])
    await expect(page.getByTestId('movies-page')).toBeVisible()
    await expect(page.getByTestId('return-banner')).toBeVisible()
  })
})

test.describe('Fire TV shell installed before intent support', () => {
  test.use({ userAgent: FIRE_TV_UA, viewport: { width: 1280, height: 720 } })

  test('a movie opens its Netflix title link or the official app page in the Fire TV Appstore', async ({ page }) => {
    await page.context().route(/^https:\/\/(www\.)?netflix\.com\//, (route) => route.abort())
    await openTvMovies(page, { shell: true })
    const navigations = await watchNavigations(page)
    await page.getByTestId('tv-movie-watch').first().click()
    await expect
      .poll(() => navigations.find((url) => url.startsWith('amzn://apps/android?p=') || /^https:\/\/netflix\.com\/title\/\d+$/.test(url)))
      .toBeTruthy()
    await expect(page.getByTestId('watch-desk')).toHaveCount(0)
    await expect(page.getByTestId('movies-page')).toBeVisible()
  })
})

test('TV mode in a desktop browser opens the official storefront in a new tab', async ({ page }) => {
  await openTvMovies(page, { shell: false })
  await page.getByTestId('tv-movie-watch').first().click()
  await expect.poll(() => opened(page)).toHaveLength(1)
  const [href] = await opened(page)
  expect(href).toMatch(/^https:\/\//)
  expect(href).not.toContain('intent:')
  await expect(page.getByTestId('watch-desk')).toHaveCount(0)
  await expect(page.locator('iframe')).toHaveCount(0)
  await expect(page.getByTestId('movies-page')).toBeVisible()
})
