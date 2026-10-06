import { describe, expect, it } from 'vitest'
import { decryptField, encryptField } from './fieldEncryption'

describe('field encryption', () => {
  it('round-trips sensitive values and rejects the wrong passphrase', async () => {
    const encrypted = await encryptField('pickup PIN 4482', 'test-device-secret')
    expect(encrypted.split('.')).toHaveLength(3)
    await expect(decryptField(encrypted, 'test-device-secret')).resolves.toBe('pickup PIN 4482')
    await expect(decryptField(encrypted, 'wrong-secret')).rejects.toThrow()
  })
})