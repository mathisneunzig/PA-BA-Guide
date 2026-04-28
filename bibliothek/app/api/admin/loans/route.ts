import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireRole } from '@/lib/auth/dal'
import { LoanStatus } from '@prisma/client'

/** GET /api/admin/loans — all loan groups with filter + pagination (admin only) */
export async function GET(request: NextRequest) {
  await requireRole('ADMIN')

  const sp = request.nextUrl.searchParams
  const status = sp.get('status') as LoanStatus | null
  const userId = sp.get('userId') ?? undefined
  const page = Math.max(1, parseInt(sp.get('page') ?? '1', 10))
  const limit = Math.min(100, Math.max(1, parseInt(sp.get('limit') ?? '20', 10)))
  const skip = (page - 1) * limit

  const where = {
    ...(status && { status }),
    ...(userId && { userId }),
  }

  const [groups, total] = await Promise.all([
    prisma.loanGroup.findMany({
      where,
      include: {
        user: { select: { id: true, username: true, email: true } },
        items: {
          include: { book: { select: { id: true, title: true, author: true, regalnummer: true } } },
          orderBy: { createdAt: 'asc' },
        },
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    }),
    prisma.loanGroup.count({ where }),
  ])

  return NextResponse.json({ groups, total, page, limit, pages: Math.ceil(total / limit) })
}
