import { NextRequest, NextResponse } from 'next/server'
import { requireRole } from '@/lib/auth/dal'
import { writeFile, mkdir } from 'fs/promises'
import { join, extname } from 'path'
import { randomUUID } from 'crypto'

const UPLOAD_DIR = join(process.cwd(), 'public', 'uploads', 'covers')
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp']
const MAX_SIZE = 5 * 1024 * 1024 // 5 MB

export async function POST(request: NextRequest) {
  await requireRole('ADMIN')

  const formData = await request.formData()
  const file = formData.get('file') as File | null

  if (!file) {
    return NextResponse.json({ error: 'No file provided' }, { status: 400 })
  }
  if (!ALLOWED_TYPES.includes(file.type)) {
    return NextResponse.json({ error: 'Only JPEG, PNG, or WebP images allowed' }, { status: 415 })
  }
  if (file.size > MAX_SIZE) {
    return NextResponse.json({ error: 'File too large (max 5 MB)' }, { status: 413 })
  }

  const ext = extname(file.name) || '.jpg'
  const filename = `${randomUUID()}${ext}`
  const bytes = await file.arrayBuffer()

  await mkdir(UPLOAD_DIR, { recursive: true })
  await writeFile(join(UPLOAD_DIR, filename), new Uint8Array(bytes))

  const url = `/api/uploads/covers/${filename}`
  return NextResponse.json({ url }, { status: 201 })
}
