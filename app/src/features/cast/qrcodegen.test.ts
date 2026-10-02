import { describe, expect, it } from 'vitest'
import { Ecc, QrCode, QrSegment } from './qrcodegen'

/** Independent reader: format bits, function-module map, zigzag, de-interleave, RS syndromes, segment parse. */
const ALIGN: Record<number, number[]> = { 1: [], 2: [6, 18], 7: [6, 22, 38], 8: [6, 24, 42] }
const BLOCKS: Record<string, { ecc: number; short: number; numShort: number; shortData: number }> = {
  '1M': { ecc: 10, short: 26, numShort: 1, shortData: 16 },
  '8M': { ecc: 22, short: 60, numShort: 2, shortData: 38 },
  '2Q': { ecc: 22, short: 44, numShort: 1, shortData: 22 },
}
const ECL_BITS: Record<number, string> = { 1: 'L', 0: 'M', 3: 'Q', 2: 'H' }

const EXP: number[] = []
const LOG: number[] = []
for (let i = 0, x = 1; i < 255; i++, x = x & 0x80 ? ((x << 1) ^ 0x11d) & 0xff : x << 1) {
  EXP[i] = x
  LOG[x] = i
}
const gfMul = (a: number, b: number) => (a && b ? EXP[(LOG[a] + LOG[b]) % 255] : 0)

function readFormat(qr: QrCode) {
  let bits = 0
  const put = (i: number, dark: boolean) => (bits |= (dark ? 1 : 0) << i)
  for (let i = 0; i <= 5; i++) put(i, qr.getModule(8, i))
  put(6, qr.getModule(8, 7))
  put(7, qr.getModule(8, 8))
  put(8, qr.getModule(7, 8))
  for (let i = 9; i < 15; i++) put(i, qr.getModule(14 - i, 8))
  const raw = bits ^ 0x5412
  const data = raw >>> 10
  let rem = data
  for (let i = 0; i < 10; i++) rem = (rem << 1) ^ ((rem >>> 9) * 0x537)
  return { ecl: ECL_BITS[data >>> 3], mask: data & 7, bchOk: ((data << 10) | (rem & 0x3ff)) === raw }
}

function readVersionBits(qr: QrCode) {
  let bits = 0
  for (let i = 0; i < 18; i++) bits |= (qr.getModule(qr.size - 11 + (i % 3), Math.floor(i / 3)) ? 1 : 0) << i
  return bits
}

function functionMap(version: number, size: number) {
  const f = Array.from({ length: size }, () => Array<boolean>(size).fill(false))
  const mark = (x0: number, y0: number, w: number, h: number) => {
    for (let y = y0; y < y0 + h; y++) for (let x = x0; x < x0 + w; x++) if (x >= 0 && y >= 0 && x < size && y < size) f[y][x] = true
  }
  mark(0, 0, 9, 9)
  mark(size - 8, 0, 8, 9)
  mark(0, size - 8, 9, 8)
  for (let i = 0; i < size; i++) f[6][i] = f[i][6] = true
  const pos = ALIGN[version]
  for (const cx of pos)
    for (const cy of pos) {
      const corner = (cx === 6 && cy === 6) || (cx === 6 && cy === pos.at(-1)) || (cx === pos.at(-1) && cy === 6)
      if (!corner) mark(cx - 2, cy - 2, 5, 5)
    }
  if (version >= 7) {
    mark(size - 11, 0, 3, 6)
    mark(0, size - 11, 6, 3)
  }
  return f
}

function maskBit(mask: number, x: number, y: number) {
  return [
    (x + y) % 2 === 0,
    y % 2 === 0,
    x % 3 === 0,
    (x + y) % 3 === 0,
    (Math.floor(x / 3) + Math.floor(y / 2)) % 2 === 0,
    ((x * y) % 2) + ((x * y) % 3) === 0,
    (((x * y) % 2) + ((x * y) % 3)) % 2 === 0,
    (((x + y) % 2) + ((x * y) % 3)) % 2 === 0,
  ][mask]
}

