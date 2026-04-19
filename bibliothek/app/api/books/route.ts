import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireRole } from '@/lib/auth/dal'
import { generateUniqueBarcode, validateEan13 } from '@/lib/books/barcode'
import { CreateBookSchema, BookSearchSchema } from '@/lib/validation/book.schemas'
import { getSearchIndex, invalidateSearchIndex } from '@/lib/books/search-index'

/** GET /api/books — public catalog with fuzzy search/filter/pagination */
export async function GET(request: NextRequest) {
  const params = Object.fromEntries(request.nextUrl.searchParams.entries())
  const parsed = BookSearchSchema.safeParse(params)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }
  const { q, tags, programmiersprachen, hauptkategorie, language, page, limit } = parsed.data
  const skip = (page - 1) * limit

  // Base filter (category, language, tags — exact/substring)
  const baseWhere = {
    ...(tags && { tags: { contains: tags } }),
    ...(programmiersprachen && { programmiersprachen: { contains: programmiersprachen } }),
    ...(hauptkategorie && { hauptkategorie }),
    ...(language && { language }),
  }

  let where: object = baseWhere

  if (q) {
    // Fuzzy full-text search via MiniSearch — returns matching IDs
    const index = await getSearchIndex()
    const results = index.search(q, { fuzzy: 0.2, prefix: true, combineWith: 'OR' })
    const ids = results.map((r) => r.id as string)

    if (ids.length === 0) {
      return NextResponse.json({ books: [], total: 0, page, limit, pages: 0 })
    }

    where = { ...baseWhere, id: { in: ids } }
  }

  const [books, total] = await Promise.all([
    prisma.book.findMany({ where, skip, take: limit, orderBy: { title: 'asc' } }),
    prisma.book.count({ where }),
  ])

  return NextResponse.json({ books, total, page, limit, pages: Math.ceil(total / limit) })
}

/** POST /api/books — create book (admin only) */
export async function POST(request: NextRequest) {
  await requireRole('ADMIN')

  const body = await request.json()
  const parsed = CreateBookSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  const data = parsed.data
  const id = data.id ?? (await generateUniqueBarcode())

  if (!validateEan13(id)) {
    return NextResponse.json({ error: 'Invalid EAN-13 barcode' }, { status: 400 })
  }

  const existing = await prisma.book.findUnique({ where: { id }, select: { id: true } })
  if (existing) {
    return NextResponse.json({ error: 'Barcode already in use' }, { status: 409 })
  }

  const availableCopies = data.availableCopies ?? data.totalCopies
  const book = await prisma.book.create({
    data: {
      id,
      title: data.title,
      author: data.author,
      isbn13: data.isbn13,
      publisher: data.publisher,
      year: data.year,
      description: data.description,
      coverUrl: data.coverUrl || undefined,
      tags: data.tags,
      programmiersprachen: data.programmiersprachen,
      hauptkategorie: data.hauptkategorie,
      regalnummer: data.regalnummer,
      language: data.language ?? 'de',
      totalCopies: data.totalCopies,
      availableCopies,
      loanDurationWeeks: data.loanDurationWeeks,
    },
  })

  invalidateSearchIndex()

  return NextResponse.json(book, { status: 201 })
}
