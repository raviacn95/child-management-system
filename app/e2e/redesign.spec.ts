import { expect, test, type Page } from '@playwright/test'

async function signIn(page: Page) {
  await page.goto('/#/login')
  await page.getByRole('button', { name: 'Sign in' }).click()
  await page.getByTestId('look-splash').waitFor({ state: 'hidden', timeout: 4000 }).catch(() => undefined)
}

test.describe('phone', () => {
  test.use({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true })

  test('bottom tabs sit within thumb reach and switch pages', async ({ page }) => {
    await signIn(page)
    const tabs = page.getByTestId('phone-tabs')
    await expect(tabs).toBeVisible()
    const box = await tabs.boundingBox()
    expect(box!.y + box!.height).toBeGreaterThan(800)
    await expect(tabs.getByRole('link')).toHaveCount(4)
    await expect(tabs.getByRole('link', { name: 'Home' })).toHaveAttribute('aria-current', 'page')
    await tabs.getByRole('link', { name: 'Movies' }).click()
    await expect(page.getByTestId('movies-page')).toBeVisible()
    await expect(tabs.getByRole('link', { name: 'Movies' })).toHaveAttribute('aria-current', 'page')
  })

  test('header keeps only menu, search and alerts; the rest lives in the menu', async ({ page }) => {
    await signIn(page)
    await expect(page.getByTestId('open-search')).toBeVisible()
    await expect(page.getByTestId('header-update')).toBeHidden()
    await expect(page.getByTestId('mobile-quick-nav')).toHaveCount(0)
    await page.getByTestId('phone-tab-more').click()
    const nav = page.getByTestId('app-nav')
    await expect(nav).toBeInViewport()
    await expect(nav.getByRole('heading', { name: 'Watch & learn' })).toBeVisible()
    await expect(nav.getByTestId('drawer-update')).toBeVisible()
    await expect(nav.getByTestId('drawer-get-app')).toBeVisible()
  })

  test('home stats sit two to a row', async ({ page }) => {
    await signIn(page)
    const stats = page.locator('.ui-stat')
    const first = await stats.nth(0).boundingBox()
    const second = await stats.nth(1).boundingBox()
    expect(Math.abs(first!.y - second!.y)).toBeLessThan(4)
  })
})

test.describe('Fire TV', () => {
  test.use({ viewport: { width: 960, height: 540 } })

  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => localStorage.setItem('willow-tv-mode', '1'))
    await signIn(page)
  })

  test('one compact top bar replaces the phone header', async ({ page }) => {
    const bar = page.getByTestId('tv-topbar')
    await expect(bar).toBeVisible()
    await expect(bar.getByTestId('tv-clock')).toHaveText(/\d{1,2}:\d{2}/)
    await expect(page.getByTestId('header-update')).toHaveCount(0)
    const box = await bar.boundingBox()
    expect(box!.height).toBeLessThan(110)
  })

  test('the current section keeps remote focus after switching pages', async ({ page }) => {
    await page.getByTestId('tv-strip-movies').click()
    await expect(page.getByTestId('movies-page')).toBeVisible()
    await expect(page.getByTestId('tv-strip-movies')).toBeFocused()
  })

  test('hub tiles are big posters with no long text blocks', async ({ page }) => {
    await page.goto('/#/hub')
    await expect(page.getByTestId('household-hub')).toBeVisible()
    await expect(page.getByTestId('weekly-digest')).toHaveCount(0)
    const tile = page.locator('.hub-tile').first()
    await expect(tile.locator('svg')).toBeVisible()
    const box = await tile.boundingBox()
    expect(box!.height).toBeGreaterThan(150)
  })
})
