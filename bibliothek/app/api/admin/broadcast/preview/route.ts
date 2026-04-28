import { NextRequest, NextResponse } from 'next/server'
import { requireRole } from '@/lib/auth/dal'
import { renderTemplate } from '@/lib/email/render-template'
import { prisma } from '@/lib/prisma'
import type { BroadcastTemplate } from '@/lib/email/send'
import { sendBroadcastEmail } from '@/lib/email/send'

const VALID_TEMPLATES: BroadcastTemplate[] = [
  'broadcast-news',
  'broadcast-maintenance',
  'broadcast-event',
  'broadcast-general',
  'broadcast-changelog',
  'broadcast-newbooks',
]

/**
 * POST /api/admin/broadcast/preview
 * Body: { subject, message, template, timeFrom?, timeTo?, sendTest?: boolean }
 *
 * If sendTest is false/missing: returns rendered HTML for display in browser.
 * If sendTest is true: sends to the test email list from Config("broadcast_test_emails").
 */
export async function POST(request: NextRequest) {
  await requireRole('ADMIN')

  const body = await request.json()
  const { subject, message, template, timeFrom, timeTo, sendTest } = body as {
    subject: string
    message: string
    template: BroadcastTemplate
    timeFrom?: string
    timeTo?: string
    sendTest?: boolean
  }

  if (!subject?.trim() || !message?.trim()) {
    return NextResponse.json({ error: 'Betreff und Nachricht erforderlich' }, { status: 400 })
  }
  if (!VALID_TEMPLATES.includes(template)) {
    return NextResponse.json({ error: 'Ungültige Vorlage' }, { status: 400 })
  }

  const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? ''
  const html = renderTemplate(template, {
    subject: subject.trim(),
    message: message.trim(),
    timeFrom: timeFrom?.trim() ?? undefined,
    timeTo: timeTo?.trim() ?? undefined,
    catalogUrl: `${APP_URL}/books`,
  })

  if (!sendTest) {
    return NextResponse.json({ html })
  }

  // Send to test group
  const config = await prisma.config.findUnique({ where: { key: 'broadcast_test_emails' } })
  const testEmails = config?.value
    ? config.value.split(',').map((e) => e.trim()).filter(Boolean)
    : []

  if (testEmails.length === 0) {
    return NextResponse.json({ error: 'Keine Test-E-Mails konfiguriert. Bitte unter Einstellungen eintragen.' }, { status: 400 })
  }

  let sent = 0
  let failed = 0
  const errors: string[] = []

  for (const email of testEmails) {
    try {
      await sendBroadcastEmail({
        to: email,
        subject: `[TESTMAIL] ${subject.trim()}`,
        message: message.trim(),
        template,
        timeFrom: timeFrom?.trim() || undefined,
        timeTo: timeTo?.trim() || undefined,
      })
      sent++
    } catch (err) {
      failed++
      errors.push(`${email}: ${err instanceof Error ? err.message : String(err)}`)
    }
  }

  return NextResponse.json({ sent, failed, errors })
}
