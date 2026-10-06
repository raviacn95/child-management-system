import { createServer } from 'node:http'
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { coachMessages, coachText } from './coachPrompt.mjs'
import { allowRate, authorize, readJson, validateOrder, validateQuote } from './security.mjs'
import { clientKey, handleAgent } from '../supabase/functions/willow-agent/handler.mts'
import { memoryQuota, quotaLimits } from '../supabase/functions/willow-agent/quota.mts'

const root = dirname(fileURLToPath(import.meta.url))
const catalog = JSON.parse(readFileSync(join(root, '../app/src/data/qc-catalog.json'), 'utf8'))
const PORT = Number(process.env.PORT || 8790)
const orders = new Map()
const grokWindow = new Map()
const quoteCache = new Map()
const apiWindow = new Map()
const QUOTE_CACHE_MS = 60_000
const GROK_INTERESTS = new Set(['animals', 'art', 'math', 'music', 'science', 'stories', 'movement', 'space', 'history'])
const GROK_BANDS = new Set(['2-5', '5-8', '8-12'])

function grokAllowed(body = {}) {
  const allowedKeys = new Set(['ageBand', 'interests', 'countryCode', 'module'])
  if (!body || typeof body !== 'object' || Object.keys(body).some((key) => !allowedKeys.has(key))) return null
  const ageBand = String(body.ageBand || '')
  const interests = Array.isArray(body.interests)
    ? body.interests.map(String).filter((interest) => GROK_INTERESTS.has(interest)).slice(0, 5)
    : []
  const countryCode = String(body.countryCode || 'IN').slice(0, 3).toUpperCase()
  const module = String(body.module || 'learning')
  if (!GROK_BANDS.has(ageBand) || !['learning', 'meals', 'training'].includes(module)) return null
  return { ageBand, interests, countryCode, module }
}

function grokRateAllowed(ip) {
  return allowRate(grokWindow, ip, 10, 60_000)
}

