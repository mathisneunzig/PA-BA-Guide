import type { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { ForgotPasswordSchema } from '@/lib/validation/auth.schemas'
import { generateToken } from '@/lib/utils/token'
import { sendPasswordResetEmail } from '@/lib/email/send'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const parsed = ForgotPasswordSchema.safeParse(body)

    if (!parsed.success) {
      return Response.json({ error: 'Invalid email address' }, { status: 400 })
    }

    const { email } = parsed.data
    const user = await prisma.user.findUnique({ where: { email } })

    // Always return success to prevent user enumeration
    if (!user) {
      return Response.json({
        message: 'If that email is registered, you will receive a reset link.',
      })
    }

    const token = generateToken()
    await prisma.user.update({
      where: { id: user.id },
      data: {
        reset_token: token,
        reset_token_expires: new Date(Date.now() + 60 * 60 * 1000), // 1h
      },
    })

    await sendPasswordResetEmail({ to: email, token })

    return Response.json({
      message: 'If that email is registered, you will receive a reset link.',
    })
  } catch (error) {
    console.error('[POST /api/auth/forgot-password]', error)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
