import type { NextRequest } from 'next/server'
import { verifySession } from '@/lib/auth/dal'
import { prisma } from '@/lib/prisma'
import { UpdateUserSchema } from '@/lib/validation/auth.schemas'

// GET /api/users/[id]
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await verifySession()
  const { id } = await params // MUST await in Next.js 16

  if (session.user.id !== id && session.user.role !== 'ADMIN') {
    return Response.json({ error: 'Forbidden' }, { status: 403 })
  }

  const user = await prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      username: true,
      email: true,
      firstname: true,
      lastname: true,
      phone: true,
      role: true,
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
      email_verified: true,
      createdAt: true,
      updatedAt: true,
    },
  })

  if (!user) {
    return Response.json({ error: 'User not found' }, { status: 404 })
  }

  return Response.json({ user })
}

// PUT /api/users/[id]
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await verifySession()
  const { id } = await params

  if (session.user.id !== id && session.user.role !== 'ADMIN') {
    return Response.json({ error: 'Forbidden' }, { status: 403 })
  }

  const body = await request.json()
  const parsed = UpdateUserSchema.safeParse(body)

  if (!parsed.success) {
    return Response.json(
      { error: 'Validation failed', details: parsed.error.flatten() },
      { status: 400 },
    )
  }

  // Only admins may change roles
  if (parsed.data.role && session.user.role !== 'ADMIN') {
    return Response.json({ error: 'Only admins can change roles' }, { status: 403 })
  }

  // Check username uniqueness if changing
  if (parsed.data.username) {
    const existing = await prisma.user.findFirst({
      where: { username: parsed.data.username, NOT: { id } },
    })
    if (existing) {
      return Response.json({ error: 'Username already taken' }, { status: 409 })
    }
  }

  const user = await prisma.user.update({
    where: { id },
    data: parsed.data,
    select: {
      id: true,
      username: true,
      email: true,
      firstname: true,
      lastname: true,
      updatedAt: true,
    },
  })

  return Response.json({ user })
}

// DELETE /api/users/[id]
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await verifySession()
  const { id } = await params

  if (session.user.id !== id && session.user.role !== 'ADMIN') {
    return Response.json({ error: 'Forbidden' }, { status: 403 })
  }

  await prisma.user.delete({ where: { id } })

  return Response.json({ message: 'User deleted successfully' })
}
