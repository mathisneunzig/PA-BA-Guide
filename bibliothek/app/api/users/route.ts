import type { NextRequest } from 'next/server'
import { requireRole } from '@/lib/auth/dal'
import { prisma } from '@/lib/prisma'

// GET /api/users — Admin only
export async function GET() {
  await requireRole('ADMIN')

  const users = await prisma.user.findMany({
    select: {
      id: true,
      username: true,
      email: true,
      firstname: true,
      lastname: true,
      phone: true,
      role: true,
      email_verified: true,
      createdAt: true,
      updatedAt: true,
    },
    orderBy: { createdAt: 'desc' },
  })

  return Response.json({ users })
}
