import { normaliseAuthor } from '@/lib/books/isbn-lookup'

describe('normaliseAuthor', () => {
  it('converts "Firstname Lastname" to "Lastname, Firstname"', () => {
    expect(normaliseAuthor('Donald Knuth')).toBe('Knuth, Donald')
  })

  it('converts "Firstname Middle Lastname" correctly', () => {
    expect(normaliseAuthor('Donald E. Knuth')).toBe('Knuth, Donald E.')
  })

  it('leaves "Lastname, Firstname" unchanged (idempotent)', () => {
    expect(normaliseAuthor('Knuth, Donald')).toBe('Knuth, Donald')
  })

  it('leaves "Lastname, Firstname Middle" unchanged', () => {
    expect(normaliseAuthor('van Rossum, Guido')).toBe('van Rossum, Guido')
  })

  it('handles single-word name', () => {
    expect(normaliseAuthor('Aristoteles')).toBe('Aristoteles')
  })

  it('trims leading/trailing whitespace', () => {
    expect(normaliseAuthor('  Donald Knuth  ')).toBe('Knuth, Donald')
  })

  it('returns empty string for empty input', () => {
    expect(normaliseAuthor('')).toBe('')
  })

  it('handles three-part name "Robert C. Martin"', () => {
    expect(normaliseAuthor('Robert C. Martin')).toBe('Martin, Robert C.')
  })
})