function decode(qr: QrCode) {
  const { ecl, mask } = readFormat(qr)
  const spec = BLOCKS[`${qr.version}${ecl}`]
  const f = functionMap(qr.version, qr.size)
  const bits: number[] = []
  for (let right = qr.size - 1; right >= 1; right -= 2) {
    if (right === 6) right = 5
    for (let vert = 0; vert < qr.size; vert++)
      for (let j = 0; j < 2; j++) {
        const x = right - j
        const y = ((right + 1) & 2) === 0 ? qr.size - 1 - vert : vert
        if (!f[y][x]) bits.push(Number(qr.getModule(x, y)) ^ Number(maskBit(mask, x, y)))
      }
  }
  const codewords: number[] = []
  for (let i = 0; i + 8 <= bits.length; i += 8) codewords.push(bits.slice(i, i + 8).reduce((acc, b) => (acc << 1) | b, 0))
  const total = Math.floor(bits.length / 8)
  const numBlocks = spec.numShort + (total - spec.numShort * spec.short) / (spec.short + 1)
  const dataLen = (j: number) => spec.shortData + (j >= spec.numShort ? 1 : 0)
  const blocks = Array.from({ length: numBlocks }, () => ({ data: [] as number[], ecc: [] as number[] }))
  let k = 0
  for (let i = 0; i < spec.shortData + 1; i++) for (let j = 0; j < numBlocks; j++) if (i < dataLen(j)) blocks[j].data.push(codewords[k++])
  for (let i = 0; i < spec.ecc; i++) for (let j = 0; j < numBlocks; j++) blocks[j].ecc.push(codewords[k++])
  const syndromesZero = blocks.every(({ data, ecc }) => {
    const poly = [...data, ...ecc]
    for (let i = 0; i < spec.ecc; i++) {
      let s = 0
      for (const c of poly) s = gfMul(s, EXP[i]) ^ c
      if (s !== 0) return false
    }
    return true
  })
  const stream = blocks.flatMap((b) => b.data).flatMap((byte) => [7, 6, 5, 4, 3, 2, 1, 0].map((s) => (byte >>> s) & 1))
  let at = 0
  const take = (n: number) => {
    let v = 0
    for (let i = 0; i < n; i++) v = (v << 1) | stream[at++]
    return v
  }
  const mode = take(4)
  let text = ''
  if (mode === 4) {
    const bytes = Array.from({ length: take(8) }, () => take(8))
    text = new TextDecoder().decode(new Uint8Array(bytes))
  } else if (mode === 2) {
    const CH = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ $%*+-./:'
    const n = take(9)
    for (let i = 0; i + 1 < n; i += 2) {
      const v = take(11)
      text += CH[Math.floor(v / 45)] + CH[v % 45]
    }
    if (n % 2) text += CH[take(6)]
  }
  return { ecl, blocks, syndromesZero, text }
}

describe('vendored QR encoder', () => {
  it('matches the published HELLO WORLD 1-M codewords', () => {
    const qr = QrCode.encodeSegments(QrSegment.makeSegments('HELLO WORLD'), Ecc.MEDIUM, 1, 40, -1, false)
    expect(qr.version).toBe(1)
    expect(qr.size).toBe(21)
    const out = decode(qr)
    expect(out.ecl).toBe('M')
    expect(out.blocks[0].data).toEqual([32, 91, 11, 120, 209, 114, 220, 77, 67, 64, 236, 17, 236, 17, 236, 17])
    expect(out.blocks[0].ecc).toEqual([196, 35, 39, 119, 235, 215, 231, 226, 93, 23])
    expect(out.syndromesZero).toBe(true)
    expect(out.text).toBe('HELLO WORLD')
  })

  it('encodes a pairing URL as version 8-M with valid format, version info and Reed-Solomon blocks', () => {
    const url = `https://raviacn95.github.io/child-management-system/#/link?c=${'a'.repeat(22)}.${'B'.repeat(43)}`
    const qr = QrCode.encodeText(url, Ecc.MEDIUM)
    expect(qr.version).toBe(8)
    expect(qr.size).toBe(49)
    expect(readFormat(qr).bchOk).toBe(true)
    expect(readVersionBits(qr)).toBe(0x085bc)
    const out = decode(qr)
    expect(out.syndromesZero).toBe(true)
    expect(out.blocks.map((b) => b.data.length)).toEqual([38, 38, 39, 39])
    expect(out.text).toBe(url)
  })

  it('round-trips UTF-8 text and draws the three finder patterns', () => {
    const qr = QrCode.encodeText('Ravi’s phone ₹', Ecc.LOW)
    expect(decode(qr).text).toBe('Ravi’s phone ₹')
    for (const [x, y] of [
      [0, 0],
      [qr.size - 7, 0],
      [0, qr.size - 7],
    ]) {
      expect(qr.getModule(x, y)).toBe(true)
      expect(qr.getModule(x + 1, y + 1)).toBe(false)
      expect(qr.getModule(x + 3, y + 3)).toBe(true)
    }
  })

  it('rejects data that cannot fit', () => {
    expect(() => QrCode.encodeText('x'.repeat(3000), Ecc.LOW)).toThrow(RangeError)
  })
})
