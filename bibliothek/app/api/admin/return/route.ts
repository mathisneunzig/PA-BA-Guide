import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireRole } from '@/lib/auth/dal'
import { LoanStatus } from '@prisma/client'
import { returnLoanItem } from '@/lib/loans/loan-service'
import { sendBookAvailableEmail } from '@/lib/email/send'

/**
 * POST /api/admin/return
 * Body: { userId: string, bookIds: string[] }  — bookIds are EAN-13 barcodes
 *
 * For each bookId:
 *  1. Find the ACTIVE or OVERDUE LoanItem for this user+book
 *  2. Mark it RETURNED (returnLoanItem handles availableCopies + group status)
 *  3. Find the next RESERVED item for the same book (any user) and notify them
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
      // Find the active/overdue LoanItem for this user+book
      const item = await prisma.loanItem.findFirst({
        where: {
          bookId,
          status: { in: [LoanStatus.ACTIVE, LoanStatus.OVERDUE] },
          group: { userId },
        },
      })

      if (!item) throw new Error('Keine aktive Ausleihe gefunden')

      await returnLoanItem(item.id)

      results.push({ bookId, ok: true })

      // Notify the next person waiting with a RESERVED item
      const nextReservation = await prisma.loanItem.findFirst({
        where: { bookId, status: LoanStatus.RESERVED },
        orderBy: { createdAt: 'asc' },
        include: {
          group: { include: { user: { select: { email: true } } } },
          book: { select: { title: true, regalnummer: true } },
        },
      })
      if (nextReservation?.group.user.email) {
        sendBookAvailableEmail({
          to: nextReservation.group.user.email,
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
