import { expect, test, type Page } from '@playwright/test'

async function loginDirector(page: Page) {
  await page.goto('/#/login')
  await page.getByRole('button', { name: 'Sign in' }).click()
  await expect(page.getByRole('heading', { name: /Today at a glance/i })).toBeVisible()
}

test('home shows today’s horizon tasks', async ({ page }) => {
  await loginDirector(page)
  const panel = page.getByTestId('horizons-panel')
  await expect(panel.getByRole('heading', { name: 'Today’s horizons' })).toBeVisible()
  await expect(panel.getByText('Leo', { exact: false }).first()).toBeVisible()
})

test('grow skills map to horizon activities and horizons tab lists five', async ({ page }) => {
  await loginDirector(page)
  await page.goto('/#/grow?tab=horizons')
  const block = page.getByTestId('horizon-activities')
  await expect(block.getByRole('heading', { name: /Horizon plan/i })).toBeVisible()
  await expect(page.getByTestId('horizon-today')).toBeVisible()
  await expect(block.locator('li.card, .card').first()).toBeVisible()
  await page.getByRole('button', { name: '10 skills' }).click()
  await expect(page.getByTestId('skill-activity-language')).toBeVisible()
})
