import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireRole } from '@/lib/auth/dal'

type Params = { params: Promise<{ category: string }> }

/**
 * GET /api/books/regalnummer/suggest/[category]
 * Returns the next unused regalnummer for the given category code.
 * Format: {CODE}{NNNN} e.g. SAP0001, SAP0002, …
 */
export async function GET(_request: NextRequest, { params }: Params) {
  await requireRole('ADMIN')
  const { category } = await params
  const prefix = category.toUpperCase()

  // Find all existing regalnummern for this category prefix
  const existing = await prisma.book.findMany({
    where: { regalnummer: { startsWith: prefix } },
    select: { regalnummer: true },
  })

  let maxN = 0
  for (const { regalnummer } of existing) {
    if (!regalnummer) continue
    const num = parseInt(regalnummer.slice(prefix.length), 10)
    if (!isNaN(num) && num > maxN) maxN = num
  }

  const next = String(maxN + 1).padStart(4, '0')
  return NextResponse.json({ regalnummer: `${prefix}${next}` })
}