async function grokCoach(input) {
  if (!process.env.GROK_API_KEY) {
    return { configured: false, message: 'Grok assistant is not configured. Willow local recommendations remain available.' }
  }
  const response = await fetch('https://api.x.ai/v1/chat/completions', {
    method: 'POST',
    headers: { Authorization: `Bearer ${process.env.GROK_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: process.env.GROK_MODEL || 'grok-3-mini',
      temperature: 0.3,
      max_tokens: 500,
      messages: coachMessages(input),
    }),
  })
  if (!response.ok) throw new Error(`Grok request failed (${response.status})`)
  const data = await response.json()
  const text = coachText(data.choices?.[0]?.message?.content)
  if (!text) return { configured: true, message: 'Those ideas were withheld. Willow local recommendations remain available.' }
  return { configured: true, text }
}

const agentEnv = (key) => process.env[key]
const agentDeps = { env: agentEnv, fetch, allow: memoryQuota(quotaLimits(agentEnv)), log: (event, detail) => console.warn(event, detail ?? {}) }

/** Same handler as the Supabase willow-agent function; Origin is dropped because only the Vite proxy reaches this port. */
async function agentRoute(req, res) {
  const body = req.method === 'POST' ? JSON.stringify(await readJson(req)) : undefined
  const request = new Request('http://127.0.0.1/agent', { method: req.method, headers: { 'content-type': 'application/json' }, body })
  const client = await clientKey(new Request('http://127.0.0.1/', { headers: { 'x-forwarded-for': req.socket.remoteAddress || 'local' } }))
  const response = await handleAgent(request, agentDeps, client)
  res.writeHead(response.status, Object.fromEntries(response.headers))
  res.end(await response.text())
}

function pinPrefix(pin = '') {
  return String(pin).replace(/\D/g, '').slice(0, 2)
}

function allergenHits(product, allergies = []) {
  const needles = allergies.map((a) => String(a).toLowerCase())
  return (product.allergens || []).filter((a) => needles.some((n) => a.includes(n) || n.includes(a)))
}

function offerFor(product, appId, pin) {
  const slot = product.apps?.[appId]
  if (!slot || slot.stock < 1) return null
  const prefix = pinPrefix(pin)
  if (prefix && !product.pins.some((p) => prefix.startsWith(p) || p.startsWith(prefix))) return null
  return {
    app: appId,
    sku: product.sku,
    name: product.name,
    brand: product.brand,
    price: slot.price,
    mrp: product.mrp,
    etaMin: slot.etaMin,
    stock: slot.stock,
    codOk: product.codOk,
    veg: product.veg,
    allergens: product.allergens,
  }
}

function scoreOffer(offer, preferCod) {
  let score = 100 - offer.etaMin * 1.4 - offer.price / 25
  if (preferCod && offer.codOk) score += 10
  return Math.round(score * 10) / 10
}

function appName(id) {
  return catalog.apps.find((a) => a.id === id)?.name ?? id
}

function quoteNeeds({ needs = [], allergies = [], diet = '', pincode = '', preferCod = true }) {
  const picks = []
  const comparison = []
  for (const need of needs) {
    const row = catalog.needMap[need.id]
    if (!row) continue
    const offers = []
    for (const sku of row.skus) {
      const product = catalog.products.find((p) => p.sku === sku)
      if (!product) continue
      if (allergenHits(product, allergies).length) continue
      if (String(diet).toLowerCase().includes('veg') && !product.veg) continue
      for (const app of catalog.apps) {
        const offer = offerFor(product, app.id, pincode)
        if (offer) {
          offers.push(offer)
          comparison.push(offer)
        }
      }
    }
    if (!offers.length) continue
    offers.sort((a, b) => scoreOffer(b, preferCod) - scoreOffer(a, preferCod))
    const best = offers[0]
    picks.push({
      needId: need.id,
      label: need.label,
      chosen: best,
      runners: offers.slice(1, 3),
      score: scoreOffer(best, preferCod),
      reason: `Best ETA x price on ${appName(best.app)}`,
    })
  }

  const votes = new Map()
  for (const pick of picks) {
    const cur = votes.get(pick.chosen.app) ?? { score: 0, eta: 0 }
    cur.score += pick.score
    cur.eta = Math.max(cur.eta, pick.chosen.etaMin)
    votes.set(pick.chosen.app, cur)
  }
  let winner = 'blinkit'
  let top = -Infinity
  for (const [app, v] of votes) {
    const s = v.score - v.eta * 0.5
    if (s > top) {
      top = s
      winner = app
    }
  }

  const unified = picks.map((p) => {
    const same = [p.chosen, ...p.runners].find((o) => o.app === winner)
    return same ? { ...p, chosen: same, reason: `Consolidated on ${appName(winner)}` } : p
  })
  const subtotal = unified.reduce((n, p) => n + p.chosen.price, 0)
  const etaMin = unified.reduce((n, p) => Math.max(n, p.chosen.etaMin), 0)
  return {
    quote: {
      picks: unified,
      comparison,
      decision: {
        app: winner,
        appName: appName(winner),
        etaMin,
        subtotal,
        allCod: unified.every((p) => p.chosen.codOk),
        why: `${appName(winner)} won on ETA, PIN, and allergy-safe SKUs. Sandbox partner adapter — not a live consumer API.`,
      },
      mode: 'middleware',
    },
  }
}

function json(res, code, body) {
  res.writeHead(code, {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
  })
  res.end(JSON.stringify(body))
}

const server = createServer(async (req, res) => {
  if (req.method === 'OPTIONS') return json(res, 204, {})
  const url = new URL(req.url || '/', `http://127.0.0.1:${PORT}`)

  try {
    if (req.method !== 'OPTIONS' && !allowRate(apiWindow, req.socket.remoteAddress || 'local', 120, 60_000)) {
      return json(res, 429, { error: 'rate_limited' })
    }
    if (req.method === 'GET' && url.pathname === '/health') {
      return json(res, 200, { ok: true, apps: catalog.apps.map((a) => a.id), mode: 'sandbox-partner' })
    }
    if (req.method === 'GET' && url.pathname === '/catalog') {
      const q = (url.searchParams.get('q') || '').toLowerCase()
      const pin = url.searchParams.get('pin') || ''
      const hits = []
      for (const product of catalog.products) {
        const hay = `${product.name} ${product.brand} ${product.sku}`.toLowerCase()
        if (q && !hay.includes(q)) continue
        for (const app of catalog.apps) {
          const offer = offerFor(product, app.id, pin)
          if (offer) hits.push(offer)
        }
      }
      return json(res, 200, { hits })
    }
    if (req.method === 'POST' && url.pathname === '/grok/learning-coach') {
      if (!grokRateAllowed(req.socket.remoteAddress || 'local')) return json(res, 429, { error: 'rate_limited' })
      const auth = authorize(req, ['director', 'teacher'])
      if (!auth.ok) return json(res, auth.status, { error: auth.error })
      const input = grokAllowed(await readJson(req))
      if (!input) return json(res, 400, { error: 'Only ageBand, interests, countryCode, and a supported module are accepted.' })
      return json(res, 200, await grokCoach(input))
    }
    if (url.pathname === '/agent') return agentRoute(req, res)
    if (req.method === 'POST' && url.pathname === '/auto_order') {
      const auth = authorize(req, ['director', 'teacher', 'parent'])
      if (!auth.ok) return json(res, auth.status, { error: auth.error })
      const body = validateQuote(await readJson(req))
      if (!body) return json(res, 400, { error: 'invalid_quote_request' })
      const cacheKey = JSON.stringify(body)
      const cached = quoteCache.get(cacheKey)
      if (cached && cached.expiresAt > Date.now()) return json(res, 200, cached.value)
      const value = quoteNeeds(body)
      quoteCache.set(cacheKey, { expiresAt: Date.now() + QUOTE_CACHE_MS, value })
      return json(res, 200, value)
    }
    if (req.method === 'POST' && url.pathname === '/orders') {
      const auth = authorize(req, ['director', 'teacher', 'parent'])
      if (!auth.ok) return json(res, auth.status, { error: auth.error })
      const body = validateOrder(await readJson(req))
      if (!body) return json(res, 400, { error: 'invalid_order_request' })
      const id = body.id || `QC-${Math.floor(2400 + Math.random() * 700)}`
      const order = { ...body, id, status: body.status || 'confirmed' }
      orders.set(id, order)
      return json(res, 200, order)
    }
    if (req.method === 'GET' && url.pathname.startsWith('/orders/')) {
      const id = url.pathname.split('/')[2]
      const order = orders.get(id)
      if (!order) return json(res, 404, { error: 'not_found' })
      return json(res, 200, order)
    }
    if (req.method === 'POST' && url.pathname === '/webhooks/order') {
      if (process.env.WILLOW_WEBHOOK_SECRET && req.headers['x-willow-webhook-secret'] !== process.env.WILLOW_WEBHOOK_SECRET) {
        return json(res, 401, { error: 'unauthorized' })
      }
      const body = await readJson(req)
      const order = orders.get(body.orderId)
      if (!order) return json(res, 404, { error: 'not_found' })
      order.status = body.status
      order.events = [...(order.events || []), { at: new Date().toISOString(), status: body.status, note: body.note || 'webhook' }]
      orders.set(body.orderId, order)
      return json(res, 200, order)
    }
    return json(res, 404, { error: 'not_found' })
  } catch (err) {
    return json(res, err.statusCode || 400, { error: err.statusCode === 413 ? 'request_too_large' : 'invalid_request' })
  }
})

server.listen(PORT, '127.0.0.1', () => {
  console.log(`Willow QC middleware (sandbox partner adapters) on http://127.0.0.1:${PORT}`)
  console.log('No live Zepto/Blinkit/Instamart consumer APIs are called.')
})
