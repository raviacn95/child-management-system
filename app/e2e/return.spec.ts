import { expect, test, type Page } from '@playwright/test'

async function loginDirector(page: Page) {
  await page.addInitScript(() => {
    const opened: string[] = []
    Object.defineProperty(window, '__opened', { value: opened })
    window.open = (url?: string | URL) => {
      opened.push(String(url))
      return null
    }
  })
  await page.goto('/#/login')
  await page.getByRole('button', { name: 'Sign in' }).click()
  await expect(page.getByRole('heading', { name: /Today at a glance/i })).toBeVisible()
}

function opened(page: Page) {
  return page.evaluate(() => (window as unknown as { __opened: string[] }).__opened)
}

test('official app launch keeps Willow and the return banner restores movies', async ({ page }) => {
  await loginDirector(page)
  await page.goto('/#/movies')
  await expect(page.getByTestId('movies-page')).toBeVisible()
  const pagesBefore = page.context().pages().length
  await page
    .getByTestId('movie-watch')
    .getByRole('link', { name: /Amazon Prime Video|Google Play Movies|SonyLIV|JustWatch|Netflix/ })
    .first()
    .click()
  await expect(page.getByTestId('watch-desk')).toHaveCount(0)
  expect(page.context().pages().length).toBe(pagesBefore)
  expect(await opened(page)).toEqual([expect.stringMatching(/^https:\/\//)])
  await expect(page.getByTestId('return-banner')).toBeVisible()
  await expect(page.getByTestId('movies-page')).toBeVisible()
  await expect(page.getByTestId('return-banner')).not.toContainText(/PIN|allerg|@/i)
  await expect(page.getByTestId('return-stop')).toHaveCount(0)
  await page.getByTestId('return-keep').click()
  await expect(page.getByTestId('return-banner')).toHaveCount(0)
  await expect(page.getByTestId('movies-page')).toBeVisible()
})

test('Return now on the banner restores the last screen', async ({ page }) => {
  await loginDirector(page)
  await page.goto('/#/movies')
  await expect(page.getByTestId('movies-page')).toBeVisible()
  await page
    .getByTestId('movie-watch')
    .getByRole('link', { name: /Amazon Prime Video|Google Play Movies|SonyLIV|JustWatch|Netflix/ })
    .first()
    .click()
  await expect(page.getByTestId('return-banner')).toBeVisible()
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

test('learning channels open the official YouTube page in a new tab instead of a blocked frame', async ({ page }) => {
  await loginDirector(page)
  await page.goto('/#/learning?band=5-8')
  await page.getByTestId('open-channel').first().click()
  expect(await opened(page)).toEqual([expect.stringMatching(/^https:\/\/www\.youtube\.com\//)])
  await expect(page.getByTestId('watch-desk')).toHaveCount(0)
  await expect(page.getByTestId('channel-pack')).toBeVisible()
})
