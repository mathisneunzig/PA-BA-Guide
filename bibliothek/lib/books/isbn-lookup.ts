import 'server-only'

export interface IsbnMetadata {
  title?: string
  author?: string
  publisher?: string
  year?: number
  description?: string
  coverUrl?: string
  language?: string
  tags?: string // comma-separated suggested tags
}

/**
 * Normalise an author name to "Lastname, Firstname" format.
 * Handles:
 *   "Donald Knuth"       → "Knuth, Donald"
 *   "Donald E. Knuth"    → "Knuth, Donald E."
 *   "Knuth, Donald"      → "Knuth, Donald" (already normalised)
 *   "van Rossum, Guido"  → "van Rossum, Guido" (already normalised)
 */
export function normaliseAuthor(raw: string): string {
  const trimmed = raw.trim()
  if (!trimmed) return trimmed
  // Already in "Lastname, Firstname" format
  if (trimmed.includes(',')) return trimmed
  const parts = trimmed.split(/\s+/)
  if (parts.length === 1) return trimmed
  const last = parts[parts.length - 1]
  const first = parts.slice(0, -1).join(' ')
  return `${last}, ${first}`
}

/** Join multiple authors with " and " after normalising each. */
function normaliseAuthors(authors: string[]): string {
  return authors.map(normaliseAuthor).join(' and ')
}

// Map Google Books / OpenLibrary subject strings to our Themengebiet tags
const CATEGORY_TAG_MAP: Record<string, string> = {
  'computer': 'Informatik',
  'programming': 'Programmierung',
  'software': 'Software Engineering',
  'mathematics': 'Mathematik',
  'artificial intelligence': 'Künstliche Intelligenz',
  'machine learning': 'Maschinelles Lernen',
  'database': 'Datenbanken',
  'networking': 'Netzwerke',
  'security': 'IT-Sicherheit',
  'web': 'Web-Entwicklung',
  'algorithm': 'Algorithmen',
  'data structure': 'Algorithmen',
}

function mapCategoriesToTags(categories: string[]): string {
  const matched = new Set<string>()
  for (const cat of categories) {
    const lower = cat.toLowerCase()
    for (const [key, tag] of Object.entries(CATEGORY_TAG_MAP)) {
      if (lower.includes(key)) matched.add(tag)
    }
  }
  return Array.from(matched).join(',')
}

async function fromOpenLibrary(isbn: string): Promise<IsbnMetadata | null> {
  const url = `https://openlibrary.org/api/books?bibkeys=ISBN:${isbn}&format=json&jscmd=data`
  const res = await fetch(url, { next: { revalidate: 86400 } })
  if (!res.ok) return null
  const data = await res.json()
  const book = data[`ISBN:${isbn}`]
  if (!book) return null

  const rawAuthor = book.authors?.[0]?.name as string | undefined
  const description = typeof book.notes === 'string' ? book.notes : (book.notes?.value as string | undefined)
  const subjects: string[] = (book.subjects ?? []).map((s: { name?: string } | string) =>
    typeof s === 'string' ? s : (s.name ?? '')
  )

  return {
    title: book.title,
    author: rawAuthor ? normaliseAuthor(rawAuthor) : undefined,
    publisher: book.publishers?.[0]?.name,
    year: book.publish_date ? parseInt(book.publish_date.slice(-4), 10) || undefined : undefined,
    description,
    coverUrl: book.cover?.medium ?? book.cover?.large,
    language: (book.languages?.[0]?.key as string | undefined)?.replace('/languages/', ''),
    tags: subjects.length > 0 ? mapCategoriesToTags(subjects) : undefined,
  }
}

async function fromGoogleBooks(isbn: string): Promise<IsbnMetadata | null> {
  const url = `https://www.googleapis.com/books/v1/volumes?q=isbn:${isbn}`
  const res = await fetch(url, { next: { revalidate: 86400 } })
  if (!res.ok) return null
  const data = await res.json()
  const volume = data.items?.[0]?.volumeInfo
  if (!volume) return null

  const rawAuthors: string[] = volume.authors ?? []
  const thumbnail: string | undefined =
    volume.imageLinks?.thumbnail ?? volume.imageLinks?.smallThumbnail
  const categories: string[] = volume.categories ?? []

  return {
    title: volume.title,
    author: rawAuthors.length > 0 ? normaliseAuthors(rawAuthors) : undefined,
    publisher: volume.publisher,
    year: volume.publishedDate ? parseInt(volume.publishedDate.slice(0, 4), 10) || undefined : undefined,
    description: volume.description,
    coverUrl: thumbnail?.replace('http://', 'https://'),
    language: volume.language,
    tags: categories.length > 0 ? mapCategoriesToTags(categories) : undefined,
  }
}

/** Fetch book metadata from Open Library AND Google Books, merging the best of both. Never throws. */
export async function fetchIsbnMetadata(isbn: string): Promise<IsbnMetadata> {
  try {
    const [ol, gb] = await Promise.allSettled([
      fromOpenLibrary(isbn),
      fromGoogleBooks(isbn),
    ])
    const olData = ol.status === 'fulfilled' ? ol.value : null
    const gbData = gb.status === 'fulfilled' ? gb.value : null

    if (!olData?.title && !gbData?.title) return {}

    const base = olData?.title ? olData : gbData!
    return {
      title: base.title,
      author: base.author ?? gbData?.author,
      publisher: base.publisher ?? gbData?.publisher,
      year: base.year ?? gbData?.year,
      // Google Books usually has richer descriptions
      description: gbData?.description ?? olData?.description,
      coverUrl: base.coverUrl ?? gbData?.coverUrl,
      language: base.language ?? gbData?.language,
      tags: gbData?.tags ?? olData?.tags,
    }
  } catch {
    // network failure — fall through to empty result
  }
  return {}
}
