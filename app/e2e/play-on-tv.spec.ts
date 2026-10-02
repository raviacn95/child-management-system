import { expect, test, type Browser, type BrowserContext, type Page } from '@playwright/test'

const NTFY = /^https:\/\/ntfy\.sh\//
const CORS = { 'access-control-allow-origin': '*' }
const LONG_POLL_MS = 1000

/**
 * Stand-in for ntfy.sh shared by the TV and phone contexts. Each SSE response ends after one batch and the browser
 * reconnects. The dev MSW worker drops Last-Event-ID, so each context's read position per topic is kept here instead.
 */
function fakeNtfy() {
  let seq = 0
  const topics = new Map<string, { id: number; body: string }[]>()
  const waiters = new Set<() => void>()
  const relayed: string[] = []

  const after = (topic: string, since: number) => (topics.get(topic) ?? []).filter((m) => m.id > since)
  const wake = () => {
    for (const fn of [...waiters]) fn()
  }

  async function attach(context: BrowserContext) {
    const readUpTo = new Map<string, number>()
    await context.route(NTFY, async (route) => {
      const request = route.request()
      const url = new URL(request.url())
      const [topic, kind] = url.pathname.slice(1).split('/')
      if (request.method() === 'POST') {
        const body = request.postData() ?? ''
        relayed.push(body)
        topics.set(topic, [...(topics.get(topic) ?? []), { id: ++seq, body }])
        wake()
        return route.fulfill({ status: 200, headers: CORS, contentType: 'application/json', body: JSON.stringify({ id: String(seq) }) })
      }
      if (kind !== 'sse') return route.fulfill({ status: 404, headers: CORS, body: '' })
      const cursor = request.headers()['last-event-id'] ?? url.searchParams.get('since')
      const since = cursor ? Number(cursor) : (readUpTo.get(topic) ?? seq)
      readUpTo.set(topic, since)
      if (!after(topic, since).length) {
        await new Promise<void>((resolve) => {
          const done = () => (waiters.delete(done), resolve())
          waiters.add(done)
          setTimeout(done, LONG_POLL_MS)
        })
      }
      const batch = after(topic, since)
      if (batch.length) readUpTo.set(topic, batch[batch.length - 1].id)
      const events = batch.map((m) => `id: ${m.id}\ndata: ${JSON.stringify({ id: String(m.id), event: 'message', topic, message: m.body })}\n\n`)
      const body = `retry: 100\n${events.join('')}${batch.length ? '' : `id: ${since}\n\n`}`
      await route.fulfill({ status: 200, headers: { ...CORS, 'cache-control': 'no-store' }, contentType: 'text/event-stream', body }).catch(() => undefined)
    })
  }

  return { attach, relayed }
}

async function signIn(page: Page) {
  await page.goto('/#/login')
  await page.getByRole('button', { name: 'Sign in' }).click()
  await page.getByTestId('look-splash').waitFor({ state: 'hidden', timeout: 4000 }).catch(() => undefined)
}

async function openTv(browser: Browser, relay: ReturnType<typeof fakeNtfy>) {
  const context = await browser.newContext({ viewport: { width: 1280, height: 720 } })
  await relay.attach(context)
  await context.addInitScript(() => {
    localStorage.setItem('willow-tv-mode', '1')
    const opened: string[] = []
    Object.defineProperty(window, '__opened', { value: opened })
    window.open = (url?: string | URL) => {
      opened.push(String(url))
      return null
    }
  })
  const page = await context.newPage()
  await signIn(page)
  await expect(page.getByTestId('household-hub')).toBeVisible()
  return page
}

async function openPhone(browser: Browser, relay: ReturnType<typeof fakeNtfy>) {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true })
  await relay.attach(context)
  return context.newPage()
}

const tvFocus = (page: Page) => page.evaluate(() => document.activeElement?.outerHTML.slice(0, 160) ?? '')

