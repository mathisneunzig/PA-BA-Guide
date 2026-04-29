import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/auth'
import { CreateFeedbackSchema } from '@/lib/validation/feedback.schemas'

/** POST /api/feedback — public, guests and logged-in users */
export async function POST(request: NextRequest) {
  const session = await auth()

  const body = await request.json()
  const parsed = CreateFeedbackSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  const { description, category, severity, pageUrl } = parsed.data

  const feedback = await prisma.feedback.create({
    data: {
      userId: session?.user?.id ?? null,
      description,
      category,
      severity,
      pageUrl: pageUrl ?? null,
    },
  })

  return NextResponse.json(feedback, { status: 201 })
}
