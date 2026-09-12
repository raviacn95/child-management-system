import { expect, test, type Page } from '@playwright/test'

async function loginDirector(page: Page) {
  await page.addInitScript(() => {
    window.open = () => null
  })
  await page.goto('/#/login')
  await page.getByRole('button', { name: 'Sign in' }).click()
  await expect(page.getByRole('heading', { name: /Today at a glance/i })).toBeVisible()
}

test('official app launch keeps Willow and the return banner restores movies', async ({ page }) => {
  await loginDirector(page)
  await page.goto('/#/movies')
  await expect(page.getByTestId('movies-page')).toBeVisible()
  const pagesBefore = page.context().pages().length
  await page
    .getByTestId('movie-watch')
    .first()
    .getByRole('link', { name: /Amazon Prime Video|Google Play Movies|SonyLIV|JustWatch|Netflix/ })
    .first()
    .click()
  await expect(page.getByTestId('watch-desk')).toBeVisible()
  expect(page.context().pages().length).toBe(pagesBefore)
  await page.getByTestId('watch-official').click()
  await expect(page.getByTestId('watch-desk')).toHaveCount(0)
  await expect(page.getByTestId('return-banner')).toBeVisible()
  await expect(page.getByTestId('movies-page')).toBeVisible()
  await expect(page.getByTestId('return-banner')).not.toContainText(/PIN|allerg|@/i)
  await page.getByTestId('return-now').click()
  await expect(page.getByTestId('return-banner')).toHaveCount(0)
  await expect(page.getByTestId('movies-page')).toBeVisible()
})

test('return callback hash restores the last screen', async ({ page }) => {
  await loginDirector(page)
  await page.goto('/#/movies')
  await expect(page.getByTestId('movies-page')).toBeVisible()
  const token = 'ab'.repeat(16)
  await page.evaluate(({ token }) => {
    const record = {
      token,
      screen: '/movies',
      label: 'Prime Video',
      title: 'Drishyam',
      expiresAt: Date.now() + 60_000,
    }
    sessionStorage.setItem('willow-return-v1', JSON.stringify([record]))
    sessionStorage.setItem('willow-last-screen', '/movies')
  }, { token })
  await page.goto(`/#/return?token=${token}`)
  await expect(page.getByTestId('movies-page')).toBeVisible()
  await expect(page.getByTestId('return-page')).toHaveCount(0)
})

test('expired return token falls back without leaving Willow', async ({ page }) => {
  await loginDirector(page)
  await page.goto('/#/learning')
  await expect(page.getByTestId('channel-pack')).toBeVisible()
  const token = 'cd'.repeat(16)
  await page.evaluate(({ token }) => {
    sessionStorage.setItem(
      'willow-return-v1',
      JSON.stringify([{ token, screen: '/movies', label: 'YouTube', title: 'Pack', expiresAt: Date.now() - 1000 }]),
    )
    sessionStorage.setItem('willow-last-screen', '/learning')
  }, { token })
  await page.goto(`/#/return?token=${token}`)
  await expect(page.getByTestId('channel-pack')).toBeVisible()
})

test('learning channels open in the watch desk instead of a new tab', async ({ page }) => {
  await loginDirector(page)
  await page.goto('/#/learning?band=5-8')
  const pagesBefore = page.context().pages().length
  await page.getByTestId('open-channel').first().click()
  await expect(page.getByTestId('watch-desk')).toBeVisible()
  expect(page.context().pages().length).toBe(pagesBefore)
  await page.getByTestId('watch-close').click()
  await expect(page.getByTestId('watch-desk')).toHaveCount(0)
  await expect(page.getByTestId('channel-pack')).toBeVisible()
})
