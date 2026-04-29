import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireRole } from '@/lib/auth/dal'

/** GET /api/admin/feedback — list all feedback, newest first */
export async function GET(request: NextRequest) {
  await requireRole('ADMIN')

  const { searchParams } = new URL(request.url)
  const status = searchParams.get('status') || undefined
  const page = Math.max(1, parseInt(searchParams.get('page') ?? '1'))
  const pageSize = 20

  const where = status ? { status: status as never } : {}

  const [items, total] = await Promise.all([
    prisma.feedback.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: {
        user: { select: { id: true, username: true, firstname: true, lastname: true, email: true } },
      },
    }),
    prisma.feedback.count({ where }),
  ])

  return NextResponse.json({ items, total, page, pageSize })
}
