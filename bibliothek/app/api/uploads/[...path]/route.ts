import { NextRequest, NextResponse } from 'next/server'
import { readFile } from 'fs/promises'
import { join, extname, normalize } from 'path'

const UPLOAD_DIR = join(process.cwd(), 'public', 'uploads')

const MIME: Record<string, string> = {
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.gif': 'image/gif',
}

type Params = { params: Promise<{ path: string[] }> }

/**
 * GET /api/uploads/[...path]
 * Serves files from public/uploads/ at runtime.
 * Required because Next.js standalone mode only copies public/ at build time;
 * files uploaded at runtime are written to the project public/uploads/ folder
 * and need this route to be accessible.
 */
export async function GET(_request: NextRequest, { params }: Params) {
  const { path: segments } = await params
  // Normalize to prevent path traversal
  const relative = normalize(segments.join('/')).replace(/^(\.\.(\/|\\|$))+/, '')
  const filePath = join(UPLOAD_DIR, relative)

  // Ensure file is within UPLOAD_DIR
  if (!filePath.startsWith(UPLOAD_DIR)) {
    return new NextResponse(null, { status: 403 })
  }

  try {
    const data = await readFile(filePath)
    const ext = extname(filePath).toLowerCase()
    const contentType = MIME[ext] ?? 'application/octet-stream'
    return new NextResponse(data, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    })
  } catch {
    return new NextResponse(null, { status: 404 })
  }
}
