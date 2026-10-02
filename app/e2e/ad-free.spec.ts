import { expect, test, type Page } from '@playwright/test'

async function signIn(page: Page) {
  await page.goto('/#/login')
  await page.getByRole('button', { name: 'Sign in' }).click()
  await page.getByTestId('look-splash').waitFor({ state: 'hidden', timeout: 4000 }).catch(() => undefined)
}

test('a Netflix plan marked ad-free is listed first with an Ad-free marker on movies', async ({ page }) => {
  await signIn(page)
  await page.goto('/#/ott')
  await expect(page.getByTestId('ott-hub')).toBeVisible()
  await expect(page.getByTestId('ad-free-first')).toHaveAttribute('aria-checked', 'true')
  await page.getByTestId('ott-hub').getByRole('combobox').selectOption('netflix')
  await page.getByRole('group', { name: 'My plan', exact: true }).getByRole('button', { name: 'Ad-free', exact: true }).click()
  await page.getByRole('button', { name: 'Save to my vault' }).click()
  const card = page.getByTestId('ott-card').filter({ hasText: 'Netflix' })
  await expect(card).toContainText('Ad-free plan')
  await expect(card).toContainText('every plan is ad-free')

  await page.goto('/#/movies')
  await page.getByTestId('movie-shelf').getByRole('button', { name: 'Malayalam', exact: true }).click()
  const jallikattu = page.getByTestId('movie-card').filter({ hasText: 'Jallikattu' })
  const firstLink = jallikattu.locator('[data-watch-link]').first()
  await expect(firstLink).toHaveAttribute('data-watch-link', 'netflix')
  await expect(firstLink.getByTestId('watch-ad-marker')).toHaveText('Ad-free')
  await expect(jallikattu.locator('[data-watch-link="prime"]').getByTestId('watch-ad-marker')).toHaveText('Has ads')
})
