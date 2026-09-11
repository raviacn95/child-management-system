import AxeBuilder from '@axe-core/playwright'
import { expect, test, type Page } from '@playwright/test'

async function loginDirector(page: Page) {
  await page.goto('/#/login')
  await page.getByRole('button', { name: 'Sign in' }).click()
  await expect(page.getByRole('heading', { name: /Today at a glance/i })).toBeVisible()
}

test('director home shows family meal planner panel', async ({ page }) => {
  await loginDirector(page)
  const panel = page.getByTestId('family-meals')
  await expect(panel.getByRole('heading', { name: 'Family meal planner' })).toBeVisible()
  await expect(panel.getByText(/Growth score/i)).toBeVisible()
})

test('meals page plans shared Indian plates and grocery', async ({ page }) => {
  await loginDirector(page)
  await page.goto('/#/meals')
  const planner = page.getByTestId('meal-planner')
  await expect(planner.getByRole('heading', { name: /Cook once/i })).toBeVisible()
  await expect(page.getByTestId('shared-meals')).toBeVisible()
  await page.getByRole('button', { name: 'Grocery list' }).click()
  await expect(page.getByTestId('grocery-list')).toBeVisible()
  await expect(page.getByTestId('grocery-list').locator('li').first()).toBeVisible()
})

test('meal planner is accessible', async ({ page }) => {
  await loginDirector(page)
  await page.goto('/#/meals')
  await expect(page.getByTestId('meal-planner')).toBeVisible()
  const results = await new AxeBuilder({ page }).include('[data-testid="meal-planner"]').analyze()
  expect(results.violations).toEqual([])
})
