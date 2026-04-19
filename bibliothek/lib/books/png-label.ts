import 'server-only'
import type { BookLabelData } from './escpos'

/**
 * Build a PNG label image with the same content as the ESC/POS label.
 * Uses bwip-js for the EAN-13 barcode and composes the full label as SVG via sharp.
 *
 * Layout (300×500 px, white background):
 *   BIBLIOTHEK (header)
 *   separator line
 *   Title (bold, wrapped)
 *   Author
 *   Publisher, Year
 *   ISBN
 *   Regalnummer (bold)
 *   Themengebiete
 *   separator line
 *   EAN-13 barcode
 */
export async function buildPngLabel(data: BookLabelData): Promise<Buffer> {
  const sharp = (await import('sharp')).default
  const bwipjs = await import('bwip-js')

  const WIDTH = 360
  const PAD = 16
  const FONT = 'monospace'

  // Generate barcode PNG buffer
  const barcodePng = await bwipjs.toBuffer({
    bcid: 'ean13',
    text: data.barcode,
    scale: 3,
    height: 12,
    includetext: true,
    textxalign: 'center',
  })

  // Get barcode dimensions
  const barcodeMeta = await sharp(barcodePng).metadata()
  const bcW = barcodeMeta.width ?? 200
  const bcH = barcodeMeta.height ?? 80

  // Build text lines
  const lines: Array<{ text: string; bold?: boolean; small?: boolean }> = []
  lines.push({ text: 'BIBLIOTHEK', bold: true })
  lines.push({ text: '─'.repeat(30) })
  for (const line of wrapText(data.title, 38)) lines.push({ text: line, bold: true })
  lines.push({ text: trunc(data.author, 42) })
  const pubLine = [data.publisher, data.year].filter(Boolean).join(', ')
  if (pubLine) lines.push({ text: trunc(pubLine, 42), small: true })
  if (data.isbn13) lines.push({ text: `ISBN: ${data.isbn13}`, small: true })
  if (data.regalnummer) lines.push({ text: `Regal: ${data.regalnummer}`, bold: true })
  if (data.tags) {
    const tags = data.tags.split(',').map((t) => t.trim()).filter(Boolean)
    if (tags.length > 0) {
      for (const line of wrapText(tags.join(' | '), 42)) lines.push({ text: line, small: true })
    }
  }
  lines.push({ text: '─'.repeat(30) })

  const LINE_H = 22
  const SMALL_H = 18
  const BOLD_H = 22
  let totalTextHeight = 0
  for (const l of lines) {
    totalTextHeight += l.small ? SMALL_H : LINE_H
  }

  const HEIGHT = PAD + totalTextHeight + PAD + bcH + PAD

  // Build SVG for text portion
  let y = PAD
  const svgLines: string[] = []
  for (const l of lines) {
    const fontSize = l.small ? 12 : l.bold ? 15 : 13
    const lh = l.small ? SMALL_H : LINE_H
    y += lh
    const weight = l.bold ? 'bold' : 'normal'
    const escaped = l.text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
    svgLines.push(
      `<text x="${PAD}" y="${y}" font-family="${FONT}" font-size="${fontSize}" font-weight="${weight}" fill="#1a1a1a">${escaped}</text>`
    )
  }

  const svgText = `<svg xmlns="http://www.w3.org/2000/svg" width="${WIDTH}" height="${HEIGHT}">
  <rect width="${WIDTH}" height="${HEIGHT}" fill="white"/>
  ${svgLines.join('\n  ')}
</svg>`

  const textImg = await sharp(Buffer.from(svgText)).png().toBuffer()

  const bcX = Math.max(0, Math.floor((WIDTH - bcW) / 2))
  const bcY = PAD + totalTextHeight + PAD

  const result = await sharp({
    create: { width: WIDTH, height: HEIGHT, channels: 4, background: { r: 255, g: 255, b: 255, alpha: 1 } },
  })
    .composite([
      { input: textImg, top: 0, left: 0 },
      { input: barcodePng, top: bcY, left: bcX },
    ])
    .png()
    .toBuffer()

  return result
}

function trunc(str: string, max: number): string {
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
