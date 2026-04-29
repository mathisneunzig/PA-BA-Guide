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

const SUPPORTED_LOCALES = ['de', 'en', 'fr', 'es'] as const
type Locale = typeof SUPPORTED_LOCALES[number]

/**
 * POST /api/admin/broadcast
 * Body: { subjects, messages, template, timeFrom?, timeTo? }
 *   subjects: Record<Locale, string> — per-language subject
 *   messages: Record<Locale, string> — per-language message body
 *
 * Each user receives the email in their preferredLocale (default 'en').
 * Returns { sent: number, failed: number, errors: string[] }
 */
export async function POST(request: NextRequest) {
  await requireRole('ADMIN')

  const body = await request.json()
  const { subjects, messages, template, timeFrom, timeTo } = body as {
    subjects: Record<Locale, string>
    messages: Record<Locale, string>
    template: BroadcastTemplate
    timeFrom?: string
    timeTo?: string
  }

  if (!subjects || !messages) {
    return NextResponse.json({ error: 'subjects and messages required' }, { status: 400 })
  }
  if (!subjects['de']?.trim() || !messages['de']?.trim()) {
    return NextResponse.json({ error: 'German (DE) subject and message are required' }, { status: 400 })
  }
  if (!VALID_TEMPLATES.includes(template)) {
    return NextResponse.json({ error: 'Invalid template' }, { status: 400 })
  }

  // Broadcast emails require marketing consent
  const users = await prisma.user.findMany({
    where: { role: { not: 'GUEST' }, marketingConsent: true },
    select: { email: true, preferredLocale: true },
  })

  let sent = 0
  let failed = 0
  const errors: string[] = []

  for (const user of users) {
    if (!user.email) { failed++; continue }
    const locale = (SUPPORTED_LOCALES.includes(user.preferredLocale as Locale) ? user.preferredLocale : 'en') as Locale
    const subject = subjects[locale]?.trim() || subjects['en']?.trim() || subjects['de']?.trim()
    const message = messages[locale]?.trim() || messages['en']?.trim() || messages['de']?.trim()

    try {
      await sendBroadcastEmail({
        to: user.email,
        subject,
        message,
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
