import 'server-only'
import nodemailer from 'nodemailer'

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

export async function sendVerificationEmail({
  to,
  token,
}: {
  to: string
  token: string
}) {
  const url = `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/verify-email?token=${token}`
  return getTransport().sendMail({
    from: FROM(),
    to,
    subject: 'Verify your email address',
    html: `
      <h2>Welcome! Please verify your email.</h2>
      <p>Click the link below to verify your email address. This link expires in 24 hours.</p>
      <a href="${url}" style="display:inline-block;padding:12px 24px;background:#0070f3;color:#fff;text-decoration:none;border-radius:6px;">Verify Email</a>
      <p>Or copy this link: ${url}</p>
    `,
  })
}

export async function sendPasswordResetEmail({
  to,
  token,
}: {
  to: string
  token: string
}) {
  const url = `${process.env.NEXT_PUBLIC_APP_URL}/reset-password?token=${token}`
  return getTransport().sendMail({
    from: FROM(),
    to,
    subject: 'Reset your password',
    html: `
      <h2>Password Reset Request</h2>
      <p>Click the link below to reset your password. This link expires in 1 hour.</p>
      <a href="${url}" style="display:inline-block;padding:12px 24px;background:#0070f3;color:#fff;text-decoration:none;border-radius:6px;">Reset Password</a>
      <p>If you did not request a password reset, you can ignore this email.</p>
    `,
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
  const appUrl = process.env.NEXT_PUBLIC_APP_URL
  return getTransport().sendMail({
    from: FROM(),
    to,
    subject: `Reservation confirmed: ${bookTitle}`,
    html: `
      <h2>Your reservation is confirmed!</h2>
      <p>You have reserved <strong>${bookTitle}</strong>.</p>
      <p>Planned pick-up date: <strong>${startDate.toLocaleDateString('de-DE')}</strong></p>
      <p>Due date: <strong>${dueDate.toLocaleDateString('de-DE')}</strong></p>
      <p><a href="${appUrl}/my-loans/${loanId}">View your reservation</a></p>
    `,
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
  const appUrl = process.env.NEXT_PUBLIC_APP_URL
  return getTransport().sendMail({
    from: FROM(),
    to,
    subject: `You borrowed: ${bookTitle}`,
    html: `
      <h2>Enjoy your book!</h2>
      <p>You have borrowed <strong>${bookTitle}</strong>.</p>
      <p>Please return it by <strong>${dueDate.toLocaleDateString('de-DE')}</strong>.</p>
      <p><a href="${appUrl}/my-loans/${loanId}">View loan details</a></p>
    `,
  })
}
