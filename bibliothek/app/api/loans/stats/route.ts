import { verifySession } from '@/lib/auth/dal'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const session = await verifySession()

  const [activeLoans, overdueLoans] = await Promise.all([
    prisma.loanItem.count({ where: { group: { userId: session.user.id }, status: 'ACTIVE' } }),
    prisma.loanItem.count({ where: { group: { userId: session.user.id }, status: 'OVERDUE' } }),
  ])

  return Response.json({ activeLoans, overdueLoans })
}
