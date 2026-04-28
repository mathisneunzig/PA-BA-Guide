import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireRole } from '@/lib/auth/dal'
import { validateEan13 } from '@/lib/books/barcode'
import { UpdateBookSchema } from '@/lib/validation/book.schemas'
import { LoanStatus } from '@prisma/client'
import { invalidateSearchIndex } from '@/lib/books/search-index'

type Params = { params: Promise<{ barcode: string }> }

/** GET /api/books/[barcode] — public */
export async function GET(_request: NextRequest, { params }: Params) {
  const { barcode } = await params
  const book = await prisma.book.findUnique({ where: { id: barcode } })
  if (!book) return NextResponse.json({ error: 'Book not found' }, { status: 404 })
  return NextResponse.json(book)
}

/** PUT /api/books/[barcode] — admin only */
export async function PUT(request: NextRequest, { params }: Params) {
  await requireRole('ADMIN')
  const { barcode } = await params

  if (!validateEan13(barcode)) {
    return NextResponse.json({ error: 'Invalid barcode' }, { status: 400 })
  }

  const body = await request.json()
  const parsed = UpdateBookSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  const existing = await prisma.book.findUnique({
    where: { id: barcode },
    select: { id: true, totalCopies: true, availableCopies: true },
  })
  if (!existing) return NextResponse.json({ error: 'Book not found' }, { status: 404 })

  // When totalCopies changes, adjust availableCopies by the same delta
  const updateData = { ...parsed.data }
  if (
    typeof updateData.totalCopies === 'number' &&
    typeof updateData.availableCopies === 'undefined'
  ) {
    const delta = updateData.totalCopies - existing.totalCopies
    updateData.availableCopies = Math.max(0, existing.availableCopies + delta)
  }

  const book = await prisma.book.update({ where: { id: barcode }, data: updateData })
  invalidateSearchIndex()
  return NextResponse.json(book)
}

/** DELETE /api/books/[barcode] — admin only; rejects if active loans exist */
export async function DELETE(_request: NextRequest, { params }: Params) {
  await requireRole('ADMIN')
  const { barcode } = await params

  const activeLoans = await prisma.loanItem.count({
    where: {
      bookId: barcode,
      status: { in: [LoanStatus.ACTIVE, LoanStatus.RESERVED] },
    },
  })
  if (activeLoans > 0) {
    return NextResponse.json({ error: 'Cannot delete book with active loans' }, { status: 409 })
  }

  await prisma.book.delete({ where: { id: barcode } })
  invalidateSearchIndex()
  return NextResponse.json({ success: true })
}
