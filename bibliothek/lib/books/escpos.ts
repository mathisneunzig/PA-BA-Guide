import 'server-only'

/**
 * Build a raw ESC/POS binary buffer for a thermal label/receipt printer.
 *
 * Layout:
 *   ── Library header ──
 *   Title (bold, wrapped at 32 chars)
 *   Author
 *   Publisher / Year
 *   ISBN
 *   Tags (Themengebiete)
 *   ── EAN-13 barcode (centered) ──
 *   Partial cut
 */
export interface BookLabelData {
  barcode: string
  title: string
  author: string
  publisher?: string | null
  year?: number | null
  isbn13?: string | null
  tags?: string | null
  regalnummer?: string | null
}

export function buildEscPosLabel(data: BookLabelData): Buffer {
  const chunks: Buffer[] = []

  const push = (...bytes: number[]) => chunks.push(Buffer.from(bytes))
  const pushStr = (text: string) => chunks.push(Buffer.from(text, 'utf8'))

  // Initialize printer
  push(0x1b, 0x40)

  // Bold ON + Center align
  push(0x1b, 0x45, 0x01)
  push(0x1b, 0x61, 0x01)
  pushStr('BIBLIOTHEK\n')
  push(0x1b, 0x45, 0x00)

  // Left align
  push(0x1b, 0x61, 0x00)
  pushStr('--------------------------------\n')

  // Title (bold, max 2 lines of 32 chars)
  const titleLines = wrapText(data.title, 32)
  for (const line of titleLines.slice(0, 2)) {
    push(0x1b, 0x45, 0x01)
    pushStr(line + '\n')
    push(0x1b, 0x45, 0x00)
  }

  // Author
  pushStr(truncate(data.author, 32) + '\n')

  // Publisher + Year
  const pubLine = [data.publisher, data.year].filter(Boolean).join(', ')
  if (pubLine) pushStr(truncate(pubLine, 32) + '\n')

  // ISBN
  if (data.isbn13) pushStr(`ISBN: ${data.isbn13}\n`)

  // Regalnummer (shelf number)
  if (data.regalnummer) {
    push(0x1b, 0x45, 0x01)
    pushStr(`Regal: ${data.regalnummer}\n`)
    push(0x1b, 0x45, 0x00)
  }

  // Tags (Themengebiete)
  if (data.tags) {
    const tagList = data.tags.split(',').map((t) => t.trim()).filter(Boolean)
    if (tagList.length > 0) {
      const tagStr = tagList.join(' | ')
      for (const line of wrapText(tagStr, 32)) pushStr(line + '\n')
    }
  }

  pushStr('--------------------------------\n')

  // Center for barcode
  push(0x1b, 0x61, 0x01)

  // HRI below barcode (GS H 2)
  push(0x1d, 0x48, 0x02)
  // Barcode height 60 dots (GS h 60)
  push(0x1d, 0x68, 0x3c)

  // EAN-13 (GS k 67 13 <digits>)
  push(0x1d, 0x6b, 0x43, 0x0d)
  chunks.push(Buffer.from(data.barcode, 'ascii'))

  push(0x0a, 0x0a)

  // Feed and partial cut
  push(0x1d, 0x56, 0x01)

  return Buffer.concat(chunks)
}

function truncate(str: string, max: number): string {
  return str.length <= max ? str : str.slice(0, max - 1) + '…'
}

function wrapText(str: string, width: number): string[] {
  const words = str.split(' ')
  const lines: string[] = []
  let current = ''
  for (const word of words) {
    if ((current + (current ? ' ' : '') + word).length <= width) {
      current += (current ? ' ' : '') + word
    } else {
      if (current) lines.push(current)
      current = word.length > width ? word.slice(0, width) : word
    }
  }
  if (current) lines.push(current)
  return lines
}
