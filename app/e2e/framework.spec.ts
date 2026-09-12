import { expect, test } from '@playwright/test'

const LOOKS = ['grove', 'cinema', 'harbor', 'atelier', 'arcade', 'pulse', 'rang'] as const

test('every Willow look applies from login', async ({ page }) => {
  await page.goto('/#/login')
  for (const look of LOOKS) {
    await page.getByTestId(`look-${look}`).click()
    await expect(page.locator('html')).toHaveAttribute('data-look', look)
  }
})

test('share card uses the Willow mark and no child faces', async ({ page }) => {
  await page.goto('/#/login')
  await page.getByTestId('open-share').click()
  const sheet = page.getByTestId('share-sheet')
  await expect(sheet.getByTestId('safe-share-card')).toBeVisible()
  await expect(sheet.getByTestId('family-mark')).toBeVisible()
  await expect(sheet).toContainText('Willow™')
  await expect(sheet).not.toContainText(/Leo|PIN|allerg/i)
})
