const B64U = /^[A-Za-z0-9_-]*$/

export function toB64u(bytes: Uint8Array) {
  let binary = ''
  for (const b of bytes) binary += String.fromCharCode(b)
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

export function fromB64u(text: string): Uint8Array<ArrayBuffer> {
  if (!B64U.test(text) || text.length % 4 === 1) throw new Error('Invalid base64url')
  const binary = atob(text.replace(/-/g, '+').replace(/_/g, '/') + '='.repeat((4 - (text.length % 4)) % 4))
  const out = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) out[i] = binary.charCodeAt(i)
  return out
}

export function randomBytes(n: number) {
  return crypto.getRandomValues(new Uint8Array(n))
}

export function randomB64u(n: number) {
  return toB64u(randomBytes(n))
}

export function utf8(text: string): Uint8Array<ArrayBuffer> {
  return new TextEncoder().encode(text)
}
