import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifySession } from '@/lib/auth/dal'
import { computeDueDate } from '@/lib/loans/loan-service'
import { countOverlappingLoans } from '@/lib/loans/availability'
import { CreateLoanSchema } from '@/lib/validation/loan.schemas'
import { sendReservationConfirmationEmail } from '@/lib/email/send'

/** GET /api/loans — own loans only */
export async function GET(_request: NextRequest) {
  const session = await verifySession()
  const loans = await prisma.loan.findMany({
    where: { userId: session.user.id },
    include: { book: { select: { title: true, author: true } } },
    orderBy: { createdAt: 'desc' },
  })
  return NextResponse.json({ loans })
}

/** POST /api/loans — create reservation (STUDENT or ADMIN) */
export async function POST(request: NextRequest) {
  const session = await verifySession()

  if (session.user.role === 'GUEST') {
    return NextResponse.json({ error: 'Guests cannot borrow books' }, { status: 403 })
  }

  const body = await request.json()
  const parsed = CreateLoanSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  const { bookId, startDate: startDateStr, durationDays, notes } = parsed.data
  const startDate = new Date(startDateStr)
  const dueDate = computeDueDate(startDate, durationDays)

  const book = await prisma.book.findUnique({
    where: { id: bookId },
    select: { totalCopies: true, title: true, author: true },
  })
  if (!book) return NextResponse.json({ error: 'Book not found' }, { status: 404 })

  const overlapping = await countOverlappingLoans(bookId, startDate, dueDate)
  if (overlapping >= book.totalCopies) {
    return NextResponse.json({ error: 'No copies available for the requested period' }, { status: 409 })
  }

  const loan = await prisma.$transaction(async (tx) => {
    const created = await tx.loan.create({
      data: {
        userId: session.user.id,
        bookId,
        startDate,
        dueDate,
        loanDurationDays: durationDays,
        notes,
      },
    })
    await tx.book.update({
      where: { id: bookId },
      data: { availableCopies: { decrement: 1 } },
    })
    return created
  })

  // Send confirmation email (non-blocking)
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { email: true },
  })
  if (user?.email) {
    sendReservationConfirmationEmail({
      to: user.email,
      bookTitle: book.title,
      startDate,
      dueDate,
      loanId: loan.id,
    }).catch(() => {})
  }

  return NextResponse.json(loan, { status: 201 })
}
