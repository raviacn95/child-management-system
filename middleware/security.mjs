import { createHmac, timingSafeEqual } from 'node:crypto'

export const MAX_BODY_BYTES = 64 * 1024

function base64url(value) {
  return Buffer.from(value).toString('base64url')
}

function decode(value) {
  return JSON.parse(Buffer.from(value, 'base64url').toString('utf8'))
}

export function signJwt(payload, secret, now = Math.floor(Date.now() / 1000)) {
  const header = base64url(JSON.stringify({ alg: 'HS256', typ: 'JWT' }))
  const body = base64url(JSON.stringify({ ...payload, iat: payload.iat ?? now }))
  const input = `${header}.${body}`
  const signature = createHmac('sha256', secret).update(input).digest('base64url')
  return `${input}.${signature}`
}

export function verifyJwt(token, secret, now = Math.floor(Date.now() / 1000)) {
  if (!secret || typeof token !== 'string') return null
  const parts = token.split('.')
  if (parts.length !== 3) return null
  const [header, body, signature] = parts
  try {
    const parsedHeader = decode(header)
    if (parsedHeader.alg !== 'HS256' || parsedHeader.typ !== 'JWT') return null
    const expected = createHmac('sha256', secret).update(`${header}.${body}`).digest()
    const actual = Buffer.from(signature, 'base64url')
    if (actual.length !== expected.length || !timingSafeEqual(actual, expected)) return null
    const payload = decode(body)
    if (!payload.sub || !payload.exp || payload.exp <= now) return null
    return payload
  } catch {
    return null
  }
}

export function bearerToken(req) {
  const value = req.headers.authorization || ''
  return value.startsWith('Bearer ') ? value.slice(7).trim() : ''
}

export function authorize(req, roles = []) {
  const secret = process.env.WILLOW_JWT_SECRET
  if (!secret) return { ok: true, payload: null }
  const payload = verifyJwt(bearerToken(req), secret)
  if (!payload) return { ok: false, status: 401, error: 'unauthorized' }
  if (roles.length && !roles.includes(payload.role)) return { ok: false, status: 403, error: 'forbidden' }
  return { ok: true, payload }
}

export function allowRate(rateMap, key, limit, windowMs, now = Date.now()) {
  const current = rateMap.get(key)
  if (!current || now - current.startedAt >= windowMs) {
    rateMap.set(key, { startedAt: now, count: 1 })
    return true
  }
  if (current.count >= limit) return false
  current.count += 1
  return true
}

export function validateQuote(body) {
  if (!body || typeof body !== 'object' || !Array.isArray(body.needs) || body.needs.length > 30) return null
  const needs = body.needs
    .filter((need) => need && typeof need === 'object')
    .map((need) => ({ id: String(need.id || '').slice(0, 80), label: String(need.label || '').slice(0, 120) }))
    .filter((need) => need.id)
  if (!needs.length) return null
  return {
    needs,
    allergies: Array.isArray(body.allergies) ? body.allergies.map(String).slice(0, 20) : [],
    diet: String(body.diet || '').slice(0, 40),
    pincode: String(body.pincode || body.pinPrefix || '').replace(/\D/g, '').slice(0, 10),
    preferCod: body.preferCod !== false,
  }
}

export function validateOrder(body) {
  if (!body || typeof body !== 'object' || !Array.isArray(body.lines) || body.lines.length > 50) return null
  const lines = body.lines
    .filter((line) => line && typeof line === 'object')
    .map((line) => ({ sku: String(line.sku || '').slice(0, 80) }))
    .filter((line) => line.sku)
  if (!lines.length) return null
  return {
    id: String(body.id || '').slice(0, 80),
    status: String(body.status || 'confirmed').slice(0, 30),
    payment: String(body.payment || '').slice(0, 30),
    lines,
  }
}

export async function readJson(req, maxBytes = MAX_BODY_BYTES) {
  let size = 0
  const chunks = []
  for await (const chunk of req) {
    size += chunk.length
    if (size > maxBytes) {
      const error = new Error('request_too_large')
      error.statusCode = 413
      throw error
    }
    chunks.push(chunk)
  }
  if (!chunks.length) return {}
  const value = JSON.parse(Buffer.concat(chunks).toString('utf8'))
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('invalid_json_body')
  return value
}