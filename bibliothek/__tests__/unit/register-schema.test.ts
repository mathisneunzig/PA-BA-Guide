// Unit tests for RegisterSchema — especially new consent fields and address
import { RegisterSchema } from '@/lib/validation/auth.schemas'

const VALID_BASE = {
  firstname: 'Ada',
  lastname: 'Lovelace',
  username: 'ada_lovelace',
  email: 'ada@example.com',
  password: 'Secret123!',
  passwordConfirm: 'Secret123!',
  agbAccepted: true as const,
}

describe('RegisterSchema', () => {
  it('accepts minimal valid registration', () => {
    const result = RegisterSchema.safeParse(VALID_BASE)
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.marketingConsent).toBe(false)
    }
  })

  it('defaults marketingConsent to false when not provided', () => {
    const result = RegisterSchema.safeParse(VALID_BASE)
    expect(result.success).toBe(true)
    if (result.success) expect(result.data.marketingConsent).toBe(false)
  })

  it('stores marketingConsent=true when provided', () => {
    const result = RegisterSchema.safeParse({ ...VALID_BASE, marketingConsent: true })
    expect(result.success).toBe(true)
    if (result.success) expect(result.data.marketingConsent).toBe(true)
  })

  it('rejects registration without agbAccepted', () => {
    const result = RegisterSchema.safeParse({ ...VALID_BASE, agbAccepted: false })
    expect(result.success).toBe(false)
  })

  it('rejects when agbAccepted is missing', () => {
    const { agbAccepted: _, ...without } = VALID_BASE
    const result = RegisterSchema.safeParse(without)
    expect(result.success).toBe(false)
  })

  it('accepts optional address fields', () => {
    const result = RegisterSchema.safeParse({
      ...VALID_BASE,
      street: 'Musterstraße',
      housenr: '42',
      zipcode: '68199',
      city: 'Mannheim',
      country: 'Deutschland',
    })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.street).toBe('Musterstraße')
      expect(result.data.city).toBe('Mannheim')
    }
  })

  it('rejects mismatched passwords', () => {
    const result = RegisterSchema.safeParse({ ...VALID_BASE, passwordConfirm: 'different' })
    expect(result.success).toBe(false)
    if (!result.success) {
      const paths = result.error.issues.map((i) => i.path.join('.'))
      expect(paths).toContain('passwordConfirm')
    }
  })

  it('rejects username with special characters', () => {
    const result = RegisterSchema.safeParse({ ...VALID_BASE, username: 'ada!lovelace' })
    expect(result.success).toBe(false)
  })

  it('rejects password without uppercase', () => {
    const result = RegisterSchema.safeParse({ ...VALID_BASE, password: 'secret123!', passwordConfirm: 'secret123!' })
    expect(result.success).toBe(false)
  })

  it('rejects password without number', () => {
    const result = RegisterSchema.safeParse({ ...VALID_BASE, password: 'SecretABC!', passwordConfirm: 'SecretABC!' })
    expect(result.success).toBe(false)
  })

  it('rejects password without special character', () => {
    const result = RegisterSchema.safeParse({ ...VALID_BASE, password: 'Secret1234', passwordConfirm: 'Secret1234' })
    expect(result.success).toBe(false)
  })
})
