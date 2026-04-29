import 'server-only'
import { LoanStatus } from '@prisma/client'
import { prisma } from '@/lib/prisma'

/**
 * Return the earliest date a book could be available.
 * - If availableCopies > 0 → today
 * - Otherwise → the day after the earliest active/reserved item's group dueDate
 */
export async function getEarliestAvailableDate(bookId: string): Promise<Date> {
  const book = await prisma.book.findUniqueOrThrow({
    where: { id: bookId },
    select: { availableCopies: true },
  })
  if (book.availableCopies > 0) return new Date()

  const earliest = await prisma.loanItem.findFirst({
    where: {
      bookId,
      status: { in: [LoanStatus.ACTIVE, LoanStatus.RESERVED] },
    },
    orderBy: { group: { dueDate: 'asc' } },
    select: { group: { select: { dueDate: true } } },
  })

  if (!earliest) return new Date()

  const next = new Date(earliest.group.dueDate)
  next.setDate(next.getDate() + 1)
  return next
}

/**
 * Count how many ACTIVE or RESERVED loan items overlap with [startDate, endDate].
 * Also counts active CartHolds from other users (not the requesting user),
 * so that cart reservations block concurrent reservations.
 */
export async function countOverlappingLoans(
  bookId: string,
  startDate: Date,
  endDate: Date,
  excludeHoldsForUserId?: string,
): Promise<number> {
  const [itemCount, holdCount] = await Promise.all([
    prisma.loanItem.count({
      where: {
        bookId,
        status: { in: [LoanStatus.ACTIVE, LoanStatus.RESERVED] },
        group: {
          startDate: { lte: endDate },
          dueDate: { gte: startDate },
        },
      },
    }),
    prisma.cartHold.count({
      where: {
        bookId,
        expiresAt: { gt: new Date() },
        ...(excludeHoldsForUserId ? { userId: { not: excludeHoldsForUserId } } : {}),
      },
    }),
  ])
  return itemCount + holdCount
}
