// Simple AES-GCM encryption for API keys at rest
// Node.js crypto — runs server-side only

import { createCipheriv, createDecipheriv, randomBytes, scryptSync } from 'crypto'

const ALGORITHM = 'aes-256-gcm'

function getKey(): Buffer {
  const secret = process.env.ENCRYPTION_SECRET
  if (!secret) throw new Error('ENCRYPTION_SECRET is not set')
  return scryptSync(secret, 'duotronics-salt', 32)
}

export function encryptKey(plaintext: string): string {
  const iv = randomBytes(12)
  const key = getKey()
  const cipher = createCipheriv(ALGORITHM, key, iv)
  const encrypted = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()])
  const tag = cipher.getAuthTag()
  // Format: iv:tag:encrypted (all hex)
  return [iv.toString('hex'), tag.toString('hex'), encrypted.toString('hex')].join(':')
}

export function decryptKey(ciphertext: string): string {
  const [ivHex, tagHex, encHex] = ciphertext.split(':')
  const key = getKey()
  const decipher = createDecipheriv(ALGORITHM, key, Buffer.from(ivHex, 'hex'))
  decipher.setAuthTag(Buffer.from(tagHex, 'hex'))
  const decrypted = Buffer.concat([
    decipher.update(Buffer.from(encHex, 'hex')),
    decipher.final()
  ])
  return decrypted.toString('utf8')
}
