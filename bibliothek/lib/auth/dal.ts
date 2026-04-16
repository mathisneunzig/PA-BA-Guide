import 'server-only'
import { cache } from 'react'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import type { Role } from '@prisma/client'

export const verifySession = cache(async () => {
  const session = await auth()
  if (!session?.user?.id) {
    redirect('/login')
  }
  return session
})

export const getSessionUser = cache(async () => {
  const session = await verifySession()
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      email: true,
      username: true,
      firstname: true,
      lastname: true,
      phone: true,
      role: true,
      email_verified: true,
      street: true,
      housenr: true,
      zipcode: true,
      city: true,
      country: true,
      del_street: true,
      del_housenr: true,
      del_zipcode: true,
      del_city: true,
      del_country: true,
      createdAt: true,
    },
  })
  return user
})

export const requireRole = cache(async (role: Role) => {
  const session = await verifySession()
  if (session.user.role !== role) {
    redirect('/dashboard')
  }
  return session
})
