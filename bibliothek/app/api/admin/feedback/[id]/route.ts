import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireRole } from '@/lib/auth/dal'
import { UpdateFeedbackSchema } from '@/lib/validation/feedback.schemas'

type Params = { params: Promise<{ id: string }> }

/** PATCH /api/admin/feedback/[id] — update status or admin note */
export async function PATCH(request: NextRequest, { params }: Params) {
  await requireRole('ADMIN')
  const { id } = await params

  const body = await request.json()
  const parsed = UpdateFeedbackSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  const updated = await prisma.feedback.update({
    where: { id },
    data: parsed.data,
  })

  return NextResponse.json(updated)
}

/** DELETE /api/admin/feedback/[id] */
export async function DELETE(_request: NextRequest, { params }: Params) {
  await requireRole('ADMIN')
  const { id } = await params

  await prisma.feedback.delete({ where: { id } })
  return new NextResponse(null, { status: 204 })
}
