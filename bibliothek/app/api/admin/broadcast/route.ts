import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireRole } from '@/lib/auth/dal'
import { sendBroadcastEmail, BroadcastTemplate } from '@/lib/email/send'

const VALID_TEMPLATES: BroadcastTemplate[] = [
  'broadcast-news',
  'broadcast-maintenance',
  'broadcast-event',
  'broadcast-general',
  'broadcast-changelog',
  'broadcast-newbooks',
]

/**
 * POST /api/admin/broadcast
 * Body: { subject, message, template, timeFrom?, timeTo? }
 *
 * Sends a broadcast email to all non-GUEST users.
 * Returns { sent: number, failed: number, errors: string[] }
 */
export async function POST(request: NextRequest) {
  await requireRole('ADMIN')

  const body = await request.json()
  const { subject, message, template, timeFrom, timeTo } = body as {
    subject: string
    message: string
    template: BroadcastTemplate
    timeFrom?: string
    timeTo?: string
  }

  if (!subject?.trim()) {
    return NextResponse.json({ error: 'Betreff fehlt' }, { status: 400 })
  }
  if (!message?.trim()) {
    return NextResponse.json({ error: 'Nachricht fehlt' }, { status: 400 })
  }
  if (!VALID_TEMPLATES.includes(template)) {
    return NextResponse.json({ error: 'Ungültige Vorlage' }, { status: 400 })
  }

  const users = await prisma.user.findMany({
    where: { role: { not: 'GUEST' } },
    select: { email: true },
  })

  let sent = 0
  let failed = 0
  const errors: string[] = []

  for (const user of users) {
    if (!user.email) { failed++; continue }
    try {
      await sendBroadcastEmail({
        to: user.email,
        subject: subject.trim(),
        message: message.trim(),
        template,
        timeFrom: timeFrom?.trim() || undefined,
        timeTo: timeTo?.trim() || undefined,
      })
      sent++
    } catch (err) {
      failed++
      errors.push(`${user.email}: ${err instanceof Error ? err.message : String(err)}`)
    }
  }

  return NextResponse.json({ sent, failed, errors })
}
