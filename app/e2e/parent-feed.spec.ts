import { expect, test, type Page } from '@playwright/test'

async function loginDirector(page: Page) {
  await page.goto('/#/login')
  await page.getByRole('button', { name: 'Sign in' }).click()
  await expect(page.getByRole('heading', { name: /Today at a glance/i })).toBeVisible()
}

test('home shows parent growth feed panel', async ({ page }) => {
  await loginDirector(page)
  await expect(page.getByTestId('parent-feed-panel').getByRole('heading', { name: 'Parent growth feed' })).toBeVisible()
})

test('parent feed page has daily playlist and weekly deep dive', async ({ page }) => {
  await loginDirector(page)
  await page.goto('/#/parent-feed')
  await expect(page.getByTestId('parent-feed').getByRole('heading', { name: 'Parent growth feed' })).toBeVisible()
  await expect(page.getByTestId('parent-daily')).toBeVisible()
  await expect(page.getByTestId('parent-weekly')).toBeVisible()
  await expect(page.getByTestId('movie-shelf')).toBeVisible()
  await expect(page.getByTestId('movie-count')).toContainText('Showing 100 titles')
  await expect(page.getByTestId('movie-card').first()).toBeVisible()
  await expect(page.getByRole('button', { name: 'Malayalam' })).toBeVisible()
})

test('movies page shows a shuffled 100 with official watch links', async ({ page }) => {
  await loginDirector(page)
  await page.goto('/#/movies')
  await expect(page.getByTestId('movies-page').getByRole('heading', { name: /100 movies/i })).toBeVisible()
  await expect(page.getByTestId('movie-count')).toContainText('Showing 100 titles')
  await expect(page.getByTestId('movie-card')).toHaveCount(100)
  await expect(page.getByRole('link', { name: /Amazon Prime Video|Google Play Movies|SonyLIV|JustWatch/ }).first()).toBeVisible()
  await page.getByRole('button', { name: 'Shuffle 100 titles' }).click()
  await expect(page.getByTestId('movie-count')).toContainText('Showing 100 titles')
  await page.getByRole('button', { name: 'Malayalam' }).click()
  await expect(page.getByTestId('movie-count')).toContainText('original Malayalam')
  await expect(page.getByTestId('originals-only')).toContainText('Original Malayalam only')
  await expect(page.getByText('Papanasam')).toHaveCount(0)
})

test('OTT vault saves a channel for this Willow user', async ({ page }) => {
  await loginDirector(page)
  await page.goto('/#/ott')
  await expect(page.getByTestId('ott-hub')).toBeVisible()
  await page.getByLabel('Account email / ID (reminder only)').fill('family@prime.example')
  await page.getByRole('button', { name: 'Save to my vault' }).click()
  await expect(page.getByTestId('ott-card')).toContainText('Amazon Prime Video')
  await expect(page.getByTestId('ott-card')).toContainText('family@prime.example')
})

test('erotic shelf is 18+ gated and shows 150 official titles', async ({ page }) => {
  await loginDirector(page)
  await page.goto('/#/movies')
  await page.getByTestId('erotic-link').click()
  await expect(page.getByTestId('erotic-gate')).toBeVisible()
  await page.getByRole('button', { name: /I am 18\+/i }).click()
  await expect(page.getByTestId('erotic-page')).toBeVisible()
  await expect(page.getByTestId('erotic-count')).toContainText('Showing 150 titles')
  await expect(page.getByTestId('erotic-card')).toHaveCount(150)
  await expect(page.getByRole('link', { name: /Amazon Prime Video|Netflix|MUBI|JustWatch|Google Play Movies/ }).first()).toBeVisible()
  await page.getByRole('button', { name: 'Bengali' }).click()
  await expect(page.getByTestId('erotic-count')).toContainText('original Bengali')
  await expect(page.getByText('Belle de Jour')).toHaveCount(0)
  await expect(page.getByText('Chokher Bali')).toBeVisible()
})
