import { createServer } from 'node:http'
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = dirname(fileURLToPath(import.meta.url))
const catalog = JSON.parse(readFileSync(join(root, '../app/src/data/qc-catalog.json'), 'utf8'))
const PORT = Number(process.env.PORT || 8790)
const orders = new Map()

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

function readBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = []
    req.on('data', (c) => chunks.push(c))
    req.on('end', () => {
      try {
        resolve(chunks.length ? JSON.parse(Buffer.concat(chunks).toString('utf8')) : {})
      } catch (err) {
        reject(err)
      }
    })
  })
}

const server = createServer(async (req, res) => {
  if (req.method === 'OPTIONS') return json(res, 204, {})
  const url = new URL(req.url || '/', `http://127.0.0.1:${PORT}`)

  try {
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
    if (req.method === 'POST' && url.pathname === '/auto_order') {
      const body = await readBody(req)
      return json(res, 200, quoteNeeds(body))
    }
    if (req.method === 'POST' && url.pathname === '/orders') {
      const body = await readBody(req)
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
      const body = await readBody(req)
      const order = orders.get(body.orderId)
      if (!order) return json(res, 404, { error: 'not_found' })
      order.status = body.status
      order.events = [...(order.events || []), { at: new Date().toISOString(), status: body.status, note: body.note || 'webhook' }]
      orders.set(body.orderId, order)
      return json(res, 200, order)
    }
    return json(res, 404, { error: 'not_found' })
  } catch (err) {
    return json(res, 400, { error: String(err.message || err) })
  }
})

server.listen(PORT, '127.0.0.1', () => {
  console.log(`Willow QC middleware (sandbox partner adapters) on http://127.0.0.1:${PORT}`)
  console.log('No live Zepto/Blinkit/Instamart consumer APIs are called.')
})
