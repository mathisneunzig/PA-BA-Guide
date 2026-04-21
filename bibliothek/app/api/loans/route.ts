import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifySession } from '@/lib/auth/dal'
import { computeDueDate } from '@/lib/loans/loan-service'
import { countOverlappingLoans } from '@/lib/loans/availability'
import { CreateLoanSchema } from '@/lib/validation/loan.schemas'
import { sendReservationConfirmationEmail, sendLoanReceiptEmail, sendNewReservationEmail } from '@/lib/email/send'
import { releaseHold } from '@/lib/cart/holds'
import { LoanStatus } from '@prisma/client'

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

/** POST /api/loans — create reservation or direct loan (STUDENT or ADMIN) */
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

  const { bookId, startDate: startDateStr, durationDays, notes, immediate,
          handoverMethod, handoverDate, handoverLocation, handoverCost } = parsed.data

  // Only admins can create a direct ACTIVE loan
  if (immediate && session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Only admins can create direct loans' }, { status: 403 })
  }

  const startDate = immediate ? new Date() : new Date(startDateStr)
  const dueDate = computeDueDate(startDate, durationDays)

  const book = await prisma.book.findUnique({
    where: { id: bookId },
    select: { totalCopies: true, title: true, author: true, regalnummer: true },
  })
  if (!book) return NextResponse.json({ error: 'Book not found' }, { status: 404 })

  const overlapping = await countOverlappingLoans(bookId, startDate, dueDate, session.user.id)
  if (overlapping >= book.totalCopies) {
    return NextResponse.json({ error: 'Keine Exemplare für den gewünschten Zeitraum verfügbar' }, { status: 409 })
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
        status: immediate ? LoanStatus.ACTIVE : LoanStatus.RESERVED,
        handoverMethod: handoverMethod ?? null,
        handoverDate: handoverDate ? new Date(handoverDate) : null,
        handoverLocation: handoverLocation ?? null,
        handoverCost: handoverCost != null ? handoverCost : null,
      },
    })
    await tx.book.update({
      where: { id: bookId },
      data: { availableCopies: { decrement: 1 } },
    })
    return created
  })

  // Release the cart hold for this book (replaced by the real loan)
  releaseHold(session.user.id, bookId).catch(() => {})

  // Fetch user info once for all emails
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { email: true, username: true, firstname: true, lastname: true },
  })

  // Send confirmation email to the user (non-blocking)
  if (user?.email) {
    if (immediate) {
      sendLoanReceiptEmail({
        to: user.email,
        bookTitle: book.title,
        dueDate: loan.dueDate,
        loanId: loan.id,
      }).catch(() => {})
    } else {
      sendReservationConfirmationEmail({
        to: user.email,
        bookTitle: book.title,
        startDate,
        dueDate,
        loanId: loan.id,
      }).catch(() => {})
    }
  }

  // Notify all admins about new RESERVED loans (non-blocking)
  if (!immediate) {
    prisma.user.findMany({
      where: { role: 'ADMIN' },
      select: { email: true },
    }).then((admins) => {
      const userName = [user?.firstname, user?.lastname].filter(Boolean).join(' ') || user?.username || 'Unbekannt'
      const userEmail = user?.email ?? ''
      for (const admin of admins) {
        if (!admin.email) continue
        sendNewReservationEmail({
          to: admin.email,
          loanId: loan.id,
          bookTitle: book.title,
          bookAuthor: book.author,
          regalnummer: book.regalnummer ?? undefined,
          userName,
          userEmail,
          startDate,
          dueDate,
          handoverMethod: parsed.data.handoverMethod ?? null,
          notes: parsed.data.notes ?? null,
        }).catch(() => {})
      }
    }).catch(() => {})
  }

  return NextResponse.json(loan, { status: 201 })
}
