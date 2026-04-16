import 'server-only'
import { LoanStatus } from '@prisma/client'
import { prisma } from '@/lib/prisma'

// ── Pure helpers ──────────────────────────────────────────────────────────────

export function computeDueDate(start: Date, days: number): Date {
  const d = new Date(start)
  d.setDate(d.getDate() + days)
  return d
}

export function isOverdue(dueDate: Date): boolean {
  return dueDate.getTime() < Date.now()
}

// ── State machine ─────────────────────────────────────────────────────────────

/** RESERVED → ACTIVE: recompute dueDate from now using original loanDurationDays. */
export async function activateLoan(id: string) {
  return prisma.$transaction(async (tx) => {
    const loan = await tx.loan.findUniqueOrThrow({ where: { id } })
    if (loan.status !== LoanStatus.RESERVED) {
      throw new Error(`Cannot activate loan with status ${loan.status}`)
    }
    const now = new Date()
    return tx.loan.update({
      where: { id },
      data: {
        status: LoanStatus.ACTIVE,
        startDate: now,
        dueDate: computeDueDate(now, loan.loanDurationDays),
      },
    })
  })
}

/** ACTIVE | OVERDUE → RETURNED: increment availableCopies. */
export async function returnLoan(id: string) {
  return prisma.$transaction(async (tx) => {
    const loan = await tx.loan.findUniqueOrThrow({ where: { id } })
    if (loan.status !== LoanStatus.ACTIVE && loan.status !== LoanStatus.OVERDUE) {
      throw new Error(`Cannot return loan with status ${loan.status}`)
    }
    await tx.loan.update({
      where: { id },
      data: { status: LoanStatus.RETURNED, returnedAt: new Date() },
    })
    await tx.book.update({
      where: { id: loan.bookId },
      data: { availableCopies: { increment: 1 } },
    })
  })
}

/** RESERVED → CANCELLED: increment availableCopies. */
export async function cancelLoan(id: string) {
  return prisma.$transaction(async (tx) => {
    const loan = await tx.loan.findUniqueOrThrow({ where: { id } })
    if (loan.status !== LoanStatus.RESERVED) {
      throw new Error(`Cannot cancel loan with status ${loan.status}`)
    }
    await tx.loan.update({
      where: { id },
      data: { status: LoanStatus.CANCELLED },
    })
    await tx.book.update({
      where: { id: loan.bookId },
      data: { availableCopies: { increment: 1 } },
    })
  })
}
