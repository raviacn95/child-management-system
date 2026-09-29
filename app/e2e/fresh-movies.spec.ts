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
