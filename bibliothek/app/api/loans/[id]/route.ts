import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifySession, requireRole } from '@/lib/auth/dal'
import { activateLoan, returnLoan, cancelLoan } from '@/lib/loans/loan-service'
import { UpdateLoanSchema } from '@/lib/validation/loan.schemas'
import { sendLoanReceiptEmail } from '@/lib/email/send'

type Params = { params: Promise<{ id: string }> }

/** GET /api/loans/[id] — own loan or admin */
export async function GET(_request: NextRequest, { params }: Params) {
  const session = await verifySession()
  const { id } = await params

  const loan = await prisma.loan.findUnique({
    where: { id },
    include: { book: true },
  })
  if (!loan) return NextResponse.json({ error: 'Loan not found' }, { status: 404 })

  if (loan.userId !== session.user.id && session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  return NextResponse.json(loan)
}

/** PUT /api/loans/[id] — admin only: change status or update notes/dueDate */
export async function PUT(request: NextRequest, { params }: Params) {
  await requireRole('ADMIN')
  const { id } = await params

  const body = await request.json()
  const parsed = UpdateLoanSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  const { status, dueDate, notes } = parsed.data

  try {
    if (status === 'ACTIVE') {
      const loan = await activateLoan(id)

      const [user, book] = await Promise.all([
        prisma.user.findUnique({ where: { id: loan.userId }, select: { email: true } }),
        prisma.book.findUnique({ where: { id: loan.bookId }, select: { title: true } }),
      ])
      if (user?.email && book?.title) {
        sendLoanReceiptEmail({
          to: user.email,
          bookTitle: book.title,
          dueDate: loan.dueDate,
          loanId: loan.id,
        }).catch(() => {})
      }
      return NextResponse.json(loan)
    }

    if (status === 'RETURNED') {
      await returnLoan(id)
      const loan = await prisma.loan.findUniqueOrThrow({ where: { id } })
      return NextResponse.json(loan)
    }

    if (status === 'CANCELLED') {
      await cancelLoan(id)
      const loan = await prisma.loan.findUniqueOrThrow({ where: { id } })
      return NextResponse.json(loan)
    }

    if (status === 'OVERDUE') {
      // Admin can manually mark an active loan as overdue
      const loan = await prisma.loan.findUniqueOrThrow({ where: { id } })
      if (loan.status !== 'ACTIVE') {
        return NextResponse.json({ error: `Cannot mark loan ${loan.status} as overdue` }, { status: 400 })
      }
      const updated = await prisma.loan.update({
        where: { id },
        data: { status: 'OVERDUE' },
      })
      return NextResponse.json(updated)
    }

    // General update (notes, dueDate extension) — no status change
    const updated = await prisma.loan.update({
      where: { id },
      data: {
        ...(notes !== undefined && { notes }),
        ...(dueDate && { dueDate: new Date(dueDate) }),
      },
    })
    return NextResponse.json(updated)
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Update failed'
    return NextResponse.json({ error: message }, { status: 400 })
  }
}

/** DELETE /api/loans/[id] — users can cancel RESERVED loans only; admins can cancel any non-terminal loan */
export async function DELETE(_request: NextRequest, { params }: Params) {
  const session = await verifySession()
  const { id } = await params

  const loan = await prisma.loan.findUnique({ where: { id }, select: { userId: true, status: true } })
  if (!loan) return NextResponse.json({ error: 'Loan not found' }, { status: 404 })

  if (loan.userId !== session.user.id && session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  // Non-admins can only cancel their own RESERVED loans
  if (session.user.role !== 'ADMIN' && loan.status !== 'RESERVED') {
    return NextResponse.json({ error: 'You can only cancel reservations, not active loans' }, { status: 403 })
  }

  try {
    await cancelLoan(id)
    return NextResponse.json({ success: true })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Cancel failed'
    return NextResponse.json({ error: message }, { status: 400 })
  }
}
