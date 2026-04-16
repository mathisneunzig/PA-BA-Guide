import 'server-only'
import { randomBytes } from 'crypto'

export function generateToken(byteLength = 32): string {
  return randomBytes(byteLength).toString('hex')
}
