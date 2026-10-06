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

test('pricing page shows plans and validates demo requests without child data', async ({ page, context }) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write'])
  await page.goto('/#/login')
  await page.getByTestId('pricing-login-link').click()
  await expect(page.getByTestId('pricing')).toBeVisible()
  for (const id of ['free', 'plus', 'packs', 'center']) await expect(page.getByTestId(`plan-${id}`)).toBeVisible()
  await expect(page.getByTestId('plan-plus')).toContainText('₹199')
  await expect(page.getByTestId('plan-plus-yearly-price')).toContainText('₹1,990')
  await expect(page.getByTestId('plan-plus-cta')).toContainText(/Opening soon|Get Willow Plus/)

  await page.getByTestId('lead-org').fill('Little Oaks Daycare')
  await page.getByTestId('lead-city').fill('Pune')
  await page.getByTestId('lead-contact').fill('not-a-contact')
  await page.getByTestId('lead-submit').click()
  await expect(page.getByTestId('lead-error')).toContainText(/email or phone/i)

  await page.getByTestId('lead-contact').fill('hello@littleoaks.in')
  await page.getByTestId('lead-message').fill('One child has a nut allergy')
  await page.getByTestId('lead-submit').click()
  await expect(page.getByTestId('lead-error')).toContainText(/child details/i)

  await page.getByTestId('lead-message').fill('40 children, two branches')
  await page.getByTestId('lead-submit').click()
  await expect(page.getByTestId('lead-status')).toBeVisible()

  await page.getByLabel('Feedback').fill('medical note')
  await page.getByTestId('feedback-send').click()
  await expect(page.getByTestId('feedback').getByRole('alert')).toContainText(/child details/i)
  await page.getByLabel('Feedback').fill('Please add a yearly reminder')
  await page.getByTestId('feedback-send').click()
  await expect(page.getByTestId('feedback')).toContainText(/Copied|sent|Opening/i)
})

test('referral code from an invite link is kept and settings show the go-live checklist', async ({ page }) => {
  await page.goto('/?ref=WIL-ABCDEF#/login')
  await page.getByRole('button', { name: 'Sign in' }).waitFor()
  await expect.poll(() => page.evaluate(() => localStorage.getItem('willow-ref-from-v1'))).toBe('WIL-ABCDEF')
  await page.getByRole('button', { name: 'Sign in' }).click()
  await expect(page.getByRole('heading', { name: /Today at a glance/i })).toBeVisible()
  await page.goto('/#/settings')
  await expect(page.getByTestId('revenue-settings')).toBeVisible()
  await expect(page.getByTestId('go-live-affiliate')).toBeVisible()
  await expect(page.getByTestId('invite-code')).toHaveText(/^WIL-[A-Z2-9]{6}$/)
  await expect(page.getByTestId('invite-whatsapp')).toHaveAttribute('href', /^https:\/\/wa\.me\/\?text=/)
})

test('shop counts store clicks, offers repeat basket, WhatsApp share and gift guides', async ({ page }) => {
  await loginDirector(page)
  await page.goto('/#/shop')
  await expect(page.getByTestId('shop-together')).toBeVisible()
  await expect(page.getByTestId('shop-share-whatsapp')).toHaveAttribute('href', /^https:\/\/wa\.me\/\?text=/)
  await expect(page.getByTestId('gift-guides')).toBeVisible()
  await expect(page.getByTestId('sponsored-shelf')).toHaveCount(0)
  await page.getByTestId('shop-together-app-blinkit').click()
  await page.goto('/#/shop')
  await expect(page.getByTestId('shop-repeat-basket')).toContainText(/Blinkit/)
  const clicks = await page.evaluate(() => JSON.parse(localStorage.getItem('willow-shop-clicks-v1') ?? '{}'))
  expect(clicks.blinkit).toBeGreaterThanOrEqual(1)
  const basket = await page.evaluate(() => localStorage.getItem('willow-last-basket-v1') ?? '')
  expect(basket).not.toMatch(/Leo Shah|c-leo|allerg|@/i)
})
