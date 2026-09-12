import { expect, test } from '@playwright/test'

test('login can share Willow on WhatsApp and Facebook without child data', async ({ page }) => {
  await page.goto('/#/login')
  await page.getByTestId('open-share').click()
  const sheet = page.getByTestId('share-sheet')
  await expect(sheet).toBeVisible()
  await expect(sheet.getByTestId('share-whatsapp')).toHaveAttribute('href', /wa\.me/)
  await expect(sheet.getByTestId('share-facebook')).toHaveAttribute('href', /facebook\.com\/sharer/)
  await expect(sheet).toContainText('Willow™')
  await expect(sheet).toContainText('All rights reserved')
  await expect(sheet).not.toContainText(/PIN|allerg/i)
})
