import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

type Params = { params: Promise<{ nr: string }> }

/**
 * GET /api/books/by-regalnummer/[nr]
 * Public lookup: find a book by its exact Regalnummer.
 */
export async function GET(_request: NextRequest, { params }: Params) {
  const { nr } = await params
  const book = await prisma.book.findFirst({
    where: { regalnummer: { equals: nr } },
  })
  if (!book) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json(book)
}
