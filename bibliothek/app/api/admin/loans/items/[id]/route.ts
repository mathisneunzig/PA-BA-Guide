import { NextRequest, NextResponse } from 'next/server'
import { requireRole } from '@/lib/auth/dal'
import { returnLoanItem, cancelLoanItem, markLoanItemOverdue } from '@/lib/loans/loan-service'
import { UpdateItemSchema } from '@/lib/validation/loan.schemas'
import { prisma } from '@/lib/prisma'
import { sendBookAvailableEmail } from '@/lib/email/send'

type Params = { params: Promise<{ id: string }> }

/** PATCH /api/admin/loans/items/[id] — individual item state transitions */
export async function PATCH(request: NextRequest, { params }: Params) {
  await requireRole('ADMIN')
  const { id } = await params

  const body = await request.json()
  const parsed = UpdateItemSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  try {
    if (parsed.data.status === 'RETURNED') {
      // Get bookId before returning
      const item = await prisma.loanItem.findUniqueOrThrow({ where: { id } })
      await returnLoanItem(id)

      // Notify next person waiting for this book
      const nextReservation = await prisma.loanItem.findFirst({
        where: { bookId: item.bookId, status: 'RESERVED' },
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

      const updated = await prisma.loanItem.findUniqueOrThrow({ where: { id } })
      return NextResponse.json(updated)
    }

    if (parsed.data.status === 'CANCELLED') {
      await cancelLoanItem(id)
      const updated = await prisma.loanItem.findUniqueOrThrow({ where: { id } })
      return NextResponse.json(updated)
    }

    if (parsed.data.status === 'OVERDUE') {
      await markLoanItemOverdue(id)
      const updated = await prisma.loanItem.findUniqueOrThrow({ where: { id } })
      return NextResponse.json(updated)
    }

    return NextResponse.json({ error: 'Unknown status' }, { status: 400 })
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Update failed' },
      { status: 400 },
    )
  }
}
