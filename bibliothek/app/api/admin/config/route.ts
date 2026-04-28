import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireRole } from '@/lib/auth/dal'

/**
 * GET /api/admin/config?key=<key>  — read one config value
 * PUT /api/admin/config            — { key, value } upsert a config value
 */

export async function GET(request: NextRequest) {
  await requireRole('ADMIN')
  const key = request.nextUrl.searchParams.get('key')
  if (!key) return NextResponse.json({ error: 'key parameter required' }, { status: 400 })

  const config = await prisma.config.findUnique({ where: { key } })
  return NextResponse.json({ key, value: config?.value ?? '' })
}

export async function PUT(request: NextRequest) {
  await requireRole('ADMIN')
  const body = await request.json()
  const { key, value } = body as { key: string; value: string }

  if (!key?.trim()) return NextResponse.json({ error: 'key required' }, { status: 400 })

  await prisma.config.upsert({
    where: { key },
    update: { value: value ?? '' },
    create: { key, value: value ?? '' },
  })

  return NextResponse.json({ ok: true })
}
