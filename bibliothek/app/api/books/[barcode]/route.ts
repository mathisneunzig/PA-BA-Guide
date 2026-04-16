import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireRole } from '@/lib/auth/dal'
import { validateEan13 } from '@/lib/books/barcode'
import { UpdateBookSchema } from '@/lib/validation/book.schemas'
import { LoanStatus } from '@prisma/client'

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

  const existing = await prisma.book.findUnique({ where: { id: barcode }, select: { id: true } })
  if (!existing) return NextResponse.json({ error: 'Book not found' }, { status: 404 })

  const book = await prisma.book.update({ where: { id: barcode }, data: parsed.data })
  return NextResponse.json(book)
}

/** DELETE /api/books/[barcode] — admin only; rejects if active loans exist */
export async function DELETE(_request: NextRequest, { params }: Params) {
  await requireRole('ADMIN')
  const { barcode } = await params

  const activeLoans = await prisma.loan.count({
    where: {
      bookId: barcode,
      status: { in: [LoanStatus.ACTIVE, LoanStatus.RESERVED] },
    },
  })
  if (activeLoans > 0) {
    return NextResponse.json({ error: 'Cannot delete book with active loans' }, { status: 409 })
  }

  await prisma.book.delete({ where: { id: barcode } })
  return NextResponse.json({ success: true })
}
