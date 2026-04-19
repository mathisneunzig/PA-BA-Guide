import 'server-only'
import nodemailer from 'nodemailer'
import { renderTemplate } from './render-template'

function getTransport() {
  const required = ['SMTP_HOST', 'SMTP_PORT', 'SMTP_USER', 'SMTP_PASS']
  for (const key of required) {
    if (!process.env[key]) throw new Error(`Missing environment variable: ${key}`)
  }
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT),
    secure: process.env.SMTP_SECURE === 'true', // true for port 465, false for 587
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  })
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
