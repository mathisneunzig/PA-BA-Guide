import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireRole } from '@/lib/auth/dal'
import { activateLoanGroup, cancelLoanGroup } from '@/lib/loans/loan-service'
import { sendLoanReceiptEmail } from '@/lib/email/send'
import { UpdateGroupSchema } from '@/lib/validation/loan.schemas'

type Params = { params: Promise<{ id: string }> }

/** PATCH /api/admin/loans/[id] — group-level actions: activate, cancel, extend dueDate */
export async function PATCH(request: NextRequest, { params }: Params) {
  await requireRole('ADMIN')
  const { id } = await params

  const body = await request.json()
  const parsed = UpdateGroupSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  const { status, dueDate, notes } = parsed.data

  try {
    if (status === 'ACTIVE') {
      const group = await activateLoanGroup(id)

      // Send receipt email to user
      const [user] = await Promise.all([
        prisma.user.findUnique({ where: { id: group.userId }, select: { email: true } }),
      ])
      if (user?.email) {
        sendLoanReceiptEmail({
          to: user.email,
          bookTitles: group.items.map((i) => i.book.title),
          dueDate: group.dueDate,
          groupId: group.id,
        }).catch(() => {})
      }
      return NextResponse.json(group)
    }

    if (status === 'CANCELLED') {
      const group = await cancelLoanGroup(id)
      return NextResponse.json(group)
    }

    // General update (notes, dueDate extension)
    const updated = await prisma.loanGroup.update({
      where: { id },
      data: {
        ...(notes !== undefined && { notes }),
        ...(dueDate && { dueDate: new Date(dueDate) }),
      },
      include: { items: { include: { book: { select: { id: true, title: true, author: true } } } } },
    })
    return NextResponse.json(updated)
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Update failed' },
      { status: 400 },
    )
  }
}
