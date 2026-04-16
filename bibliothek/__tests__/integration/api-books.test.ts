// Integration tests for /api/books routes
// Mocks: prisma, auth/dal, lib/books/barcode (for generateUniqueBarcode)

jest.mock('../../lib/prisma', () => ({
  prisma: {
    book: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    },
    loan: { count: jest.fn() },
  },
}))

jest.mock('../../lib/auth/dal', () => ({
  verifySession: jest.fn(),
  requireRole: jest.fn(),
}))

jest.mock('../../lib/books/barcode', () => ({
  generateUniqueBarcode: jest.fn().mockResolvedValue('0209999999995'),
  validateEan13: jest.fn().mockReturnValue(true),
}))


import { GET as listBooks, POST as createBook } from '@/app/api/books/route'
import { GET as getBook, PUT as updateBook, DELETE as deleteBook } from '@/app/api/books/[barcode]/route'
import { POST as generateBarcode } from '@/app/api/books/barcode/generate/route'
import { POST as isbnLookup } from '@/app/api/books/isbn-lookup/route'
import { NextRequest } from 'next/server'

const { prisma } = jest.requireMock('../../lib/prisma')
const { requireRole, verifySession } = jest.requireMock('../../lib/auth/dal')

const ADMIN_SESSION = { user: { id: 'admin_1', role: 'ADMIN' } }
const STUDENT_SESSION = { user: { id: 'stu_1', role: 'STUDENT' } }

const MOCK_BOOK = {
  id: '0209999999995',
  title: 'Test Book',
  author: 'Test Author',
  isbn13: null,
  publisher: null,
  year: null,
  description: null,
  coverUrl: null,
  genre: null,
  language: 'de',
  totalCopies: 1,
  availableCopies: 1,
  loanDurationWeeks: 13,
  createdAt: new Date(),
  updatedAt: new Date(),
}

function makeReq(method: string, url: string, body?: object): NextRequest {
  return new NextRequest(url, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  })
}

beforeEach(() => {
  jest.clearAllMocks()
})

describe('GET /api/books', () => {
  it('returns a list of books', async () => {
    prisma.book.findMany.mockResolvedValue([MOCK_BOOK])
    prisma.book.count.mockResolvedValue(1)

    const req = makeReq('GET', 'http://localhost/api/books')
    const res = await listBooks(req)
    const json = await res.json()

    expect(res.status).toBe(200)
    expect(json.books).toHaveLength(1)
    expect(json.total).toBe(1)
  })

  it('filters by query param q', async () => {
    prisma.book.findMany.mockResolvedValue([])
    prisma.book.count.mockResolvedValue(0)

    const req = makeReq('GET', 'http://localhost/api/books?q=knuth')
    await listBooks(req)

    expect(prisma.book.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ OR: expect.any(Array) }),
      }),
    )
  })
})

describe('GET /api/books/[barcode]', () => {
  it('returns 404 for unknown barcode', async () => {
    prisma.book.findUnique.mockResolvedValue(null)

    const req = makeReq('GET', 'http://localhost/api/books/0200000000000')
    const res = await getBook(req, { params: Promise.resolve({ barcode: '0200000000000' }) })
    expect(res.status).toBe(404)
  })

  it('returns book for valid barcode', async () => {
    prisma.book.findUnique.mockResolvedValue(MOCK_BOOK)

    const req = makeReq('GET', 'http://localhost/api/books/0209999999995')
    const res = await getBook(req, { params: Promise.resolve({ barcode: '0209999999995' }) })
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.id).toBe('0209999999995')
  })
})

