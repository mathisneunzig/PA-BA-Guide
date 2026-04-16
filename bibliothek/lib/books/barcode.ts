import 'server-only'
import { prisma } from '@/lib/prisma'

/**
 * GS1 EAN-13 check digit.
 * Odd positions (0-indexed: 0,2,4,…) × 1; even positions × 3.
 */
export function computeEan13CheckDigit(first12: string): number {
  let sum = 0
  for (let i = 0; i < 12; i++) {
    const digit = parseInt(first12[i], 10)
    sum += i % 2 === 0 ? digit : digit * 3
  }
  return (10 - (sum % 10)) % 10
}

/** Assemble a full EAN-13 from 9 internal digits (prefix 020 is prepended). */
export function buildEan13(nineDigits: string): string {
  const first12 = `020${nineDigits}`
  return `${first12}${computeEan13CheckDigit(first12)}`
}

/** Validate length, digit-only, and check digit. */
export function validateEan13(barcode: string): boolean {
  if (!/^\d{13}$/.test(barcode)) return false
  return parseInt(barcode[12], 10) === computeEan13CheckDigit(barcode.slice(0, 12))
}

/** Generate a random 9-digit string, padded to 9 chars. */
function randomNineDigits(): string {
  return Math.floor(Math.random() * 1_000_000_000)
    .toString()
    .padStart(9, '0')
}

/** Generate an EAN-13 barcode unique within the books table (up to 10 retries). */
export async function generateUniqueBarcode(): Promise<string> {
  for (let attempt = 0; attempt < 10; attempt++) {
    const barcode = buildEan13(randomNineDigits())
    const existing = await prisma.book.findUnique({ where: { id: barcode }, select: { id: true } })
    if (!existing) return barcode
  }
  throw new Error('Could not generate a unique barcode after 10 attempts')
}