test('a phone links by QR, the TV approves, then Play on TV and the remote drive the TV', async ({ browser }) => {
  test.setTimeout(90_000)
  const relay = fakeNtfy()
  const tv = await openTv(browser, relay)
  const phone = await openPhone(browser, relay)

  await tv.getByTestId('tv-strip-link-phone').click()
  const link = await tv.getByTestId('tv-link-qr').getAttribute('data-link')
  expect(link).toMatch(/#\/link\?c=[\w-]{22}\.[\w-]{43}$/)
  await expect(tv.getByTestId('tv-link-code')).toHaveText(/^\d{3} ?\d{3}$/)

  await phone.goto(link!)
  await phone.getByLabel('This phone’s name (shown on the TV)').fill('Ravi’s phone')
  await phone.getByTestId('link-tv-submit').click()
  const sas = (await phone.getByTestId('link-tv-sas').textContent())?.trim()
  expect(sas).toMatch(/^\d{4}$/)
  await expect(tv.getByTestId('cast-approve')).toContainText('Ravi’s phone')
  await expect(tv.getByTestId('cast-approve-code')).toHaveText(sas!)
  await expect(tv.getByTestId('cast-allow')).toBeFocused()
  await tv.getByTestId('cast-allow').click()
  await expect(phone.getByTestId('link-tv-status')).toContainText('Linked to Living room TV')
  await expect(tv.getByTestId('tv-linked-phones')).toContainText('Ravi’s phone')

  await signIn(phone)
  await phone.goto('/#/movies')
  const play = phone.getByRole('button', { name: /^Play .+ on Living room TV with / }).first()
  await expect(play).toBeVisible()
  const label = (await play.getAttribute('aria-label')) ?? ''
  const title = label.replace(/^Play /, '').replace(/ on Living room TV with .+$/, '')
  await play.click()
  await expect(tv.getByTestId('cast-toast')).toContainText(`Opening ${title} on`)
  await expect(tv.getByTestId('cast-toast')).toContainText('(from Ravi’s phone)')
  await expect(phone.getByTestId('play-on-tv-status').first()).toContainText('Playing on TV')
  await expect.poll(() => tv.evaluate(() => (window as unknown as { __opened: string[] }).__opened), { timeout: 6000 }).toEqual([
    expect.stringMatching(/^https:\/\//),
  ])

  await phone.goto('/#/remote')
  await expect(phone.getByTestId('remote-status')).toContainText('TV:')
  await phone.getByRole('button', { name: 'TV home' }).click()
  await expect(tv).toHaveURL(/#\/hub$/)
  await expect(tv.getByTestId('household-hub')).toBeVisible()
  const before = await tvFocus(tv)
  await phone.getByRole('button', { name: 'Down' }).click()
  await expect.poll(() => tvFocus(tv), { timeout: 8000 }).not.toBe(before)
  const afterDown = await tvFocus(tv)
  await phone.getByRole('button', { name: 'Right' }).click()
  await expect.poll(() => tvFocus(tv), { timeout: 8000 }).not.toBe(afterDown)

  for (const body of relay.relayed) {
    expect(body).toMatch(/^w1\.[\w-]+\.[\w-]+$/)
    expect(body).not.toMatch(/Ravi|Living room|netflix|ping|hello/i)
  }
  await tv.context().close()
  await phone.context().close()
})

test('a phone links with the 6-digit code when it cannot scan', async ({ browser }) => {
  const relay = fakeNtfy()
  const tv = await openTv(browser, relay)
  const phone = await openPhone(browser, relay)
  await tv.goto('/#/tv-link')
  const code = (await tv.getByTestId('tv-link-code').textContent()) ?? ''
  await phone.goto('/#/link')
  await phone.getByLabel('This phone’s name (shown on the TV)').fill('Kitchen phone')
  await phone.getByLabel('Code on the TV').fill(code)
  await phone.getByTestId('link-tv-submit').click()
  const sas = (await phone.getByTestId('link-tv-sas').textContent())?.trim()
  await expect(tv.getByTestId('cast-approve-code')).toHaveText(sas!)
  await tv.getByTestId('cast-allow').click()
  await expect(phone.getByTestId('link-tv-status')).toContainText('Linked to Living room TV')
  await expect(phone.getByTestId('linked-tv-status')).toContainText('Online')
  await tv.context().close()
  await phone.context().close()
})

test('the TV can deny a phone', async ({ browser }) => {
  const relay = fakeNtfy()
  const tv = await openTv(browser, relay)
  const phone = await openPhone(browser, relay)
  await tv.goto('/#/tv-link')
  const link = await tv.getByTestId('tv-link-qr').getAttribute('data-link')
  await phone.goto(link!)
  await phone.getByLabel('This phone’s name (shown on the TV)').fill('Stranger')
  await phone.getByTestId('link-tv-submit').click()
  await expect(tv.getByTestId('cast-approve')).toBeVisible()
  await tv.getByRole('button', { name: 'Deny' }).click()
  await expect(phone.getByTestId('link-tv-status')).toContainText('The TV said no.')
  await expect(phone.getByTestId('linked-tvs')).toHaveCount(0)
  await tv.context().close()
  await phone.context().close()
})
