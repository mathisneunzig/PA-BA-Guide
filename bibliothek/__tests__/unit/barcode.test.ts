import {
  computeEan13CheckDigit,
  buildEan13,
  validateEan13,
} from '@/lib/books/barcode'

describe('computeEan13CheckDigit', () => {
  it('returns correct check digit for known EAN-13: 4006381333931', () => {
    // 400638133393 → check digit 1
    expect(computeEan13CheckDigit('400638133393')).toBe(1)
  })

  it('returns correct check digit for 978020113497 → 1', () => {
    // Verified with GS1 algorithm: sum=89, check=(10-89%10)%10=1
    expect(computeEan13CheckDigit('978020113497')).toBe(1)
  })

  it('returns 0 when sum is divisible by 10', () => {
    // 000000000000 → sum 0 → check = 0
    expect(computeEan13CheckDigit('000000000000')).toBe(0)
  })
})

describe('buildEan13', () => {
  it('returns a 13-digit string', () => {
    expect(buildEan13('123456789')).toHaveLength(13)
  })

  it('starts with 020', () => {
    expect(buildEan13('123456789')).toMatch(/^020/)
  })

  it('always produces a barcode that passes validateEan13', () => {
    for (let i = 0; i < 20; i++) {
      const digits = Math.floor(Math.random() * 1_000_000_000)
        .toString()
        .padStart(9, '0')
      const barcode = buildEan13(digits)
      expect(validateEan13(barcode)).toBe(true)
    }
  })
})

describe('validateEan13', () => {
  it('accepts a valid EAN-13', () => {
    expect(validateEan13('4006381333931')).toBe(true)
  })

  it('rejects wrong length', () => {
    expect(validateEan13('123456789012')).toBe(false)  // 12 digits
    expect(validateEan13('12345678901234')).toBe(false) // 14 digits
  })

  it('rejects non-digit characters', () => {
    expect(validateEan13('400638133393X')).toBe(false)
  })

  it('rejects wrong check digit', () => {
    expect(validateEan13('4006381333930')).toBe(false) // correct is 1
  })

  it('rejects all zeros with wrong check', () => {
    expect(validateEan13('0000000000001')).toBe(false) // correct is 0
    expect(validateEan13('0000000000000')).toBe(true)
  })
})
