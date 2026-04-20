import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireRole } from '@/lib/auth/dal'

type Params = { params: Promise<{ barcode: string }> }

/**
 * POST /api/books/[barcode]/print
 * Body: { printerName: string }
 *
 * Sends a fully formatted ESC/POS label to a USB/network printer via the
 * escpos-typescript library (uses OS print spooler: lp on macOS/Linux,
 * print on Windows). The printer must be configured in the host OS.
 */
export async function POST(request: NextRequest, { params }: Params) {
  await requireRole('ADMIN')
  const { barcode } = await params

  const book = await prisma.book.findUnique({
    where: { id: barcode },
    select: { title: true, author: true, publisher: true, year: true, isbn13: true, tags: true, regalnummer: true },
  })
  if (!book) return NextResponse.json({ error: 'Book not found' }, { status: 404 })

  const body = await request.json().catch(() => ({}))
  const printerName: string = body.printerName ?? 'default'
  const mode: 'label' | 'shelf' = body.mode === 'shelf' ? 'shelf' : 'label'

  try {
    const {
      POSPrinter,
      POSDocument,
      POSTextBuilder,
      POSBarcodeBuilder,
      POSTextAlignment,
      POSPrintStyle,
      POSBarcodeType,
      POSBarcodeWidth,
    } = await import('escpos-typescript')

    const doc = new POSDocument()

    if (mode === 'shelf') {
      // Schrankplatz: just the shelf number, large, centred + 2 line feeds
      const label = book.regalnummer ?? barcode
      doc.addComponent(
        new POSTextBuilder(label)
          .setAlignment(POSTextAlignment.CENTER)
          .setStyle(POSPrintStyle.BOLD)
          .build()
      )
      doc.addLineFeed(1)
    } else {
      // Full book label
      doc.addComponent(
        new POSTextBuilder('BIBLIOTHEK')
          .setAlignment(POSTextAlignment.CENTER)
          .setStyle(POSPrintStyle.BOLD)
          .build()
      )
      doc.addComponent(new POSTextBuilder('--------------------------------').build())
      doc.addComponent(
        new POSTextBuilder(book.title.slice(0, 64))
          .setAlignment(POSTextAlignment.LEFT)
          .setStyle(POSPrintStyle.BOLD)
          .build()
      )
      doc.addComponent(new POSTextBuilder(book.author.slice(0, 48)).build())
      const pubLine = [book.publisher, book.year].filter(Boolean).join(', ')
      if (pubLine) doc.addComponent(new POSTextBuilder(pubLine.slice(0, 48)).build())
      if (book.isbn13) doc.addComponent(new POSTextBuilder(`ISBN: ${book.isbn13}`).build())
      if (book.tags) {
        const tagStr = book.tags.split(',').map((t: string) => t.trim()).filter(Boolean).join(' | ')
        if (tagStr) doc.addComponent(new POSTextBuilder(tagStr.slice(0, 64)).build())
      }
      doc.addComponent(new POSTextBuilder('--------------------------------').build())
      doc.addComponent(
        new POSBarcodeBuilder(barcode)
          .setType(POSBarcodeType.JAN13_EAN13)
          .setWidth(POSBarcodeWidth.DEFAULT)
          .build()
      )
      doc.addComponent(new POSTextBuilder(barcode).build())
      doc.addLineFeed(1)
    }

    const printer = new POSPrinter(printerName)
    printer.print(doc)

    return NextResponse.json({ success: true, printer: printerName })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Print failed'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
