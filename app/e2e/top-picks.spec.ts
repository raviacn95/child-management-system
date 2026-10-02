import { expect, test, type Page } from '@playwright/test'

async function loginDirector(page: Page) {
  await page.goto('/#/login')
  await page.getByRole('button', { name: 'Sign in' }).click()
  await expect(page.getByRole('heading', { name: /Today at a glance/i })).toBeVisible()
  await page.getByTestId('look-splash').waitFor({ state: 'hidden', timeout: 3000 }).catch(() => undefined)
}

async function stubStorefronts(page: Page) {
  await page.context().route(/^https:\/\//, (route) =>
    route.request().resourceType() === 'document'
      ? route.fulfill({ contentType: 'text/html', body: '<title>Official storefront</title>' })
      : route.continue(),
  )
}

test('home, movies, and TV show the cited top-picks feed', async ({ page }) => {
  await loginDirector(page)
  await expect(page.getByTestId('top-picks').first()).toBeVisible()
  await expect(page.getByTestId('top-pick-card')).toHaveCount(10)
  await expect(page.getByTestId('top-picks')).toContainText('The Shawshank Redemption')
  await expect(page.getByTestId('top-picks')).toContainText('Breaking Bad')
  await page.getByTestId('top-pick-open').first().click()
  await expect(page.getByTestId('top-pick-summary')).toBeVisible()
  await expect(page.getByTestId('top-pick-detail')).not.toContainText(/Amazon Prime Video|Netflix|JustWatch|Why watch/i)
  await page.getByTestId('top-pick-back').click()
  await expect(page.getByTestId('top-pick-summary')).toHaveCount(0)

  await page.goto('/#/movies')
  await expect(page.getByTestId('top-picks')).toBeVisible()
  await expect(page.getByTestId('top-pick-card')).toHaveCount(10)
  await expect(page.getByTestId('movie-card')).toHaveCount(100)
  await stubStorefronts(page)
  const popup = page.context().waitForEvent('page')
  await page
    .getByTestId('top-pick-watch')
    .first()
    .getByRole('button', { name: /Amazon Prime Video|Netflix|Google Play Movies|JustWatch/ })
    .first()
    .click()
  const storefront = await popup
  expect(storefront.url()).toMatch(/^https:\/\//)
  await storefront.close()
  await expect(page.getByTestId('watch-desk')).toHaveCount(0)
  await expect(page.getByTestId('top-picks')).toBeVisible()

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
