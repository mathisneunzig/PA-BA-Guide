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

const SUPPORTED_LOCALES = ['de', 'en', 'fr', 'es'] as const
type Locale = typeof SUPPORTED_LOCALES[number]

/**
 * POST /api/admin/broadcast/preview
 * Body: { subjects, messages, template, timeFrom?, timeTo?, sendTest?, previewLocale? }
 *
 * If sendTest is false/missing: returns rendered HTML for the previewLocale (default 'de').
 * If sendTest is true: sends to the test email list from Config("broadcast_test_emails").
 */
export async function POST(request: NextRequest) {
  await requireRole('ADMIN')

  const body = await request.json()
  const { subjects, messages, template, timeFrom, timeTo, sendTest, previewLocale } = body as {
    subjects: Record<Locale, string>
    messages: Record<Locale, string>
    template: BroadcastTemplate
    timeFrom?: string
    timeTo?: string
    sendTest?: boolean
    previewLocale?: Locale
  }

  const locale: Locale = (SUPPORTED_LOCALES.includes(previewLocale as Locale) ? previewLocale : 'de') as Locale
  const subject = subjects?.[locale]?.trim() || subjects?.['de']?.trim() || ''
  const message = messages?.[locale]?.trim() || messages?.['de']?.trim() || ''

  if (!subject || !message) {
    return NextResponse.json({ error: 'Subject and message required' }, { status: 400 })
  }
  if (!VALID_TEMPLATES.includes(template)) {
    return NextResponse.json({ error: 'Invalid template' }, { status: 400 })
  }

  const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? ''
  const html = renderTemplate(template, {
    subject,
    message,
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
    return NextResponse.json({ error: 'No test emails configured. Please add them in Settings.' }, { status: 400 })
  }

  let sent = 0
  let failed = 0
  const errors: string[] = []

  for (const email of testEmails) {
    try {
      await sendBroadcastEmail({
        to: email,
        subject: `[TESTMAIL] ${subject}`,
        message,
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
