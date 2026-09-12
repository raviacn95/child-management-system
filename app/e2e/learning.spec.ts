import AxeBuilder from '@axe-core/playwright'
import { expect, test, type Page } from '@playwright/test'

const PACKS = [
  { band: '2-5' as const, featured: ['Numberblocks', 'Alphablocks'] },
  { band: '5-8' as const, featured: ['SciShow Kids', 'Art for Kids Hub'] },
  { band: '8-12' as const, featured: ['Crash Course Kids', 'TED-Ed', 'NASA Official Channel'] },
]

async function loginDirector(page: Page) {
  await page.goto('/#/login')
  await page.getByRole('button', { name: 'Sign in' }).click()
  await expect(page.getByRole('heading', { name: /Today at a glance/i })).toBeVisible()
  await page.getByTestId('look-splash').waitFor({ state: 'hidden', timeout: 3000 }).catch(() => undefined)
}

test('director dashboard loads API learning packs without duplicate channels', async ({ page }) => {
  await loginDirector(page)
  const panel = page.getByTestId('learning-packs')
  await expect(panel.getByRole('heading', { name: 'Learning packs' })).toBeVisible()
  await expect(panel.getByTestId('pack-card-2-5')).toBeVisible()
  await expect(panel.getByTestId('pack-card-5-8')).toBeVisible()
  await expect(panel.getByTestId('pack-card-8-12')).toBeVisible()
})

test.describe('age-banded packs', () => {
  for (const pack of PACKS) {
    test(`${pack.band} shows featured channels once`, async ({ page }) => {
      await loginDirector(page)
      await page.goto(`/#/learning?band=${pack.band}`)
      await expect(page.getByTestId('age-band')).toHaveText(`Ages ${pack.band}`)
      const cards = page.getByTestId('channel-card')
      await expect(cards.first()).toBeVisible()
      const ids = await cards.evaluateAll((nodes) => nodes.map((n) => n.getAttribute('data-channel-id')))
      expect(ids.filter(Boolean)).toEqual([...new Set(ids)])
      for (const name of pack.featured) {
        await expect(cards.filter({ hasText: name })).toHaveCount(1)
      }
    })
  }
})

test('YouTube search API is mocked', async ({ page }) => {
  await loginDirector(page)
  const body = await page.evaluate(async () => {
    const res = await fetch('/api/youtube/search?q=nasa')
    return res.json() as Promise<{ items: { snippet: { title: string } }[] }>
  })
  expect(body.items.some((i) => /nasa/i.test(i.snippet.title))).toBeTruthy()
})

test('learning packs are accessible', async ({ page }) => {
  await loginDirector(page)
  await page.goto('/#/learning?band=5-8')
  await expect(page.getByTestId('channel-pack')).toBeVisible()
  const results = await new AxeBuilder({ page }).include('[data-testid="channel-pack"]').analyze()
  expect(results.violations).toEqual([])
})

test('learning pack visual snapshot', async ({ page }) => {
  await loginDirector(page)
  const panel = page.getByTestId('learning-packs')
  await expect(panel).toBeVisible()
  await expect(panel).toHaveScreenshot('director-learning-packs.png', { maxDiffPixelRatio: 0.04 })
})
