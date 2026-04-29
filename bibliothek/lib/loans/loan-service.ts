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

// ── Group-level state machine ─────────────────────────────────────────────────

/** Recompute aggregate group status from item statuses. */
function deriveGroupStatus(itemStatuses: LoanStatus[]): LoanStatus {
  if (itemStatuses.every((s) => s === LoanStatus.CANCELLED)) return LoanStatus.CANCELLED
  if (itemStatuses.every((s) => s === LoanStatus.RETURNED || s === LoanStatus.CANCELLED)) return LoanStatus.RETURNED
  if (itemStatuses.some((s) => s === LoanStatus.OVERDUE)) return LoanStatus.OVERDUE
  if (itemStatuses.some((s) => s === LoanStatus.ACTIVE)) return LoanStatus.ACTIVE
  return LoanStatus.RESERVED
}

/**
 * RESERVED → ACTIVE:
 * All RESERVED items become ACTIVE. Group startDate/dueDate recalculated from now.
 */
export async function activateLoanGroup(groupId: string) {
  return prisma.$transaction(async (tx) => {
    const group = await tx.loanGroup.findUniqueOrThrow({
      where: { id: groupId },
      include: { items: true },
    })
    if (group.status !== LoanStatus.RESERVED) {
      throw new Error(`Cannot activate loan group with status ${group.status}`)
    }
    const now = new Date()
    const dueDate = computeDueDate(now, group.loanDurationDays)

    await tx.loanItem.updateMany({
      where: { groupId, status: LoanStatus.RESERVED },
      data: { status: LoanStatus.ACTIVE },
    })

    return tx.loanGroup.update({
      where: { id: groupId },
      data: { status: LoanStatus.ACTIVE, startDate: now, dueDate },
      include: { items: { include: { book: true } } },
    })
  })
}

/**
 * Cancel entire group: all non-terminal items → CANCELLED.
 * Increments availableCopies for each cancelled book.
 */
export async function cancelLoanGroup(groupId: string) {
  return prisma.$transaction(async (tx) => {
    const group = await tx.loanGroup.findUniqueOrThrow({
      where: { id: groupId },
      include: { items: { where: { status: { in: [LoanStatus.RESERVED, LoanStatus.ACTIVE] } } } },
    })

    for (const item of group.items) {
      await tx.loanItem.update({
        where: { id: item.id },
        data: { status: LoanStatus.CANCELLED },
      })
      await tx.book.update({
        where: { id: item.bookId },
        data: { availableCopies: { increment: 1 } },
      })
    }

    return tx.loanGroup.update({
      where: { id: groupId },
      data: { status: LoanStatus.CANCELLED },
    })
  })
}

// ── Item-level state machine ──────────────────────────────────────────────────

/**
 * Return a single item: ACTIVE | OVERDUE → RETURNED.
 * Increments availableCopies and recomputes group aggregate status.
 */
export async function returnLoanItem(itemId: string) {
  return prisma.$transaction(async (tx) => {
    const item = await tx.loanItem.findUniqueOrThrow({ where: { id: itemId } })
    if (item.status !== LoanStatus.ACTIVE && item.status !== LoanStatus.OVERDUE) {
      throw new Error(`Cannot return item with status ${item.status}`)
    }

    await tx.loanItem.update({
      where: { id: itemId },
      data: { status: LoanStatus.RETURNED, returnedAt: new Date() },
    })

    await tx.book.update({
      where: { id: item.bookId },
      data: { availableCopies: { increment: 1 } },
    })

    // Recompute group aggregate status
    const siblings = await tx.loanItem.findMany({ where: { groupId: item.groupId } })
    const updatedStatuses = siblings.map((s) => (s.id === itemId ? LoanStatus.RETURNED : s.status))
    const newGroupStatus = deriveGroupStatus(updatedStatuses)

    return tx.loanGroup.update({
      where: { id: item.groupId },
      data: { status: newGroupStatus },
    })
  })
}

/**
 * Cancel a single item: RESERVED | ACTIVE → CANCELLED.
 * Increments availableCopies and recomputes group aggregate status.
 */
export async function cancelLoanItem(itemId: string) {
  return prisma.$transaction(async (tx) => {
    const item = await tx.loanItem.findUniqueOrThrow({ where: { id: itemId } })
    if (item.status !== LoanStatus.RESERVED && item.status !== LoanStatus.ACTIVE) {
      throw new Error(`Cannot cancel item with status ${item.status}`)
    }

    await tx.loanItem.update({
      where: { id: itemId },
      data: { status: LoanStatus.CANCELLED },
    })

    await tx.book.update({
      where: { id: item.bookId },
      data: { availableCopies: { increment: 1 } },
    })

    // Recompute group aggregate status
    const siblings = await tx.loanItem.findMany({ where: { groupId: item.groupId } })
    const updatedStatuses = siblings.map((s) => (s.id === itemId ? LoanStatus.CANCELLED : s.status))
    const newGroupStatus = deriveGroupStatus(updatedStatuses)

    return tx.loanGroup.update({
      where: { id: item.groupId },
      data: { status: newGroupStatus },
    })
  })
}

/**
 * Mark a single ACTIVE item as OVERDUE. Updates group status too.
 */
export async function markLoanItemOverdue(itemId: string) {
  return prisma.$transaction(async (tx) => {
    const item = await tx.loanItem.findUniqueOrThrow({ where: { id: itemId } })
    if (item.status !== LoanStatus.ACTIVE) {
      throw new Error(`Cannot mark item with status ${item.status} as overdue`)
    }

    await tx.loanItem.update({
      where: { id: itemId },
      data: { status: LoanStatus.OVERDUE },
    })

    const siblings = await tx.loanItem.findMany({ where: { groupId: item.groupId } })
    const updatedStatuses = siblings.map((s) => (s.id === itemId ? LoanStatus.OVERDUE : s.status))
    const newGroupStatus = deriveGroupStatus(updatedStatuses)

    return tx.loanGroup.update({
      where: { id: item.groupId },
      data: { status: newGroupStatus },
    })
  })
}
