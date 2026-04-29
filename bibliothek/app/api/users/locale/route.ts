import type { NextRequest } from 'next/server'
import { verifySession } from '@/lib/auth/dal'
import { prisma } from '@/lib/prisma'
import { SUPPORTED_LOCALES } from '@/lib/i18n/server'

// GET /api/users/locale — returns current user's preferredLocale
export async function GET() {
  const session = await verifySession()
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { preferredLocale: true },
  })
  return Response.json({ locale: user?.preferredLocale ?? 'en' })
}

// PUT /api/users/locale — updates current user's preferredLocale
export async function PUT(request: NextRequest) {
  const session = await verifySession()
  const body = await request.json()
  const { locale } = body

  if (!locale || !SUPPORTED_LOCALES.includes(locale)) {
    return Response.json({ error: 'Invalid locale' }, { status: 400 })
  }

  await prisma.user.update({
    where: { id: session.user.id },
    data: { preferredLocale: locale },
  })

  return Response.json({ locale })
}
