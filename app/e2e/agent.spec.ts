import { expect, test, type Page } from '@playwright/test'

async function openAsk(page: Page) {
  await page.goto('/#/login')
  await page.getByRole('button', { name: 'Sign in' }).click()
  await expect(page.getByRole('heading', { name: /Today at a glance/i })).toBeVisible()
  await page.getByTestId('look-splash').waitFor({ state: 'hidden', timeout: 3000 }).catch(() => undefined)
  await page.getByTestId('open-search').click()
  await expect(page.getByTestId('command-palette')).toBeVisible()
}

async function ask(page: Page, text: string) {
  await page.getByTestId('command-query').fill(text)
  await page.getByTestId('command-query').press('Enter')
}

test('Ask Willow opens a page from plain words without the AI', async ({ page }) => {
  let aiCalls = 0
  await page.context().route('**/qc-api/agent', (route) => {
    aiCalls += 1
    return route.fulfill({ status: 500, body: '{}' })
  })
  await openAsk(page)
  await ask(page, 'go to learning')
  await expect(page).toHaveURL(/#\/learning/)
  await expect(page.getByTestId('command-palette')).toHaveCount(0)
  expect(aiCalls).toBe(0)
})

test('Ask Willow lists family titles for a movie wish', async ({ page }) => {
  await openAsk(page)
  await ask(page, 'Malayalam comedy movies')
  const answer = page.getByTestId('agent-answer')
  await expect(answer).toHaveAttribute('data-source', 'local')
  await expect(page.getByTestId('agent-say')).toHaveText('Here are Malayalam comedy movies.')
  const cards = page.getByTestId('agent-movie')
  await expect(cards.first()).toBeVisible()
  const count = await cards.count()
  expect(count).toBeGreaterThan(1)
  for (let i = 0; i < count; i++) await expect(cards.nth(i)).toContainText('Malayalam')
  await expect(page.getByTestId('agent-watch').first()).toBeFocused()
})

test('open requests go to the AI helper with only the typed words', async ({ page }) => {
  const bodies: string[] = []
  await page.context().route('**/qc-api/agent', (route) => {
    bodies.push(route.request().postData() ?? '')
    return route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ say: 'Cosy family picks for tonight.', action: { type: 'find_movies', genre: 'family' } }),
    })
  })
  await openAsk(page)
  await ask(page, 'a cosy film for a rainy evening')
  await expect(page.getByTestId('agent-answer')).toHaveAttribute('data-source', 'ai')
  await expect(page.getByTestId('agent-say')).toHaveText('Cosy family picks for tonight.')
  await expect(page.getByTestId('agent-movie').first()).toBeVisible()
  expect(bodies).toEqual(['{"text":"a cosy film for a rainy evening"}'])
})

test('names and PINs never leave the device', async ({ page }) => {
  let aiCalls = 0
  await page.context().route('**/qc-api/agent', (route) => {
    aiCalls += 1
    return route.fulfill({ status: 500, body: '{}' })
  })
  await openAsk(page)
  await ask(page, 'a bedtime story for Leo')
  await expect(page.getByTestId('agent-say')).toHaveText(/Leave out names, numbers, and health details/)
  await ask(page, 'my pin is 4821, what now')
  await expect(page.getByTestId('agent-say')).toHaveText(/Leave out names, numbers, and health details/)
  expect(aiCalls).toBe(0)
})

test('an unlisted title gets official storefront searches', async ({ page }) => {
  await openAsk(page)
  await ask(page, 'play Moonlit Harbour on Netflix')
  await expect(page.getByTestId('agent-unlisted')).toContainText('Willow does not list Moonlit Harbour yet')
  await expect(page.getByTestId('agent-search-link')).toHaveCount(1)
  await expect(page.getByRole('button', { name: 'Search Moonlit Harbour on Netflix' })).toBeVisible()
})

test('an empty shelf says so and offers official searches instead', async ({ page }) => {
  await page.context().route('**/qc-api/agent', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ say: 'Here are some picks.', action: { type: 'find_movies', kind: 'series', language: 'ko', genre: 'war', decade: 1950 } }),
    }),
  )
  await openAsk(page)
  await ask(page, 'a war drama my grandpa would enjoy')
  await expect(page.getByTestId('agent-say')).toHaveText("Willow's family shelf has no Korean war series from the 1950s yet.")
  await expect(page.getByTestId('agent-no-match').getByTestId('agent-search-link')).toHaveCount(4)
  await expect(page.getByRole('button', { name: 'Search Korean war series on Netflix' })).toBeFocused()
})

test('on the TV, Ask in the top bar finds a title and focuses its Watch button', async ({ page }) => {
  await page.setViewportSize({ width: 960, height: 540 })
  await page.addInitScript(() => localStorage.setItem('willow-tv-mode', '1'))
  await page.goto('/#/login')
  await page.getByRole('button', { name: 'Sign in' }).click()
  await page.getByTestId('look-splash').waitFor({ state: 'hidden', timeout: 3000 }).catch(() => undefined)
  await page.getByTestId('tv-strip-ask').click()
  await expect(page.getByTestId('command-palette')).toHaveAttribute('data-tv-modal', '1')
  await ask(page, 'play Drishyam on Prime Video')
  await expect(page.getByTestId('agent-say')).toHaveText('Here is Drishyam (2013).')
  const watch = page.getByTestId('agent-watch')
  await expect(watch).toHaveCount(1)
  await expect(watch).toHaveAccessibleName('Watch Drishyam on Amazon Prime Video')
  await expect(watch).toBeFocused()
})

test('adult asks are refused on the device', async ({ page }) => {
  await openAsk(page)
  await ask(page, 'erotic movies')
  await expect(page.getByTestId('agent-say')).toHaveText(/only find family titles/)
  await expect(page.getByTestId('agent-movie')).toHaveCount(0)
})
