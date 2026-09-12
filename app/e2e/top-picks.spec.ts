import { expect, test, type Page } from '@playwright/test'

async function loginDirector(page: Page) {
  await page.goto('/#/login')
  await page.getByRole('button', { name: 'Sign in' }).click()
  await expect(page.getByRole('heading', { name: /Today at a glance/i })).toBeVisible()
  await page.getByTestId('look-splash').waitFor({ state: 'hidden', timeout: 3000 }).catch(() => undefined)
}

test('home, movies, and TV show the cited top-picks feed', async ({ page }) => {
  await loginDirector(page)
  await expect(page.getByTestId('top-picks').first()).toBeVisible()
  await expect(page.getByTestId('top-pick-card')).toHaveCount(10)
  await expect(page.getByTestId('top-picks')).toContainText('The Shawshank Redemption')
  await expect(page.getByTestId('top-picks')).toContainText('Breaking Bad')
  await expect(page.getByTestId('why-to-watch')).toHaveCount(0)
  await page.getByTestId('top-pick-open').first().click()
  await expect(page.getByTestId('why-to-watch').first()).toContainText(/Why watch/)
  await expect(page.getByTestId('top-pick-summary')).toBeVisible()
  await page.getByTestId('top-pick-back').click()
  await expect(page.getByTestId('top-pick-summary')).toHaveCount(0)

  await page.goto('/#/movies')
  await expect(page.getByTestId('top-picks')).toBeVisible()
  await expect(page.getByTestId('top-pick-card')).toHaveCount(10)
  await expect(page.getByTestId('movie-card')).toHaveCount(100)
  const pagesBefore = page.context().pages().length
  await page.getByTestId('top-pick-open').first().click()
  await page.getByTestId('top-pick-card').first().getByRole('button', { name: /Amazon Prime Video|Netflix|Google Play Movies|JustWatch/ }).first().click()
  await expect(page.getByTestId('watch-desk')).toBeVisible()
  expect(page.context().pages().length).toBe(pagesBefore)
  await page.getByTestId('watch-close').click()

  await page.goto('/#/tv')
  await expect(page.getByTestId('tv-home')).toBeVisible()
  await expect(page.getByTestId('top-picks')).toBeVisible()
  await expect(page.getByTestId('top-pick-card')).toHaveCount(10)
})

test('Arcade look leads the feed with Stranger Things', async ({ page }) => {
  await page.goto('/#/login')
  await page.getByTestId('look-arcade').click()
  await page.getByRole('button', { name: 'Sign in' }).click()
  await expect(page.getByRole('heading', { name: /Today at a glance/i })).toBeVisible()
  await page.getByTestId('look-splash').waitFor({ state: 'hidden', timeout: 3000 }).catch(() => undefined)
  await expect(page.getByTestId('top-pick-card').first()).toContainText('Stranger Things')
})