describe('POST /api/books', () => {
  it('returns 401 if requireRole throws (non-admin)', async () => {
    requireRole.mockImplementation(() => { throw new Error('Unauthorized') })

    const req = makeReq('POST', 'http://localhost/api/books', { title: 'X', author: 'Y' })
    await expect(createBook(req)).rejects.toThrow('Unauthorized')
  })

  it('returns 400 for invalid body', async () => {
    requireRole.mockResolvedValue(ADMIN_SESSION)

    const req = makeReq('POST', 'http://localhost/api/books', { title: '' })
    const res = await createBook(req)
    expect(res.status).toBe(400)
  })

  it('returns 409 when barcode already exists', async () => {
    requireRole.mockResolvedValue(ADMIN_SESSION)
    prisma.book.findUnique.mockResolvedValue(MOCK_BOOK) // existing book

    const req = makeReq('POST', 'http://localhost/api/books', {
      id: '0209999999995',
      title: 'Test Book',
      author: 'Test Author',
    })
    const res = await createBook(req)
    expect(res.status).toBe(409)
  })

  it('creates a book and returns 201', async () => {
    requireRole.mockResolvedValue(ADMIN_SESSION)
    prisma.book.findUnique.mockResolvedValue(null) // no existing
    prisma.book.create.mockResolvedValue(MOCK_BOOK)

    const req = makeReq('POST', 'http://localhost/api/books', {
      title: 'Test Book',
      author: 'Test Author',
    })
    const res = await createBook(req)
    expect(res.status).toBe(201)
  })
})

describe('PUT /api/books/[barcode]', () => {
  it('returns 404 if book not found', async () => {
    requireRole.mockResolvedValue(ADMIN_SESSION)
    prisma.book.findUnique.mockResolvedValue(null)

    const req = makeReq('PUT', 'http://localhost/api/books/0209999999995', { title: 'New' })
    const res = await updateBook(req, { params: Promise.resolve({ barcode: '0209999999995' }) })
    expect(res.status).toBe(404)
  })

  it('updates and returns the book', async () => {
    requireRole.mockResolvedValue(ADMIN_SESSION)
    prisma.book.findUnique.mockResolvedValue(MOCK_BOOK)
    prisma.book.update.mockResolvedValue({ ...MOCK_BOOK, title: 'Updated' })

    const req = makeReq('PUT', 'http://localhost/api/books/0209999999995', { title: 'Updated' })
    const res = await updateBook(req, { params: Promise.resolve({ barcode: '0209999999995' }) })
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.title).toBe('Updated')
  })
})

describe('DELETE /api/books/[barcode]', () => {
  it('returns 409 if active loans exist', async () => {
    requireRole.mockResolvedValue(ADMIN_SESSION)
    prisma.loan.count.mockResolvedValue(1) // active loans

    const req = makeReq('DELETE', 'http://localhost/api/books/0209999999995')
    const res = await deleteBook(req, { params: Promise.resolve({ barcode: '0209999999995' }) })
    expect(res.status).toBe(409)
  })

  it('deletes book when no active loans', async () => {
    requireRole.mockResolvedValue(ADMIN_SESSION)
    prisma.loan.count.mockResolvedValue(0)
    prisma.book.delete.mockResolvedValue(MOCK_BOOK)

    const req = makeReq('DELETE', 'http://localhost/api/books/0209999999995')
    const res = await deleteBook(req, { params: Promise.resolve({ barcode: '0209999999995' }) })
    expect(res.status).toBe(200)
  })
})

describe('POST /api/books/barcode/generate', () => {
  it('returns a valid barcode for admin', async () => {
    requireRole.mockResolvedValue(ADMIN_SESSION)

    const req = makeReq('POST', 'http://localhost/api/books/barcode/generate')
    const res = await generateBarcode(req)
    const json = await res.json()
    expect(json.barcode).toBe('0209999999995')
  })
})

describe('POST /api/books/isbn-lookup', () => {
  it('returns 400 when isbn missing', async () => {
    requireRole.mockResolvedValue(ADMIN_SESSION)

    const req = makeReq('POST', 'http://localhost/api/books/isbn-lookup', {})
    const res = await isbnLookup(req)
    expect(res.status).toBe(400)
  })

  it('returns metadata for valid isbn', async () => {
    requireRole.mockResolvedValue(ADMIN_SESSION)

    const req = makeReq('POST', 'http://localhost/api/books/isbn-lookup', { isbn: '9780201134971' })
    const res = await isbnLookup(req)
    expect(res.status).toBe(200)
  })
})
