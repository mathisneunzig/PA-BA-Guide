// Unit tests for barcode normalization (leading-zero padding for scanner input)
// The resolveBook logic in admin loan forms normalises 12-digit scans to 13 digits.

/**
 * Mirrors the resolveBook normalization logic from:
 *   app/(admin)/admin/loans/reserve/page.tsx
 *   app/(admin)/admin/loans/multi/page.tsx
 *
 * Returns the barcode to use for API lookup, or null if it's a regalnummer.
 */
function normalizeBarcodeInput(input: string): { type: 'barcode'; value: string } | { type: 'regalnummer'; value: string } {
  if (/^\d{13}$/.test(input)) return { type: 'barcode', value: input }
  if (/^\d{12}$/.test(input)) return { type: 'barcode', value: `0${input}` }
  return { type: 'regalnummer', value: input }
}

describe('normalizeBarcodeInput', () => {
  it('returns exact 13-digit barcode as-is', () => {
    const result = normalizeBarcodeInput('0209999999995')
    expect(result.type).toBe('barcode')
    expect(result.value).toBe('0209999999995')
  })

  it('pads 12-digit scanner input with leading 0', () => {
    const result = normalizeBarcodeInput('209999999995')
    expect(result.type).toBe('barcode')
    expect(result.value).toBe('0209999999995')
  })

  it('does not alter barcode that already starts with 0', () => {
    // A 13-digit barcode starting with 0 should be unchanged
    const result = normalizeBarcodeInput('0123456789012')
    expect(result.type).toBe('barcode')
    expect(result.value).toBe('0123456789012')
  })

  it('treats alphanumeric input as regalnummer', () => {
    const result = normalizeBarcodeInput('SAP0001')
    expect(result.type).toBe('regalnummer')
    expect(result.value).toBe('SAP0001')
  })

  it('treats short numeric input as regalnummer (not a barcode)', () => {
    // e.g. "123" — not 12 or 13 digits, so treat as regalnummer
    const result = normalizeBarcodeInput('123')
    expect(result.type).toBe('regalnummer')
  })

  it('treats 14-digit numeric input as regalnummer (too long)', () => {
    const result = normalizeBarcodeInput('12345678901234')
    expect(result.type).toBe('regalnummer')
  })

  it('pads various real-world 12-digit scan examples', () => {
    // All of these simulate barcodes starting with 0 where scanner dropped the 0
    const examples = ['020123456781', '020000000009', '029876543210']
    for (const input of examples) {
      const result = normalizeBarcodeInput(input)
      expect(result.type).toBe('barcode')
      expect(result.value).toBe(`0${input}`)
      expect(result.value).toHaveLength(13)
    }
  })
})
