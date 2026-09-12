import { expect, test } from '@playwright/test'

test('login offers three UI looks and applies them', async ({ page }) => {
  await page.goto('/#/login')
  await expect(page.getByTestId('look-picker')).toBeVisible()
  await page.getByTestId('look-cinema').click()
  await expect(page.locator('html')).toHaveAttribute('data-look', 'cinema')
  await page.getByTestId('look-harbor').click()
  await expect(page.locator('html')).toHaveAttribute('data-look', 'harbor')
  await page.getByTestId('look-grove').click()
  await expect(page.locator('html')).toHaveAttribute('data-look', 'grove')
  await page.getByTestId('look-arcade').click()
  await expect(page.locator('html')).toHaveAttribute('data-look', 'arcade')
})
