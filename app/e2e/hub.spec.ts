import { expect, test, type Page } from '@playwright/test'

async function loginDirector(page: Page) {
  await page.goto('/#/login')
  await page.getByRole('button', { name: 'Sign in' }).click()
  await expect(page.getByRole('heading', { name: /Today at a glance/i })).toBeVisible()
  await page.getByTestId('look-splash').waitFor({ state: 'hidden', timeout: 3000 }).catch(() => undefined)
}

test('household hub mixes learning, parent growth, and family movies', async ({ page }) => {
  await loginDirector(page)
  await page.goto('/#/hub')
  await expect(page.getByTestId('household-hub')).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Household Hub' })).toBeVisible()
  await expect(page.getByTestId('hub-row-learning')).toContainText(/Learning Tonight/)
  await expect(page.getByTestId('hub-row-movies')).toContainText(/Family movies/)
  await expect(page.getByTestId('hub-row-top-picks')).toBeVisible()
  await expect(page.getByTestId('hub-row-top-picks')).toContainText(/Shawshank|Stranger Things|Godfather/)
  await expect(page.getByTestId('hub-row-parenting')).toContainText(/Parenting Tips/)
  await expect(page.getByTestId('hub-row-shopping')).toBeVisible()
  await expect(page.getByTestId('hub-row-shopping')).toContainText(/essentials|wipes|chana|poncho|soap/i)
  await expect(page.getByTestId('weekly-digest')).toBeVisible()
})

test('smart search finds learning from the header', async ({ page }) => {
  await loginDirector(page)
  await page.getByTestId('open-search').click()
  await expect(page.getByTestId('command-palette')).toBeVisible()
  await page.getByTestId('command-query').fill('learn')
  await expect(page.getByTestId('command-palette')).toContainText(/Learning/)
})
