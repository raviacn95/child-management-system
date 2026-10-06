import test from 'node:test'
import assert from 'node:assert/strict'
import { allowRate, signJwt, validateOrder, validateQuote, verifyJwt } from './security.mjs'

test('signs and verifies expiring role claims', () => {
  const token = signJwt({ sub: 'u-1', role: 'teacher', exp: 2_000 }, 'secret', 1_000)
  assert.equal(verifyJwt(token, 'secret', 1_001).role, 'teacher')
  assert.equal(verifyJwt(token, 'wrong', 1_001), null)
  assert.equal(verifyJwt(token, 'secret', 2_001), null)
})

test('rejects malformed partner requests and strips unknown fields', () => {
  assert.equal(validateQuote({ needs: [] }), null)
  assert.deepEqual(validateQuote({ needs: [{ id: 'diapers', label: 'Diapers', secret: 'drop' }], childName: 'Leo' }), {
    needs: [{ id: 'diapers', label: 'Diapers' }],
    allergies: [],
    diet: '',
    pincode: '',
    preferCod: true,
  })
  assert.deepEqual(validateOrder({ lines: [{ sku: 'sku-1', childId: 'c-leo' }], address: 'private' }), {
    id: '',
    status: 'confirmed',
    payment: '',
    lines: [{ sku: 'sku-1' }],
  })
})

test('enforces a bounded request window', () => {
  const rates = new Map()
  assert.equal(allowRate(rates, 'ip', 2, 60_000, 100), true)
  assert.equal(allowRate(rates, 'ip', 2, 60_000, 101), true)
  assert.equal(allowRate(rates, 'ip', 2, 60_000, 102), false)
  assert.equal(allowRate(rates, 'ip', 2, 60_000, 60_101), true)
})