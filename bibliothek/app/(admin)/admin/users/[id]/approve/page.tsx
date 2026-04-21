import { notFound, redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { requireRole } from '@/lib/auth/dal'
import ApproveUserClient from './ApproveUserClient'

type Params = { params: Promise<{ id: string }> }

export default async function ApproveUserPage({ params }: Params) {
  await requireRole('ADMIN')
  const { id } = await params

  const user = await prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      firstname: true,
      lastname: true,
      username: true,
      email: true,
      phone: true,
      role: true,
      email_verified: true,
      createdAt: true,
      street: true,
      housenr: true,
      zipcode: true,
      city: true,
      country: true,
    },
  })

  if (!user) notFound()

  return <ApproveUserClient user={user} />
}
