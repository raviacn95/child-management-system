import { expect, test, type Page } from '@playwright/test'

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => localStorage.clear())
})

async function loginDirector(page: Page) {
  await page.goto('/#/login')
  await page.getByRole('button', { name: 'Sign in' }).click()
  await expect(page.getByRole('heading', { name: /Today at a glance/i })).toBeVisible()
  await page.getByTestId('look-splash').waitFor({ state: 'hidden', timeout: 3000 }).catch(() => undefined)
}

test('director close checklist lives on billing and reports', async ({ page }) => {
  await loginDirector(page)
  await expect(page.getByTestId('close-month-card')).toBeVisible()
  await page.getByRole('link', { name: 'Open close checklist' }).click()
  await expect(page).toHaveURL(/#\/billing/)
  const panel = page.getByTestId('close-month')
  await expect(panel).toBeVisible()
  await expect(panel).toContainText(/not tax or accounting advice/i)
  await expect(page.getByTestId('close-task-lock-attendance')).toBeVisible()
  await page.getByTestId('close-task-lock-attendance-done').click()
  await expect(page.getByTestId('close-task-lock-attendance')).toHaveAttribute('data-status', 'complete')
  await expect(page.getByTestId('close-lock')).toBeDisabled()

  await page.goto('/#/reports')
  await expect(page.getByTestId('close-month-card')).toContainText(/1\/9|Locked/)
})

test('Ask Willow opens billing for close month without calling the AI', async ({ page }) => {
  let aiCalls = 0
  await page.context().route('**/qc-api/agent', (route) => {
    aiCalls += 1
    return route.fulfill({ status: 500, body: '{}' })
  })
  await loginDirector(page)
  await page.getByTestId('open-search').click()
  await expect(page.getByTestId('command-palette')).toBeVisible()
  await page.getByTestId('command-query').fill('close month')
  await page.getByTestId('command-query').press('Enter')
  await expect(page).toHaveURL(/#\/billing/)
  await expect(page.getByTestId('close-month')).toBeVisible()
  expect(aiCalls).toBe(0)
})

test('parents do not see the close checklist on fees', async ({ page }) => {
  await page.goto('/#/login')
  await page.getByRole('button', { name: /Parent/i }).click()
  await page.getByRole('button', { name: 'Sign in' }).click()
  await page.getByTestId('look-splash').waitFor({ state: 'hidden', timeout: 3000 }).catch(() => undefined)
  await page.goto('/#/billing')
  await expect(page.getByRole('heading', { name: 'Fees & GST' })).toBeVisible()
  await expect(page.getByTestId('close-month')).toHaveCount(0)
})
