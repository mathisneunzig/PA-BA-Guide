import { NextRequest, NextResponse } from 'next/server'
import { getEarliestAvailableDate } from '@/lib/loans/availability'

type Params = { params: Promise<{ barcode: string }> }

/** GET /api/books/[barcode]/availability — public */
export async function GET(_request: NextRequest, { params }: Params) {
  const { barcode } = await params
  try {
    const earliestDate = await getEarliestAvailableDate(barcode)
    return NextResponse.json({ earliestDate })
  } catch {
    return NextResponse.json({ error: 'Book not found' }, { status: 404 })
  }
}
