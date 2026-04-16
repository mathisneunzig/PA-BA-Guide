import 'server-only'

/**
 * Build a raw ESC/POS binary buffer for a thermal label printer.
 *
 * Layout:
 *   ESC @       — initialize printer
 *   ESC a 1     — center align
 *   GS k m d…  — EAN-13 barcode with HRI below (m=2 for EAN-13, legacy form)
 *   LF          — feed line after barcode
 *   ESC a 0     — left align
 *   title\n     — up to 32 chars
 *   author\n    — up to 32 chars
 *   GS V 1      — partial cut
 */
export function buildEscPosLabel(barcode: string, title: string, author: string): Buffer {
  const chunks: Buffer[] = []

  const push = (...bytes: number[]) => chunks.push(Buffer.from(bytes))
  const pushText = (text: string) => chunks.push(Buffer.from(text + '\n', 'utf8'))

  // Initialize
  push(0x1b, 0x40)

  // Center align
  push(0x1b, 0x61, 0x01)

  // Select HRI position: below barcode (GS H n, n=2)
  push(0x1d, 0x48, 0x02)

  // EAN-13 barcode (GS k m n d1…d13, m=67 = EAN-13 with check digit)
  push(0x1d, 0x6b, 0x43, 0x0d)
  chunks.push(Buffer.from(barcode, 'ascii'))

  push(0x0a) // LF

  // Left align
  push(0x1b, 0x61, 0x00)

  // Title and author (truncated to 32 chars)
  pushText(title.slice(0, 32))
  pushText(author.slice(0, 32))

  // Partial cut (GS V 1)
  push(0x1d, 0x56, 0x01)

  return Buffer.concat(chunks)
}
