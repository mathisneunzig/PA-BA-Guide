import { NextRequest, NextResponse } from 'next/server'
import { verifySession } from '@/lib/auth/dal'
import { prisma } from '@/lib/prisma'
import { upsertHold, releaseHold, refreshHolds, purgeExpiredHolds } from '@/lib/cart/holds'

/**
 * POST /api/cart/hold
 * Body: { bookId: string }  — place or refresh a hold for the current user
 *
 * POST /api/cart/hold  (body: { refresh: true }) — refresh all holds for the user
 */
export async function POST(request: NextRequest) {
  const session = await verifySession()
  if (session.user.role === 'GUEST') {
    return NextResponse.json({ error: 'Guests cannot hold books' }, { status: 403 })
  }

  const body = await request.json()

  // Heartbeat: refresh all holds
  if (body.refresh === true) {
    await refreshHolds(session.user.id)
    return NextResponse.json({ ok: true })
  }

  const { bookId } = body as { bookId?: string }
  if (!bookId) return NextResponse.json({ error: 'bookId required' }, { status: 400 })

  // Verify book exists
  const book = await prisma.book.findUnique({ where: { id: bookId }, select: { id: true } })
  if (!book) return NextResponse.json({ error: 'Book not found' }, { status: 404 })

  // Clean up stale holds opportunistically
  await purgeExpiredHolds()

  await upsertHold(session.user.id, bookId)

  return NextResponse.json({ ok: true })
}

/**
 * DELETE /api/cart/hold
 * Body: { bookId?: string }
 * - If bookId provided → release that single hold
 * - If no bookId       → release ALL holds for the user (on cart clear / checkout)
 */
export async function DELETE(request: NextRequest) {
  const session = await verifySession()

  const body = await request.json().catch(() => ({})) as { bookId?: string }

  if (body.bookId) {
    await releaseHold(session.user.id, body.bookId)
  } else {
    const { releaseAllHolds } = await import('@/lib/cart/holds')
    await releaseAllHolds(session.user.id)
  }

  return NextResponse.json({ ok: true })
}
