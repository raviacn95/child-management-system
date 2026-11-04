/** Feature hashing: each word votes into a fixed-size vector. Swap this for an API embedder later; search stays cosine similarity. */
export const EMBED_DIM = 32

const STOP = new Set([
  'the', 'and', 'for', 'with', 'that', 'this', 'from', 'are', 'was', 'were', 'his', 'her', 'she', 'him',
  'did', 'does', 'how', 'what', 'when', 'who', 'why', 'all', 'show', 'related', 'involving', 'into',
  'about', 'have', 'has', 'had', 'you', 'your', 'our', 'their', 'first', 'start', 'started', 'began',
  'today', 'tomorrow', 'child', 'children', 'note', 'notes', 'memory', 'memories', 'event', 'events',
  'led', 'become', 'becoming', 'more',
])

export function tokenize(text: string) {
  return text.toLowerCase().match(/[a-z0-9']+/g) ?? []
}

export function stem(token: string) {
  if (token.endsWith('ing') && token.length > 5) return token.slice(0, -3)
  if (token.endsWith('ed') && token.length > 4) return token.slice(0, -2)
  if (token.endsWith('es') && token.length > 4) return token.slice(0, -2)
  if (token.endsWith('s') && token.length > 3) return token.slice(0, -1)
  return token
}

export function contentTokens(text: string) {
  const seen = new Set<string>()
  const out: string[] = []
  for (const token of tokenize(text)) {
    if (token.length < 3 || STOP.has(token)) continue
    const word = stem(token)
    if (word.length < 3 || seen.has(word)) continue
    seen.add(word)
    out.push(word)
  }
  return out
}

export function tokensRelated(a: string, b: string) {
  const left = stem(a)
  const right = stem(b)
  if (left === right) return true
  const short = left.length <= right.length ? left : right
  const long = left.length <= right.length ? right : left
  return short.length >= 4 && long.startsWith(short)
}

export function textOverlaps(query: string, doc: string) {
  const words = contentTokens(query)
  const docWords = tokenize(doc).map(stem)
  return words.filter((word) => docWords.some((other) => tokensRelated(word, other)))
}

function hashToken(token: string) {
  let hash = 2166136261
  for (let i = 0; i < token.length; i += 1) {
    hash ^= token.charCodeAt(i)
    hash = Math.imul(hash, 16777619)
  }
  return hash >>> 0
}

export function embed(text: string) {
  const vector = Array.from({ length: EMBED_DIM }, () => 0)
  for (const token of tokenize(text)) {
    if (token.length < 3 || STOP.has(token)) continue
    const hash = hashToken(stem(token))
    const sign = (hash & 1) === 0 ? 1 : -1
    vector[hash % EMBED_DIM] += sign
  }
  return normalize(vector)
}

export function normalize(vector: number[]) {
  const norm = Math.sqrt(vector.reduce((sum, value) => sum + value * value, 0))
  if (!norm) return vector
  return vector.map((value) => value / norm)
}

export function cosine(a: number[], b: number[]) {
  const length = Math.min(a.length, b.length)
  let score = 0
  for (let i = 0; i < length; i += 1) score += a[i] * b[i]
  return score
}

export function averageVectors(vectors: number[][]) {
  if (!vectors.length) return Array.from({ length: EMBED_DIM }, () => 0)
  const sum = Array.from({ length: EMBED_DIM }, () => 0)
  for (const vector of vectors) {
    for (let i = 0; i < EMBED_DIM; i += 1) sum[i] += vector[i] ?? 0
  }
  return normalize(sum.map((value) => value / vectors.length))
}
