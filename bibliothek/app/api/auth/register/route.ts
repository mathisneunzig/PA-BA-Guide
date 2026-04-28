import type { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { RegisterSchema } from '@/lib/validation/auth.schemas'
import { hashPassword } from '@/lib/utils/hash'
import { generateToken } from '@/lib/utils/token'
import { sendVerificationEmail, sendNewGuestEmail } from '@/lib/email/send'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const parsed = RegisterSchema.safeParse(body)

    if (!parsed.success) {
      return Response.json(
        { error: 'Validation failed', details: parsed.error.flatten() },
        { status: 400 },
      )
    }

    const { firstname, lastname, username, email, phone, password,
            street, housenr, zipcode, city, country, marketingConsent } = parsed.data

    const [existingEmail, existingUsername] = await Promise.all([
      prisma.user.findUnique({ where: { email } }),
      prisma.user.findUnique({ where: { username } }),
    ])

    if (existingEmail) {
      return Response.json({ error: 'Email already registered' }, { status: 409 })
    }
    if (existingUsername) {
      return Response.json({ error: 'Username already taken' }, { status: 409 })
    }

    const hashedPassword = await hashPassword(password)
    const verifyToken = generateToken()
    const verifyExpires = new Date(Date.now() + 24 * 60 * 60 * 1000) // 24h

    const user = await prisma.user.create({
      data: {
        firstname,
        lastname,
        username,
        email,
        phone,
        password: hashedPassword,
        email_verify_token: verifyToken,
        email_verify_expires: verifyExpires,
        email_verified: false,
        // Optional address from step 2
        street:  street  || null,
        housenr: housenr || null,
        zipcode: zipcode || null,
        city:    city    || null,
        country: country || null,
        // Consent
        marketingConsent: marketingConsent ?? false,
      },
      select: { id: true, email: true, username: true, firstname: true, lastname: true, phone: true, createdAt: true },
    })

    // Send verification email to new user
    await sendVerificationEmail({ to: email, token: verifyToken })

    // Notify all admins (non-blocking)
    prisma.user.findMany({
      where: { role: 'ADMIN' },
      select: { email: true },
    }).then((admins) => {
      for (const admin of admins) {
        if (!admin.email) continue
        sendNewGuestEmail({
          to: admin.email,
          userId: user.id,
          firstname: user.firstname ?? firstname,
          lastname: user.lastname ?? lastname,
          username: user.username,
          email: user.email,
          phone: user.phone,
          registeredAt: user.createdAt,
        }).catch(() => {})
      }
    }).catch(() => {})

    return Response.json(
      {
        message: 'Registration successful. Please check your email to verify your account.',
        userId: user.id,
      },
      { status: 201 },
    )
  } catch (error) {
    console.error('[POST /api/auth/register]', error)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
