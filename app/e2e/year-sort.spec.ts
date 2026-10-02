import { expect, test, type Locator, type Page } from '@playwright/test'

const year = new Date().getFullYear()

async function signIn(page: Page) {
  await page.goto('/#/login')
  await page.getByRole('button', { name: 'Sign in' }).click()
  await page
    .getByTestId('look-splash')
    .waitFor({ state: 'hidden', timeout: 4000 })
    .catch(() => undefined)
}

async function years(cards: Locator, pattern: RegExp, count = 12) {
  const texts = await cards.evaluateAll(
    (nodes, n) => nodes.slice(0, n).map((node) => node.textContent ?? ''),
    count,
  )
  return texts.map((text) => Number(pattern.exec(text)?.[1]))
}

const descending = (list: number[]) => list.every((value, i) => i === 0 || list[i - 1] >= value)
const ascending = (list: number[]) => list.every((value, i) => i === 0 || list[i - 1] <= value)

test('Movies shelf ranks by newest or oldest release year', async ({ page }) => {
  await signIn(page)
  await page.goto('/#/movies')
  const shelf = page.getByTestId('movie-shelf')
  const cards = shelf.getByTestId('movie-card')
  await expect(cards).toHaveCount(100)

  await shelf.getByLabel('Rank by').selectOption({ label: 'Newest first' })
  const newest = await years(cards, /(\d{4}) · Original/)
  expect(newest.every(Number.isFinite)).toBeTruthy()
  expect(descending(newest)).toBeTruthy()

  await shelf.getByLabel('Rank by').selectOption({ label: 'Oldest first' })
  const oldest = await years(cards, /(\d{4}) · Original/)
  expect(ascending(oldest)).toBeTruthy()
  expect(oldest[0]).toBeLessThan(newest[0])
})

test('TV shelf toggles Top picks, Newest and Oldest', async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('willow-tv-mode', '1'))
  await signIn(page)
  await page.goto('/#/movies')
  const shelf = page.getByTestId('tv-movie-shelf')
  const cards = shelf.getByTestId('tv-movie-card')
  await expect(cards.first()).toBeVisible()
  await expect(shelf.getByRole('button', { name: 'Top picks', exact: true })).toHaveAttribute(
    'aria-pressed',
    'true',
  )

  await shelf.getByRole('button', { name: 'Newest', exact: true }).click()
  await expect(shelf.getByRole('button', { name: 'Newest', exact: true })).toHaveAttribute(
    'aria-pressed',
    'true',
  )
  expect(descending(await years(cards, /(\d{4}) · /))).toBeTruthy()

  await shelf.getByRole('button', { name: 'Oldest', exact: true }).click()
  expect(ascending(await years(cards, /(\d{4}) · /))).toBeTruthy()
})

test('New this year row can list the earliest releases first', async ({ page }) => {
  const titles = [
    { id: 'wd-Q201', title: 'January Rain', released: `${year}-01-05` },
    { id: 'wd-Q202', title: 'March Tide', released: `${year}-03-09` },
  ].map((t) => ({ ...t, qid: t.id.replace('wd-', ''), year, lang: 'ml', india: true, sitelinks: 2 }))
  await page.context().route(/movies-fresh\.json/, (route) =>
    route.fulfill({
      json: {
        schemaVersion: 1,
        generatedAt: `${year}-01-01T00:00:00.000Z`,
        year,
        source: 'Wikidata (CC0)',
        titles,
      },
    }),
  )
  await signIn(page)
  await page.goto('/#/movies')
  const row = page.getByTestId('fresh-row')
  await expect(row.getByTestId('fresh-card').first()).toContainText('March Tide')
  await row.getByRole('button', { name: 'Oldest first', exact: true }).click()
  await expect(row.getByTestId('fresh-card').first()).toContainText('January Rain')
  await row.getByRole('button', { name: 'Newest first', exact: true }).click()
  await expect(row.getByTestId('fresh-card').first()).toContainText('March Tide')
})
