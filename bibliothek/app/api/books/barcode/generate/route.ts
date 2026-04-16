import { NextRequest, NextResponse } from 'next/server'
import { requireRole } from '@/lib/auth/dal'
import { generateUniqueBarcode } from '@/lib/books/barcode'

/** POST /api/books/barcode/generate — admin only */
export async function POST(_request: NextRequest) {
  await requireRole('ADMIN')
  const barcode = await generateUniqueBarcode()
  return NextResponse.json({ barcode })
}
