import { expect, test, type Page } from '@playwright/test'

async function signIn(page: Page) {
  await page.goto('/#/login')
  await page.getByRole('button', { name: 'Sign in' }).click()
  await page.getByTestId('look-splash').waitFor({ state: 'hidden', timeout: 4000 }).catch(() => undefined)
}

async function addApp(page: Page, name: string, link: string, eroticOnly = false, androidPackage = '', activity = '') {
  const card = page.getByTestId('custom-apps')
  await card.getByLabel('App name').fill(name)
  await card.getByLabel(/Package name/).fill(androidPackage)
  await card.getByLabel(/Activity/).fill(activity)
  await card.getByLabel(/Search link with \{q\}/).fill(link)
  if (eroticOnly) await card.getByRole('button', { name: 'Erotic shelf only' }).click()
  await card.getByTestId('custom-app-add').click()
}

test('a custom app adds its own search button next to Netflix and Prime', async ({ page }) => {
  await signIn(page)
  await page.goto('/#/ott')
  await addApp(page, 'My Films', 'https://films.example.com/search?q={q}')
  await addApp(page, 'Pocket', '')
  await addApp(page, 'Shelf', '', false, 'com.example.shelf', '.HomeActivity')
  await addApp(page, 'Late Night', 'https://late.example.com/find/{q}', true)
  await addApp(page, 'App Link', 'filmsapp://films.example/open?q={q}', false, 'com.example.films')
  const cardForm = page.getByTestId('custom-apps')
  await cardForm.getByLabel('App name').fill('Route')
  await cardForm.getByLabel(/Package name/).fill('com.example.route')
  await cardForm.getByLabel('Scheme (optional)').fill('filmsapp')
  await cardForm.getByLabel('Host (optional)').fill('films.example')
  await cardForm.getByLabel('Path (optional)').fill('/open')
  await cardForm.getByTestId('custom-app-add').click()
  await expect(page.getByTestId('custom-app-row')).toHaveCount(6)

  await page.goto('/#/movies')
  const card = page.getByTestId('movie-card').first()
  const mine = card.getByRole('link', { name: /Search .+ on My Films/ })
  await expect(mine).toHaveAttribute('href', /^https:\/\/films\.example\.com\/search\?q=.+%20\d{4}$/)
  await expect(card.getByRole('link', { name: /Search .+ on Late Night/ })).toHaveCount(0)
  await expect(card.getByRole('link', { name: 'Open Pocket' })).toHaveAttribute(
    'href',
    'intent:#Intent;action=android.intent.action.MAIN;category=android.intent.category.LAUNCHER;S.app_name=Pocket;end',
  )
  await expect(card.getByRole('link', { name: /Search .+ on App Link/ })).toHaveAttribute(
    'href',
    /^intent:\/\/films\.example\/open\?q=.+#Intent;scheme=filmsapp;package=com\.example\.films;S\.app_name=App%20Link;S\.query=.+;end$/,
  )
  await expect(card.getByRole('link', { name: /Search .+ on Route/ })).toHaveAttribute(
    'href',
    /^intent:\/\/films\.example\/open\?q=.+#Intent;scheme=filmsapp;package=com\.example\.route;S\.app_name=Route;S\.query=.+;end$/,
  )
  await expect(card.getByRole('link', { name: 'Open Shelf' })).toHaveAttribute(
    'href',
    'intent:#Intent;action=android.intent.action.MAIN;category=android.intent.category.LAUNCHER;package=com.example.shelf;S.activity=com.example.shelf.HomeActivity;S.app_name=Shelf;end',
  )

  await page.getByTestId('erotic-link').click()
  await page.getByRole('button', { name: /I am 18\+/i }).click()
  const erotic = page.getByTestId('erotic-card').first()
  await expect(erotic.getByRole('link', { name: /Search .+ on Late Night/ })).toHaveAttribute('href', /^https:\/\/late\.example\.com\/find\//)
  await expect(erotic.getByRole('link', { name: /Search .+ on My Films/ })).toBeVisible()
})

test('custom app form refuses bad links and blocked apps', async ({ page }) => {
  await signIn(page)
  await page.goto('/#/ott')
  await addApp(page, 'Plain', 'https://films.example.com/search')
  await expect(page.getByRole('alert')).toHaveText('Put {q} in the link where the movie name goes')
  await addApp(page, 'Ullu', 'https://ullu.app/search?q={q}')
  await expect(page.getByRole('alert')).toHaveText('This app is blocked in India')
  await expect(page.getByTestId('custom-app-row')).toHaveCount(0)

  await addApp(page, 'My Films', 'https://films.example.com/search?q={q}')
  await page.getByRole('button', { name: 'Remove My Films' }).click()
  await expect(page.getByTestId('custom-app-row')).toHaveCount(0)
})
