import { expect, test, type Page } from '@playwright/test'

async function loginDirector(page: Page) {
  await page.addInitScript(() => {
    window.open = () => null
  })
  await page.goto('/#/login')
  await page.getByRole('button', { name: 'Sign in' }).click()
  await expect(page.getByRole('heading', { name: /Today at a glance/i })).toBeVisible()
  await page.getByTestId('look-splash').waitFor({ state: 'hidden', timeout: 3000 }).catch(() => undefined)
}

test('shopping essentials ranks COD kids items from official apps', async ({ page }) => {
  await loginDirector(page)
  await expect(page.getByTestId('shopping-essentials').first()).toBeVisible()
  await page.goto('/#/shop')
  await expect(page.getByTestId('shopping-essentials')).toBeVisible()
  await expect(page.getByTestId('shop-pick-card').first()).toBeVisible()
  await expect(page.getByTestId('shopping-essentials')).not.toContainText(/Peanut chikki/i)
  await page.getByTestId('shop-pick-open').first().click()
  await expect(page.getByTestId('shop-pick-summary')).toBeVisible()
  await expect(page.getByTestId('shop-pick-detail')).not.toContainText(/Flipkart|Zepto|Blinkit|Meesho|₹/i)
  await page.getByTestId('shop-pick-back').click()
  await page.getByTestId('shop-add-all').click()
  await expect(page.getByTestId('shop-handoff')).toBeVisible()
  await expect(page.getByTestId('shop-handoff')).toContainText(/official app/i)
  await expect(page.getByTestId('shop-handoff')).not.toContainText(/Leo Shah|c-leo|PIN|allerg|@/i)
  await expect(page.getByTestId('return-banner')).toBeVisible()
  await expect(page.getByTestId('return-banner')).not.toContainText(/PIN|allerg|@|Leo Shah|c-leo/i)
})
