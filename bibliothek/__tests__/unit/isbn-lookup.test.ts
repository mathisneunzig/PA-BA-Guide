import { fetchIsbnMetadata } from '@/lib/books/isbn-lookup'

const OPEN_LIBRARY_RESPONSE = {
  'ISBN:9780201134971': {
    title: 'The Art of Computer Programming',
    authors: [{ name: 'Donald E. Knuth' }],
    publishers: [{ name: 'Addison-Wesley' }],
    publish_date: '1997',
    cover: { medium: 'https://covers.openlibrary.org/b/id/123-M.jpg' },
    languages: [{ key: '/languages/eng' }],
  },
}

const GOOGLE_BOOKS_RESPONSE = {
  items: [
    {
      volumeInfo: {
        title: 'Clean Code',
        authors: ['Robert C. Martin'],
        publisher: 'Prentice Hall',
        publishedDate: '2008-08-01',
        description: 'A handbook of agile software craftsmanship.',
        imageLinks: { thumbnail: 'https://books.google.com/cover.jpg' },
        language: 'en',
      },
    },
  ],
}

describe('fetchIsbnMetadata', () => {
  afterEach(() => jest.restoreAllMocks())

  it('returns Open Library data when available', async () => {
    jest.spyOn(global, 'fetch').mockResolvedValueOnce({
      ok: true,
      json: async () => OPEN_LIBRARY_RESPONSE,
    } as Response)

    const result = await fetchIsbnMetadata('9780201134971')

    expect(result.title).toBe('The Art of Computer Programming')
    expect(result.author).toBe('Donald E. Knuth')
    expect(result.publisher).toBe('Addison-Wesley')
    expect(result.language).toBe('eng')
  })

  it('falls back to Google Books on Open Library failure', async () => {
    jest
      .spyOn(global, 'fetch')
      .mockResolvedValueOnce({ ok: false, json: async () => ({}) } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => GOOGLE_BOOKS_RESPONSE,
      } as Response)

    const result = await fetchIsbnMetadata('9780132350884')

    expect(result.title).toBe('Clean Code')
    expect(result.author).toBe('Robert C. Martin')
    expect(result.year).toBe(2008)
  })

  it('returns empty object when both APIs fail', async () => {
    jest
      .spyOn(global, 'fetch')
      .mockResolvedValueOnce({ ok: false, json: async () => ({}) } as Response)
      .mockResolvedValueOnce({ ok: false, json: async () => ({}) } as Response)

    const result = await fetchIsbnMetadata('0000000000000')
    expect(result).toEqual({})
  })

  it('returns empty object when fetch throws', async () => {
    jest.spyOn(global, 'fetch').mockRejectedValue(new Error('network error'))

    const result = await fetchIsbnMetadata('9780201134971')
    expect(result).toEqual({})
  })

  it('falls back to Google when Open Library returns no entry for ISBN', async () => {
    jest
      .spyOn(global, 'fetch')
      .mockResolvedValueOnce({ ok: true, json: async () => ({}) } as Response) // empty OL response
      .mockResolvedValueOnce({
        ok: true,
        json: async () => GOOGLE_BOOKS_RESPONSE,
      } as Response)

    const result = await fetchIsbnMetadata('9780132350884')
    expect(result.title).toBe('Clean Code')
  })
})
