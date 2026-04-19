import { generateBibtex, generateBibtexKey } from '@/lib/books/bibtex'

describe('generateBibtexKey', () => {
  it('uses last name + year for "Lastname, Firstname" author', () => {
    expect(generateBibtexKey({ title: 'Test', author: 'Knuth, Donald', year: 1998 })).toBe('knuth1998')
  })

  it('uses last name + year for "Firstname Lastname" author', () => {
    expect(generateBibtexKey({ title: 'Test', author: 'Donald Knuth', year: 1998 })).toBe('knuth1998')
  })

  it('uses first author when multiple authors present', () => {
    expect(generateBibtexKey({ title: 'Test', author: 'Knuth, Donald and Martin, Robert', year: 2020 })).toBe('knuth2020')
  })

  it('falls back to title first word when no author', () => {
    const key = generateBibtexKey({ title: 'Clean Code', year: 2008 })
    expect(key).toBe('clean2008')
  })

  it('appends no year when year is missing', () => {
    expect(generateBibtexKey({ title: 'Test', author: 'Knuth, Donald' })).toBe('knuth')
  })

  it('transliterates umlauts', () => {
    expect(generateBibtexKey({ title: 'Test', author: 'Müller, Hans', year: 2000 })).toBe('mueller2000')
  })

  it('uses the last word of compound last name', () => {
    // "van den Berg, Jan" → key uses "Berg" (last word before comma)
    const key = generateBibtexKey({ title: 'Test', author: 'van den Berg, Jan', year: 2010 })
    expect(key).toBe('berg2010')
  })
})

describe('generateBibtex', () => {
  const fullBook = {
    title: 'The Art of Computer Programming',
    author: 'Knuth, Donald',
    publisher: 'Addison-Wesley',
    year: 1997,
    isbn13: '9780201038040',
    id: '0201038040002',
    tags: 'Informatik,Algorithmen',
  }

  it('generates a valid @book entry starting with key', () => {
    const bib = generateBibtex(fullBook)
    expect(bib).toMatch(/^@book\{knuth1997,/)
  })

  it('contains all expected fields', () => {
    const bib = generateBibtex(fullBook)
    expect(bib).toContain('author')
    expect(bib).toContain('Knuth, Donald')
    expect(bib).toContain('title')
    expect(bib).toContain('The Art of Computer Programming')
    expect(bib).toContain('publisher')
    expect(bib).toContain('Addison-Wesley')
    expect(bib).toContain('year')
    expect(bib).toContain('1997')
    expect(bib).toContain('isbn')
    expect(bib).toContain('9780201038040')
  })

  it('omits fields that are null/undefined', () => {
    const minimal = { title: 'Minimal Book', author: 'Doe, Jane' }
    const bib = generateBibtex(minimal)
    expect(bib).not.toContain('publisher')
    expect(bib).not.toContain('year')
    expect(bib).not.toContain('isbn')
  })

  it('uses barcode as isbn fallback when isbn13 is absent', () => {
    const book = { title: 'Test', author: 'Author, Test', id: '0209999999995' }
    const bib = generateBibtex(book)
    expect(bib).toContain('0209999999995')
  })

  it('formats keywords from tags, comma-separated with spaces', () => {
    const bib = generateBibtex(fullBook)
    expect(bib).toContain('Informatik, Algorithmen')
  })
})
