import { expect, test } from '@playwright/test'

test.use({
  viewport: { width: 390, height: 844 },
  userAgent:
    'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Mobile Safari/537.36',
  isMobile: true,
  hasTouch: true,
})

test('phone live app signs in and uses a drawer instead of a stuck sidebar', async ({ page }) => {
  await page.goto('/#/login')
  await page.getByRole('button', { name: 'Sign in' }).click()
  await expect(page.getByRole('heading', { name: /Today at a glance/i })).toBeVisible()
  await expect(page.getByTestId('open-nav')).toBeVisible()
  await expect(page.getByTestId('app-nav')).not.toBeInViewport()
  await page.getByTestId('open-nav').click()
  await expect(page.getByTestId('app-nav').getByRole('link', { name: 'Movies' })).toBeVisible()
  await page.getByTestId('app-nav').getByRole('link', { name: 'Movies' }).click()
  await expect(page.getByTestId('movies-page')).toBeVisible()
  await expect(page.getByTestId('movie-card').first()).toBeVisible()
})

test('phone get-the-app stays on this page and does not download a desktop launcher', async ({ page }) => {
  await page.goto('/#/get-app')
  await expect(page.getByTestId('get-app')).toBeVisible()
  const download = page.waitForEvent('download', { timeout: 1500 }).then(() => 'downloaded').catch(() => 'none')
  const popup = page.waitForEvent('popup', { timeout: 1500 }).then(() => 'popup').catch(() => 'none')
  await page.getByTestId('pwa-install').click()
  expect(await download).toBe('none')
  expect(await popup).toBe('none')
  await expect(page.getByTestId('laptop-install-help')).toContainText(/Home Screen/i)
  await expect(page).toHaveURL(/get-app/)
})
