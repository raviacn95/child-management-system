const encoder = new TextEncoder()
const decoder = new TextDecoder()

function bytesToBase64(bytes: Uint8Array) {
  let binary = ''
  bytes.forEach((byte) => (binary += String.fromCharCode(byte)))
  return btoa(binary)
}

function base64ToBytes(value: string) {
  const binary = atob(value)
  return Uint8Array.from(binary, (char) => char.charCodeAt(0))
}

async function deriveKey(passphrase: string, salt: Uint8Array) {
  const material = await crypto.subtle.importKey('raw', encoder.encode(passphrase), 'PBKDF2', false, ['deriveKey'])
  const saltBuffer = new Uint8Array(salt).buffer
  return crypto.subtle.deriveKey(
    { name: 'PBKDF2', salt: saltBuffer, iterations: 210_000, hash: 'SHA-256' },
    material,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt'],
  )
}

export async function encryptField(value: string, passphrase: string) {
  const salt = crypto.getRandomValues(new Uint8Array(16))
  const iv = crypto.getRandomValues(new Uint8Array(12))
  const key = await deriveKey(passphrase, salt)
  const ciphertext = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, encoder.encode(value))
  return [bytesToBase64(salt), bytesToBase64(iv), bytesToBase64(new Uint8Array(ciphertext))].join('.')
}

export async function decryptField(payload: string, passphrase: string) {
  const [saltValue, ivValue, ciphertextValue] = payload.split('.')
  if (!saltValue || !ivValue || !ciphertextValue) throw new Error('Invalid encrypted field')
  const salt = base64ToBytes(saltValue)
  const iv = base64ToBytes(ivValue)
  const key = await deriveKey(passphrase, salt)
  const plaintext = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, base64ToBytes(ciphertextValue))
  return decoder.decode(plaintext)
}