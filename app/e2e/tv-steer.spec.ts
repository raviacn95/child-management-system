import { expect, test, type Page } from '@playwright/test'

async function loginOnTv(page: Page) {
  await page.addInitScript(() => {
    localStorage.setItem('willow-tv-mode', '1')
  })
  await page.goto('/#/login')
  await page.getByRole('button', { name: 'Sign in' }).click()
  await page.getByTestId('look-splash').waitFor({ state: 'hidden', timeout: 4000 }).catch(() => undefined)
  await expect(page.getByTestId('household-hub')).toBeVisible()
}

test('TV Home steers to Movies then TV tonight with simple living-room shelves', async ({ page }) => {
  await loginOnTv(page)
  await expect(page).toHaveURL(/#\/hub/)
  await expect(page.getByTestId('tv-strip')).toBeVisible()
  await expect(page.getByTestId('tv-strip-movies')).toBeVisible()
  await expect(page.getByTestId('tv-strip-tv')).toBeVisible()
  await expect(page.getByTestId('tv-strip-shop')).toHaveCount(0)
  await expect(page.getByTestId('hub-row-watch')).toContainText(/Movies/)
  await expect(page.getByTestId('hub-row-watch')).toContainText(/TV tonight/)
  await page.getByTestId('tv-strip-movies').click()
  await expect(page.getByTestId('movies-page')).toBeVisible()
  await expect(page.getByTestId('tv-movie-shelf')).toBeVisible()
  await expect(page.getByTestId('tv-movie-card').first()).toBeVisible()
  await expect(page.getByTestId('tv-movie-watch').first()).toBeVisible()
  await expect(page.getByTestId('tv-movie-trailer').first()).toBeVisible()
  await expect(page.getByTestId('movie-shelf')).toHaveCount(0)
  await expect(page.getByTestId('top-picks')).toHaveCount(0)
  await expect(page.getByTestId('movies-to-tv')).toBeVisible()
  await page.getByTestId('tv-movie-shelf').getByRole('button', { name: 'Malayalam', exact: true }).click()
  await expect(page.getByTestId('tv-movie-card').first()).toContainText('Malayalam')
  await page.getByTestId('tv-strip-tv').click()
  await expect(page.getByTestId('tv-home')).toBeVisible()
  await expect(page.getByTestId('tv-movie-shelf')).toBeVisible()
  await expect(page.getByTestId('top-picks')).toHaveCount(0)
})
