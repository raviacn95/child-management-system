import { expect, test, type Page } from '@playwright/test'

const year = new Date().getFullYear()

function feed(titles: { id: string; title: string; lang: string; released: string }[], generatedAt: string) {
  return {
    schemaVersion: 1,
    generatedAt,
    year,
    source: 'Wikidata (CC0)',
    titles: titles.map((t) => ({ ...t, qid: t.id.replace('wd-', ''), year, india: t.lang !== 'en', sitelinks: 3 })),
  }
}

const first = feed(
  [
    { id: 'wd-Q101', title: 'Monsoon Letters', lang: 'ml', released: `${year}-01-10` },
    { id: 'wd-Q102', title: 'City of Kites', lang: 'hi', released: `${year}-02-14` },
  ],
  `${year}-01-01T00:00:00.000Z`,
)

const second = feed(
  [...first.titles, { id: 'wd-Q103', title: 'Backwater Radio', lang: 'ml', released: `${year}-03-01` }],
  `${year}-01-01T03:00:00.000Z`,
)

async function signIn(page: Page) {
  await page.goto('/#/login')
  await page.getByRole('button', { name: 'Sign in' }).click()
  await page.getByTestId('look-splash').waitFor({ state: 'hidden', timeout: 4000 }).catch(() => undefined)
}

test('New this year sits on top of Movies and picks up new releases without a reload', async ({ page }) => {
  let current = first
  await page.context().route(/movies-fresh\.json/, (route) => route.fulfill({ json: current }))
  await signIn(page)
  await page.goto('/#/movies')

  const row = page.getByTestId('fresh-row')
  await expect(row.getByRole('heading', { name: `New in ${year}` })).toBeVisible()
  await expect(row.getByTestId('fresh-card')).toHaveCount(2)
  await expect(row.getByTestId('fresh-card').first()).toContainText('City of Kites')

  const rowBox = await row.boundingBox()
  const shelfBox = await page.getByTestId('movie-shelf').boundingBox()
  expect(rowBox && shelfBox && rowBox.y < shelfBox.y).toBeTruthy()

  current = second
  await row.getByTestId('fresh-refresh').click()
  await expect(row.getByTestId('fresh-card')).toHaveCount(3)
  await expect(row.getByTestId('fresh-card').first()).toContainText('Backwater Radio')
  await expect(row.getByTestId('fresh-card').first()).toContainText('Just added')

  await row.getByRole('button', { name: 'Malayalam', exact: true }).click()
  await expect(row.getByTestId('fresh-card')).toHaveCount(2)
})

const daysAgo = (days: number) => new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)

const withChannels = {
  schemaVersion: 1,
  generatedAt: new Date().toISOString(),
  year,
  source: 'Wikidata (CC0); streaming data: JustWatch via TMDB',
  titles: [
    {
      id: 'wd-Q301',
      qid: 'Q301',
      title: 'Kites Over Kochi',
      year,
      released: daysAgo(70),
      lang: 'ml',
      india: true,
      sitelinks: 5,
      tmdbId: 301,
      providersSource: 'tmdb',
      providers: [
        { platformId: 'appletv', kind: 'rent' },
        { platformId: 'netflix', kind: 'stream' },
        { platformId: 'manoramamax', kind: 'stream' },
      ],
    },
    { id: 'wd-Q302', qid: 'Q302', title: 'Harbour Lights', year, released: daysAgo(10), lang: 'ml', india: true, sitelinks: 4, providers: [] },
    {
      id: 'wd-Q303',
      qid: 'Q303',
      title: 'Quiet Ghats',
      year,
      released: daysAgo(120),
      lang: 'ml',
      india: true,
      sitelinks: 3,
      providersSource: 'tmdb',
      providers: [],
    },
  ],
}

test('New this year cards list real channels, or say honestly when there are none', async ({ page }) => {
  await page.context().route(/movies-fresh\.json/, (route) => route.fulfill({ json: withChannels }))
  await signIn(page)
  await page.goto('/#/movies')

  const row = page.getByTestId('fresh-row')
  const kites = row.getByTestId('fresh-card').filter({ hasText: 'Kites Over Kochi' })
  const channels = kites.getByTestId('fresh-channel')
  await expect(channels).toHaveText(['Netflix', 'ManoramaMAX', 'Rent · Apple TV'])
  await expect(kites.getByRole('button', { name: 'Watch Kites Over Kochi on Netflix' })).toBeVisible()
  await expect(kites.getByRole('button', { name: 'Rent Kites Over Kochi on Apple TV' })).toBeVisible()
  await expect(kites.getByTestId('fresh-availability')).toHaveCount(0)
  await expect(kites.getByTestId('fresh-where')).toBeVisible()
  await expect(kites.getByTestId('fresh-trailer')).toBeVisible()

  const harbour = row.getByTestId('fresh-card').filter({ hasText: 'Harbour Lights' })
  await expect(harbour.getByTestId('fresh-channel')).toHaveCount(0)
  await expect(harbour.getByTestId('fresh-availability')).toHaveText('In cinemas')

  const ghats = row.getByTestId('fresh-card').filter({ hasText: 'Quiet Ghats' })
  await expect(ghats.getByTestId('fresh-availability')).toHaveText('Not streaming in India yet')
  await expect(ghats.getByTestId('fresh-where')).toBeVisible()

  await expect(row.getByTestId('fresh-credit')).toContainText('Streaming data: JustWatch via TMDB')
})

test('This year’s streaming films top the main shelf, with their channels', async ({ page }) => {
  await page.context().route(/movies-fresh\.json/, (route) => route.fulfill({ json: withChannels }))
  await signIn(page)
  await page.goto('/#/movies')

  const shelf = page.getByTestId('movie-shelf')
  const cards = shelf.getByTestId('movie-card')
  await expect(cards.first()).toContainText('Kites Over Kochi')
  await expect(cards).toHaveCount(100)

  await shelf.getByLabel('Rank by').selectOption({ label: 'Newest first' })
  const top = cards.first()
  await expect(top).toContainText('Kites Over Kochi')
  await expect(top).toContainText(`${year} · Original Malayalam`)
  await expect(top.getByRole('button', { name: 'Open Kites Over Kochi' })).toBeVisible()
  await expect(top.locator('[data-watch-link="netflix"]')).toBeVisible()
  await expect(top.locator('[data-watch-link="manoramamax"]')).toBeVisible()
  await expect(shelf.getByTestId('movie-card').filter({ hasText: 'Harbour Lights' })).toHaveCount(0)

  await shelf.getByRole('button', { name: 'Hindi', exact: true }).click()
  await expect(shelf.getByTestId('movie-card').filter({ hasText: 'Kites Over Kochi' })).toHaveCount(0)
  await shelf.getByRole('button', { name: 'Malayalam', exact: true }).click()
  await expect(cards.first()).toContainText('Kites Over Kochi')
})
