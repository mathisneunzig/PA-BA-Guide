import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifySession } from '@/lib/auth/dal'
import { cancelLoanItem } from '@/lib/loans/loan-service'

type Params = { params: Promise<{ id: string }> }

/** GET /api/loans/[id] — get a single loan group (owner or admin) */
export async function GET(_request: NextRequest, { params }: Params) {
  const session = await verifySession()
  const { id } = await params

  const group = await prisma.loanGroup.findUnique({
    where: { id },
    include: {
      items: {
        include: { book: { select: { id: true, title: true, author: true, regalnummer: true } } },
        orderBy: { createdAt: 'asc' },
      },
    },
  })
  if (!group) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  if (group.userId !== session.user.id && session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  return NextResponse.json(group)
}

/**
 * DELETE /api/loans/[id] — cancel a single LoanItem (users can only cancel RESERVED items).
 * [id] here is the LoanItem id.
 */
export async function DELETE(_request: NextRequest, { params }: Params) {
  const session = await verifySession()
  const { id } = await params

  const item = await prisma.loanItem.findUnique({
    where: { id },
    include: { group: { select: { userId: true } } },
  })
  if (!item) return NextResponse.json({ error: 'Item not found' }, { status: 404 })

  if (item.group.userId !== session.user.id && session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  if (session.user.role !== 'ADMIN' && item.status !== 'RESERVED') {
    return NextResponse.json({ error: 'You can only cancel reserved items' }, { status: 403 })
  }

  try {
    await cancelLoanItem(id)
    return NextResponse.json({ success: true })
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Cancel failed' }, { status: 400 })
  }
}
