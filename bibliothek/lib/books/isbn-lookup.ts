import 'server-only'

export interface IsbnMetadata {
  title?: string
  author?: string
  publisher?: string
  year?: number
  description?: string
  coverUrl?: string
  language?: string
}

async function fromOpenLibrary(isbn: string): Promise<IsbnMetadata | null> {
  const url = `https://openlibrary.org/api/books?bibkeys=ISBN:${isbn}&format=json&jscmd=data`
  const res = await fetch(url, { next: { revalidate: 86400 } })
  if (!res.ok) return null
  const data = await res.json()
  const book = data[`ISBN:${isbn}`]
  if (!book) return null

  return {
    title: book.title,
    author: book.authors?.[0]?.name,
    publisher: book.publishers?.[0]?.name,
    year: book.publish_date ? parseInt(book.publish_date.slice(-4), 10) || undefined : undefined,
    description: typeof book.notes === 'string' ? book.notes : book.notes?.value,
    coverUrl: book.cover?.medium ?? book.cover?.large,
    language: book.languages?.[0]?.key?.replace('/languages/', ''),
  }
}

async function fromGoogleBooks(isbn: string): Promise<IsbnMetadata | null> {
  const url = `https://www.googleapis.com/books/v1/volumes?q=isbn:${isbn}`
  const res = await fetch(url, { next: { revalidate: 86400 } })
  if (!res.ok) return null
  const data = await res.json()
  const volume = data.items?.[0]?.volumeInfo
  if (!volume) return null

  const thumbnail =
    volume.imageLinks?.thumbnail ?? volume.imageLinks?.smallThumbnail
  return {
    title: volume.title,
    author: volume.authors?.[0],
    publisher: volume.publisher,
    year: volume.publishedDate ? parseInt(volume.publishedDate.slice(0, 4), 10) || undefined : undefined,
    description: volume.description,
    coverUrl: thumbnail,
    language: volume.language,
  }
}

/** Fetch book metadata from Open Library, falling back to Google Books. Never throws. */
export async function fetchIsbnMetadata(isbn: string): Promise<IsbnMetadata> {
  try {
    const ol = await fromOpenLibrary(isbn)
    if (ol?.title) return ol

    const gb = await fromGoogleBooks(isbn)
    if (gb?.title) return gb
  } catch {
    // network failure — fall through to empty result
  }
  return {}
}
