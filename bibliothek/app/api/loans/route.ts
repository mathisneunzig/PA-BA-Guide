import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifySession } from '@/lib/auth/dal'
import { computeDueDate } from '@/lib/loans/loan-service'
import { countOverlappingLoans } from '@/lib/loans/availability'
import { CreateLoanGroupSchema } from '@/lib/validation/loan.schemas'
import {
  sendReservationConfirmationEmail,
  sendLoanReceiptEmail,
  sendNewReservationEmail,
} from '@/lib/email/send'
import { releaseAllHolds } from '@/lib/cart/holds'
import { LoanStatus } from '@prisma/client'

/** GET /api/loans — own loan groups only */
export async function GET(_request: NextRequest) {
  const session = await verifySession()
  const groups = await prisma.loanGroup.findMany({
    where: { userId: session.user.id },
    include: {
      items: {
        include: { book: { select: { id: true, title: true, author: true, regalnummer: true } } },
        orderBy: { createdAt: 'asc' },
      },
    },
    orderBy: { createdAt: 'desc' },
  })
  return NextResponse.json({ groups })
}

/** POST /api/loans — create reservation or direct loan group (STUDENT or ADMIN) */
export async function POST(request: NextRequest) {
  const session = await verifySession()

  if (session.user.role === 'GUEST') {
    return NextResponse.json({ error: 'Guests cannot borrow books' }, { status: 403 })
  }

  const body = await request.json()
  const parsed = CreateLoanGroupSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  const {
    bookIds, startDate: startDateStr, durationDays, notes, immediate,
    handoverMethod, handoverDate, handoverLocation, handoverCost,
  } = parsed.data

  if (immediate && session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Only admins can create direct loans' }, { status: 403 })
  }

  const startDate = immediate ? new Date() : new Date(startDateStr)
  const dueDate = computeDueDate(startDate, durationDays)

  // Validate every book
  const books = await prisma.book.findMany({
    where: { id: { in: bookIds } },
    select: { id: true, totalCopies: true, title: true, author: true, regalnummer: true },
  })

  const bookMap = new Map(books.map((b) => [b.id, b]))
  const missing = bookIds.find((id) => !bookMap.has(id))
  if (missing) {
    return NextResponse.json({ error: `Book not found: ${missing}` }, { status: 404 })
  }

  // Check availability for each book
  for (const bookId of bookIds) {
    const book = bookMap.get(bookId)!
    const overlapping = await countOverlappingLoans(bookId, startDate, dueDate, session.user.id)
    if (overlapping >= book.totalCopies) {
      return NextResponse.json(
        { error: `Keine Exemplare verfügbar für: ${book.title}` },
        { status: 409 },
      )
    }
  }

  // Create group + items in one transaction
  const group = await prisma.$transaction(async (tx) => {
    const created = await tx.loanGroup.create({
      data: {
        userId: session.user.id,
        startDate,
        dueDate,
        loanDurationDays: durationDays,
        notes: notes ?? null,
        status: immediate ? LoanStatus.ACTIVE : LoanStatus.RESERVED,
        handoverMethod: handoverMethod ?? null,
        handoverDate: handoverDate ? new Date(handoverDate) : null,
        handoverLocation: handoverLocation ?? null,
        handoverCost: handoverCost != null ? handoverCost : null,
        items: {
          create: bookIds.map((bookId) => ({
            bookId,
            status: immediate ? LoanStatus.ACTIVE : LoanStatus.RESERVED,
          })),
        },
      },
      include: {
        items: { include: { book: { select: { id: true, title: true, author: true } } } },
      },
    })

    // Decrement availableCopies for each book
    for (const bookId of bookIds) {
      await tx.book.update({
        where: { id: bookId },
        data: { availableCopies: { decrement: 1 } },
      })
    }

    return created
  })

  // Release all cart holds for this user (replaced by real loans)
  releaseAllHolds(session.user.id).catch(() => {})

  // Fetch user info for emails
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { email: true, username: true, firstname: true, lastname: true },
  })

  const bookTitles = group.items.map((i) => i.book.title)

  if (user?.email) {
    if (immediate) {
      sendLoanReceiptEmail({
        to: user.email,
        bookTitles,
        dueDate: group.dueDate,
        groupId: group.id,
      }).catch(() => {})
    } else {
      sendReservationConfirmationEmail({
        to: user.email,
        bookTitles,
        startDate,
        dueDate,
        groupId: group.id,
      }).catch(() => {})
    }
  }

  // Notify admins about new RESERVED groups
  if (!immediate) {
    prisma.user.findMany({
      where: { role: 'ADMIN' },
      select: { email: true },
    }).then((admins) => {
      const userName = [user?.firstname, user?.lastname].filter(Boolean).join(' ') || user?.username || 'Unbekannt'
      const userEmail = user?.email ?? ''
      const booksWithDetails = group.items.map((i) => ({
        title: i.book.title,
        author: i.book.author,
        regalnummer: bookMap.get(i.book.id)?.regalnummer ?? null,
      }))
      for (const admin of admins) {
        if (!admin.email) continue
        sendNewReservationEmail({
          to: admin.email,
          books: booksWithDetails,
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

  return NextResponse.json(group, { status: 201 })
}
