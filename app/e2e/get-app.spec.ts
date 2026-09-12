import { expect, test } from '@playwright/test'

test('get the app downloads a laptop launcher and opens live Willow', async ({ page }) => {
  await page.goto('/#/get-app')
  await expect(page.getByTestId('get-app').getByRole('heading', { name: /Install Willow as an app/i })).toBeVisible()
  await expect(page.getByTestId('laptop-install')).toBeVisible()
  const downloadPromise = page.waitForEvent('download')
  const popupPromise = page.waitForEvent('popup')
  await page.getByTestId('pwa-install').click()
  const download = await downloadPromise
  expect(download.suggestedFilename()).toMatch(/Willow-Live-App/i)
  const popup = await popupPromise
  await expect.poll(() => popup.url()).toMatch(/raviacn95\.github\.io\/child-management-system/)
  await expect(page.getByTestId('laptop-install-help')).toContainText(/Downloaded/i)
  await expect(page.getByTestId('phone-apk-download')).toHaveAttribute(
    'href',
    'https://raviacn95.github.io/child-management-system/downloads/willow.apk',
  )
  await expect(page.getByTestId('apk-download')).toHaveAttribute(
    'href',
    'https://raviacn95.github.io/child-management-system/downloads/willow-movies.apk',
  )
})

test('login page links to get the app without signing in', async ({ page }) => {
  await page.goto('/#/login')
  await page.getByTestId('get-app-login-cta').click()
  await expect(page.getByTestId('get-app')).toBeVisible()
})

test('signed-in header opens get the app', async ({ page }) => {
  await page.goto('/#/login')
  await page.getByRole('button', { name: 'Sign in' }).click()
  await expect(page.getByRole('heading', { name: /Today at a glance/i })).toBeVisible()
  await page.getByTestId('header-get-app').click()
  await expect(page.getByTestId('get-app')).toBeVisible()
  await expect(page.getByRole('link', { name: /Open Willow/i })).toBeVisible()
})

test('settings can drop a stuck live cache', async ({ page }) => {
  await page.goto('/#/login')
  await page.getByRole('button', { name: 'Sign in' }).click()
  await expect(page.getByRole('heading', { name: /Today at a glance/i })).toBeVisible()
  await page.goto('/#/settings')
  await expect(page.getByTestId('live-update')).toBeVisible()
  await expect(page.getByTestId('use-latest-willow')).toBeVisible()
})
