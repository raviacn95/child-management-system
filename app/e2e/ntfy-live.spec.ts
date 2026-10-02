import { expect, test, type Browser, type Page } from '@playwright/test'

/** Manual smoke test against the real ntfy.sh relay: `WILLOW_LIVE_NTFY=1 npx playwright test e2e/ntfy-live.spec.ts`. */
test.skip(!process.env.WILLOW_LIVE_NTFY, 'set WILLOW_LIVE_NTFY=1 to use the real ntfy.sh relay')

async function signIn(page: Page) {
  await page.goto('/#/login')
  await page.getByRole('button', { name: 'Sign in' }).click()
  await page.getByTestId('look-splash').waitFor({ state: 'hidden', timeout: 4000 }).catch(() => undefined)
}

async function tvPage(browser: Browser) {
  const context = await browser.newContext({ viewport: { width: 1280, height: 720 } })
  await context.addInitScript(() => {
    localStorage.setItem('willow-tv-mode', '1')
    window.open = () => null
  })
  const page = await context.newPage()
  await signIn(page)
  return page
}

test('pairs, approves and plays through the real ntfy.sh relay', async ({ browser }) => {
  test.setTimeout(120_000)
  const relayed: string[] = []
  const tv = await tvPage(browser)
  const phoneContext = await browser.newContext({ viewport: { width: 390, height: 844 } })
  phoneContext.on('request', (request) => {
    const body = request.postData()
    if (request.url().startsWith('https://ntfy.sh/') && request.method() === 'POST' && body) relayed.push(body)
  })
  const phone = await phoneContext.newPage()

  await tv.goto('/#/tv-link')
  const link = await tv.getByTestId('tv-link-qr').getAttribute('data-link')
  await phone.goto(link!)
  await phone.getByLabel('This phone’s name (shown on the TV)').fill('Smoke phone')
  await phone.getByTestId('link-tv-submit').click()
  const sas = (await phone.getByTestId('link-tv-sas').textContent({ timeout: 30_000 }))?.trim()
  await expect(tv.getByTestId('cast-approve-code')).toHaveText(sas!, { timeout: 30_000 })
  await tv.getByTestId('cast-allow').click()
  await expect(phone.getByTestId('link-tv-status')).toContainText('Linked to', { timeout: 30_000 })

  await signIn(phone)
  await phone.goto('/#/movies')
  await phone.getByRole('button', { name: /^Play .+ on Living room TV with / }).first().click()
  await expect(tv.getByTestId('cast-toast')).toContainText('Opening', { timeout: 30_000 })
  await expect(phone.getByTestId('play-on-tv-status').first()).toContainText('Playing on TV', { timeout: 30_000 })

  expect(relayed.length).toBeGreaterThan(0)
  for (const body of relayed) expect(body).toMatch(/^w1\.[\w-]+\.[\w-]+$/)
  await tv.context().close()
  await phoneContext.close()
})
