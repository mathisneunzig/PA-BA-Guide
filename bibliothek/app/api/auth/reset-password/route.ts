import type { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { ResetPasswordSchema } from '@/lib/validation/auth.schemas'
import { hashPassword } from '@/lib/utils/hash'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const parsed = ResetPasswordSchema.safeParse(body)

    if (!parsed.success) {
      return Response.json(
        { error: 'Validation failed', details: parsed.error.flatten() },
        { status: 400 },
      )
    }

    const { token, password } = parsed.data

    const user = await prisma.user.findUnique({
      where: { reset_token: token },
    })

    if (!user || !user.reset_token_expires) {
      return Response.json({ error: 'Invalid or expired token' }, { status: 400 })
    }

    if (user.reset_token_expires < new Date()) {
      return Response.json({ error: 'Token has expired' }, { status: 400 })
    }

    const hashedPassword = await hashPassword(password)

    await prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        reset_token: null,
        reset_token_expires: null,
      },
    })

    return Response.json({ message: 'Password reset successfully. You can now log in.' })
  } catch (error) {
    console.error('[POST /api/auth/reset-password]', error)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
