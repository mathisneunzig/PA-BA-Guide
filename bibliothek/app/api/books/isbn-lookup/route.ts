import { NextRequest, NextResponse } from 'next/server'
import { requireRole } from '@/lib/auth/dal'
import { fetchIsbnMetadata } from '@/lib/books/isbn-lookup'

/** POST /api/books/isbn-lookup — admin only */
export async function POST(request: NextRequest) {
  await requireRole('ADMIN')
  const body = await request.json()
  const isbn = String(body?.isbn ?? '').replace(/[-\s]/g, '')
  if (!isbn) {
    return NextResponse.json({ error: 'isbn is required' }, { status: 400 })
  }
  const metadata = await fetchIsbnMetadata(isbn)
  return NextResponse.json(metadata)
}
