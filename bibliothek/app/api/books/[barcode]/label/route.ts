import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireRole } from '@/lib/auth/dal'
import { buildEscPosLabel } from '@/lib/books/escpos'
import { buildPngLabel } from '@/lib/books/png-label'

type Params = { params: Promise<{ barcode: string }> }

/** GET /api/books/[barcode]/label?format=png|escpos */
export async function GET(request: NextRequest, { params }: Params) {
  await requireRole('ADMIN')
  const { barcode } = await params

  const book = await prisma.book.findUnique({
    where: { id: barcode },
    select: { title: true, author: true, publisher: true, year: true, isbn13: true, tags: true, regalnummer: true },
  })
  if (!book) return NextResponse.json({ error: 'Book not found' }, { status: 404 })

  const format = request.nextUrl.searchParams.get('format') ?? 'escpos'

  if (format === 'png') {
    const png = await buildPngLabel({ barcode, ...book })
    return new NextResponse(new Uint8Array(png), {
      headers: {
        'Content-Type': 'image/png',
        'Content-Disposition': `inline; filename="${barcode}-label.png"`,
      },
    })
  }

  // Default: ESC/POS binary with full metadata
  const buffer = buildEscPosLabel({ barcode, ...book })
  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      'Content-Type': 'application/octet-stream',
      'Content-Disposition': `attachment; filename="${barcode}.bin"`,
    },
  })
}
