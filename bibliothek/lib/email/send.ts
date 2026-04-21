import 'server-only'
import nodemailer from 'nodemailer'
import type SMTPTransport from 'nodemailer/lib/smtp-transport'
import { renderTemplate } from './render-template'

let _transport: nodemailer.Transporter<SMTPTransport.SentMessageInfo> | null = null

function getTransport() {
  if (_transport) return _transport
  const required = ['SMTP_HOST', 'SMTP_PORT', 'SMTP_USER', 'SMTP_PASS']
  for (const key of required) {
    if (!process.env[key]) throw new Error(`Missing environment variable: ${key}`)
  }
  _transport = nodemailer.createTransport<SMTPTransport.SentMessageInfo>({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT),
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
    socketTimeout: 10000,
    greetingTimeout: 10000,
    connectionTimeout: 10000,
  } as SMTPTransport.Options)
  return _transport
}

const FROM = () => process.env.EMAIL_FROM ?? process.env.SMTP_USER!
const APP_URL = () => process.env.NEXT_PUBLIC_APP_URL ?? ''

export async function sendVerificationEmail({
  to,
  token,
}: {
  to: string
  token: string
}) {
  const url = `${APP_URL()}/api/auth/verify-email?token=${token}`
  return getTransport().sendMail({
    from: FROM(),
    to,
    subject: 'E-Mail-Adresse bestätigen',
    html: renderTemplate('verification', { url }),
  })
}

export async function sendPasswordResetEmail({
  to,
  token,
}: {
  to: string
  token: string
}) {
  const url = `${APP_URL()}/reset-password?token=${token}`
  return getTransport().sendMail({
    from: FROM(),
    to,
    subject: 'Passwort zurücksetzen',
    html: renderTemplate('password-reset', { url }),
  })
}

export async function sendReservationConfirmationEmail({
  to,
  bookTitle,
  startDate,
  dueDate,
  loanId,
}: {
  to: string
  bookTitle: string
  startDate: Date
  dueDate: Date
  loanId: string
}) {
  return getTransport().sendMail({
    from: FROM(),
    to,
    subject: `Reservierung bestätigt: ${bookTitle}`,
    html: renderTemplate('reservation-confirmation', {
      bookTitle,
      startDate: startDate.toLocaleDateString('de-DE'),
      dueDate: dueDate.toLocaleDateString('de-DE'),
      loanUrl: `${APP_URL()}/my-loans/${loanId}`,
    }),
  })
}

export async function sendBookAvailableEmail({
  to,
  bookTitle,
  regalnummer,
}: {
  to: string
  bookTitle: string
  regalnummer?: string | null
}) {
  return getTransport().sendMail({
    from: FROM(),
    to,
    subject: `Dein Buch ist abholbereit: ${bookTitle}`,
    html: renderTemplate('book-available', {
      bookTitle,
      regalnummer: regalnummer ?? null,
      loansUrl: `${APP_URL()}/my-loans`,
    }),
  })
}

export type BroadcastTemplate = 'broadcast-news' | 'broadcast-maintenance' | 'broadcast-event' | 'broadcast-general' | 'broadcast-changelog' | 'broadcast-newbooks'

export async function sendBroadcastEmail({
  to,
  subject,
  message,
  template,
  timeFrom,
  timeTo,
}: {
  to: string
  subject: string
  message: string
  template: BroadcastTemplate
  timeFrom?: string
  timeTo?: string
}) {
  return getTransport().sendMail({
    from: FROM(),
    to,
    subject,
    html: renderTemplate(template, {
      subject,
      message,
      timeFrom,
      timeTo,
      catalogUrl: `${APP_URL()}/books`,
    }),
  })
}

export async function sendLoanReceiptEmail({
  to,
  bookTitle,
  dueDate,
  loanId,
}: {
  to: string
  bookTitle: string
  dueDate: Date
  loanId: string
}) {
  return getTransport().sendMail({
    from: FROM(),
    to,
    subject: `Ausgeliehen: ${bookTitle}`,
    html: renderTemplate('loan-receipt', {
      bookTitle,
      dueDate: dueDate.toLocaleDateString('de-DE'),
      loanUrl: `${APP_URL()}/my-loans/${loanId}`,
    }),
  })
}

export async function sendNewReservationEmail({
  to,
  loanId,
  bookTitle,
  bookAuthor,
  regalnummer,
  userName,
  userEmail,
  startDate,
  dueDate,
  handoverMethod,
  notes,
}: {
  to: string
  loanId: string
  bookTitle: string
  bookAuthor: string
  regalnummer?: string | null
  userName: string
  userEmail: string
  startDate: Date
  dueDate: Date
  handoverMethod?: string | null
  notes?: string | null
}) {
  const HANDOVER_LABEL: Record<string, string> = {
    PICKUP: 'Abholung',
    MEETINGPOINT: 'Treffpunkt',
    SHIPPING: 'Versand',
    DROPOFF: 'Vorbeibringen',
  }
  return getTransport().sendMail({
    from: FROM(),
    to,
    subject: `Neue Reservierung: „${bookTitle}" von ${userName}`,
    html: renderTemplate('new-reservation', {
      bookTitle,
      bookAuthor,
      regalnummer: regalnummer ?? null,
      userName,
      userEmail,
      startDate: startDate.toLocaleDateString('de-DE'),
      dueDate: dueDate.toLocaleDateString('de-DE'),
      handoverMethod: handoverMethod ? (HANDOVER_LABEL[handoverMethod] ?? handoverMethod) : null,
      notes: notes ?? null,
      activateUrl: `${APP_URL()}/admin/loans?status=RESERVED`,
    }),
  })
}
  to,
  userId,
  firstname,
  lastname,
  username,
  email,
  phone,
  registeredAt,
}: {
  to: string
  userId: string
  firstname: string
  lastname: string
  username: string
  email: string
  phone?: string | null
  registeredAt: Date
}) {
  return getTransport().sendMail({
    from: FROM(),
    to,
    subject: `Neue Registrierung: ${firstname} ${lastname} (@${username})`,
    html: renderTemplate('new-guest-registration', {
      firstname,
      lastname,
      username,
      email,
      phone: phone ?? null,
      registeredAt: registeredAt.toLocaleString('de-DE'),
      approveUrl: `${APP_URL()}/admin/users/${userId}/approve`,
      usersUrl: `${APP_URL()}/admin/users`,
    }),
  })
}
