import type { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { LoginSchema } from '@/lib/validation/auth.schemas'
import { verifyPassword } from '@/lib/utils/hash'

// Validates credentials — client then calls signIn('credentials', { email, password }) via Auth.js
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const parsed = LoginSchema.safeParse(body)

    if (!parsed.success) {
      return Response.json({ error: 'Invalid input' }, { status: 400 })
    }

    const { email, password } = parsed.data

    const user = await prisma.user.findUnique({ where: { email } })
    if (!user || !user.password) {
      return Response.json({ error: 'Invalid credentials' }, { status: 401 })
    }

    const valid = await verifyPassword(password, user.password)
    if (!valid) {
      return Response.json({ error: 'Invalid credentials' }, { status: 401 })
    }

    if (!user.email_verified) {
      return Response.json(
        { error: 'Please verify your email address before logging in.' },
        { status: 403 },
      )
    }

    return Response.json({ success: true })
  } catch (error) {
    console.error('[POST /api/auth/login]', error)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
