import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireRole } from '@/lib/auth/dal'
import { LoanStatus } from '@prisma/client'
import { sendBookAvailableEmail } from '@/lib/email/send'

/**
 * POST /api/admin/return
 * Body: { userId: string, bookIds: string[] }  — bookIds are EAN-13 barcodes
 *
 * For each bookId:
 *  1. Find the ACTIVE or OVERDUE loan for this user+book
 *  2. Mark it RETURNED, increment availableCopies
 *  3. Find the next RESERVED loan for the same book (any user) and notify them by email
 */
export async function POST(request: NextRequest) {
  await requireRole('ADMIN')

  const body = await request.json()
  const { userId, bookIds } = body as { userId: string; bookIds: string[] }

  if (!userId || !Array.isArray(bookIds) || bookIds.length === 0) {
    return NextResponse.json({ error: 'userId and bookIds required' }, { status: 400 })
  }

  const results: Array<{ bookId: string; ok: boolean; error?: string }> = []

  for (const bookId of bookIds) {
    try {
      await prisma.$transaction(async (tx) => {
        // Find the active/overdue loan for this user+book
        const loan = await tx.loan.findFirst({
          where: {
            bookId,
            userId,
            status: { in: [LoanStatus.ACTIVE, LoanStatus.OVERDUE] },
          },
        })

        if (!loan) {
          throw new Error('Keine aktive Ausleihe gefunden')
        }

        // Mark as returned
        await tx.loan.update({
          where: { id: loan.id },
          data: { status: LoanStatus.RETURNED, returnedAt: new Date() },
        })

        // Increment available copies
        await tx.book.update({
          where: { id: bookId },
          data: { availableCopies: { increment: 1 } },
        })
      })

      results.push({ bookId, ok: true })

      // After transaction: notify the next person waiting with a RESERVED loan
      const nextReservation = await prisma.loan.findFirst({
        where: { bookId, status: LoanStatus.RESERVED },
        orderBy: { createdAt: 'asc' },
        include: {
          user: { select: { email: true } },
          book: { select: { title: true, regalnummer: true } },
        },
      })

      if (nextReservation?.user.email) {
        sendBookAvailableEmail({
          to: nextReservation.user.email,
          bookTitle: nextReservation.book.title,
          regalnummer: nextReservation.book.regalnummer,
        }).catch(() => {})
      }
    } catch (err) {
      results.push({ bookId, ok: false, error: err instanceof Error ? err.message : 'Fehler' })
    }
  }

  return NextResponse.json({ results })
}
