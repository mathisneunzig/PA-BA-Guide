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

  try {
    // Dynamic import so the module isn't bundled into client chunks
    const {
      POSPrinter,
      POSDocument,
      POSText,
      POSTextBuilder,
      POSBarcode,
      POSBarcodeBuilder,
      POSLineFeed,
      POSTextAlignment,
      POSPrintStyle,
      POSBarcodeType,
      POSBarcodeWidth,
    } = await import('escpos-typescript')

    const doc = new POSDocument()

    // Header
    doc.addComponent(
      new POSTextBuilder('BIBLIOTHEK')
        .setAlignment(POSTextAlignment.CENTER)
        .setStyle(POSPrintStyle.BOLD)
        .build()
    )
    doc.addLineFeed()
    doc.addComponent(new POSTextBuilder('--------------------------------').build())
    doc.addLineFeed()

    // Title (bold)
    doc.addComponent(
      new POSTextBuilder(book.title.slice(0, 64))
        .setAlignment(POSTextAlignment.LEFT)
        .setStyle(POSPrintStyle.BOLD)
        .build()
    )
    doc.addLineFeed()

    // Author
    doc.addComponent(new POSTextBuilder(book.author.slice(0, 48)).build())
    doc.addLineFeed()

    // Publisher + Year
    const pubLine = [book.publisher, book.year].filter(Boolean).join(', ')
    if (pubLine) {
      doc.addComponent(new POSTextBuilder(pubLine.slice(0, 48)).build())
      doc.addLineFeed()
    }

    // ISBN
    if (book.isbn13) {
      doc.addComponent(new POSTextBuilder(`ISBN: ${book.isbn13}`).build())
      doc.addLineFeed()
    }

    // Tags
    if (book.tags) {
      const tagStr = book.tags.split(',').map((t: string) => t.trim()).filter(Boolean).join(' | ')
      if (tagStr) {
        doc.addComponent(new POSTextBuilder(tagStr.slice(0, 64)).build())
        doc.addLineFeed()
      }
    }

    doc.addComponent(new POSTextBuilder('--------------------------------').build())
    doc.addLineFeed()

    // EAN-13 Barcode (centered)
    doc.addComponent(
      new POSBarcodeBuilder(barcode)
        .setType(POSBarcodeType.JAN13_EAN13)
        .setWidth(POSBarcodeWidth.DEFAULT)
        .build()
    )
    doc.addLineFeed()
    doc.addComponent(new POSTextBuilder(barcode).build())
    doc.addLineFeed(5)

    const printer = new POSPrinter(printerName)
    printer.print(doc)

    return NextResponse.json({ success: true, printer: printerName })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Print failed'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
