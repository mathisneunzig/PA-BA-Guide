import type { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get('token')

  if (!token) {
    return Response.json({ error: 'Missing verification token' }, { status: 400 })
  }

  const user = await prisma.user.findUnique({
    where: { email_verify_token: token },
  })

  if (!user) {
    return Response.json({ error: 'Invalid or expired token' }, { status: 400 })
  }

  if (user.email_verify_expires && user.email_verify_expires < new Date()) {
    return Response.json({ error: 'Token has expired' }, { status: 400 })
  }

  if (user.email_verified) {
    return Response.redirect(new URL('/login?verified=already', request.url))
  }

  await prisma.user.update({
    where: { id: user.id },
    data: {
      email_verified: true,
      email_verify_token: null,
      email_verify_expires: null,
    },
  })

  return Response.redirect(new URL('/login?verified=true', request.url))
}
