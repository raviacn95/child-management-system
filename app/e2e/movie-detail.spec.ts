import { expect, test, type Page } from '@playwright/test'

async function loginDirector(page: Page) {
  await page.goto('/#/login')
  await page.getByRole('button', { name: 'Sign in' }).click()
  await expect(page.getByRole('heading', { name: /Today at a glance/i })).toBeVisible()
}

test('movies and TV reveal a summary only after the title is opened', async ({ page }) => {
  await loginDirector(page)
  await page.goto('/#/movies')
  await expect(page.getByTestId('movie-card')).toHaveCount(100)
  await expect(page.getByTestId('movie-summary')).toHaveCount(0)
  await page.getByTestId('movie-open').first().click()
  await expect(page.getByTestId('movie-detail')).toBeVisible()
  await expect(page.getByTestId('movie-summary')).toBeVisible()
  await expect(page.getByTestId('movie-back')).toBeVisible()
  await expect(page.getByTestId('movie-detail')).not.toContainText(/Amazon Prime Video|Netflix|JustWatch|Score |Critics/i)
  await page.getByTestId('movie-back').click()
  await expect(page.getByTestId('movie-detail')).toHaveCount(0)
  await expect(page.getByTestId('movie-card')).toHaveCount(100)

  await page.goto('/#/tv')
  await expect(page.getByTestId('tv-home')).toBeVisible()
  await expect(page.getByTestId('movie-summary')).toHaveCount(0)
  await page.getByTestId('movie-open').first().click()
  await expect(page.getByTestId('movie-summary')).toBeVisible()
  await expect(page.getByTestId('movie-detail')).not.toContainText(/Amazon Prime Video|Netflix|JustWatch|Score /i)
  await page.getByTestId('movie-back').click()
  await expect(page.getByTestId('movie-summary')).toHaveCount(0)
})
