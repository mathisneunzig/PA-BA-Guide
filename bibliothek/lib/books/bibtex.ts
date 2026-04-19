/**
 * BibTeX entry generator for books.
 * Can be used both server-side and client-side (no server-only import).
 */

export interface BibtexBook {
  title: string
  author?: string | null
  publisher?: string | null
  year?: number | null
  isbn13?: string | null
  id?: string // barcode (used as fallback for ISBN)
  tags?: string | null
}

/**
 * Generate a BibTeX citation key like "knuth1998" or "cleancode2009".
 * Rules:
 *   - Use first author's last name (the word right before the comma in "Lastname, Firstname",
 *     or the last space-separated word in "Firstname Lastname")
 *   - Append the year (4 digits) if available
 *   - Strip accents/umlauts, lowercase, remove non-alphanumeric
 */
export function generateBibtexKey(book: BibtexBook): string {
  let name = 'unknown'
  if (book.author) {
    const firstAuthor = book.author.split(' and ')[0].trim()
    if (firstAuthor.includes(',')) {
      // "van den Berg, Jan" → take last word before comma = "Berg"
      const beforeComma = firstAuthor.split(',')[0].trim()
      const parts = beforeComma.split(/\s+/)
      name = parts[parts.length - 1]
    } else {
      // "Firstname Lastname" → take last word
      const parts = firstAuthor.split(/\s+/)
      name = parts[parts.length - 1]
    }
  } else if (book.title) {
    name = book.title.split(/\s+/)[0]
  }

  // Transliterate common umlauts / accented characters
  const translitMap: Record<string, string> = {
    ä: 'ae', ö: 'oe', ü: 'ue', Ä: 'Ae', Ö: 'Oe', Ü: 'Ue', ß: 'ss',
    é: 'e', è: 'e', ê: 'e', à: 'a', â: 'a', î: 'i', ô: 'o', û: 'u',
    ñ: 'n', ç: 'c',
  }
  const normalised = name
    .split('')
    .map((c) => translitMap[c] ?? c)
    .join('')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '')

  const year = book.year ? String(book.year) : ''
  return (normalised || 'unknown') + year
}

/** Right-pad a string to a given length. */
function pad(s: string, len: number): string {
  return s.padEnd(len)
}

/**
 * Generate a complete BibTeX @book entry string ready to paste into a .bib file.
 */
export function generateBibtex(book: BibtexBook): string {
  const key = generateBibtexKey(book)
  const isbn = book.isbn13 ?? book.id ?? ''

  const fields: [string, string | null | undefined][] = [
    ['author',    book.author],
    ['title',     book.title],
    ['publisher', book.publisher],
    ['year',      book.year != null ? String(book.year) : undefined],
    ['isbn',      isbn || undefined],
    ['keywords',  book.tags?.replace(/,/g, ', ')],
  ]

  const maxKeyLen = Math.max(...fields.map(([k]) => k.length))

  const fieldLines = fields
    .filter(([, v]) => v)
    .map(([k, v]) => `  ${pad(k, maxKeyLen)} = {${v}}`)
    .join(',\n')

  return `@book{${key},\n${fieldLines}\n}`
}
