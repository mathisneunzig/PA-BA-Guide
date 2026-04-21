import 'server-only'
import { prisma } from '@/lib/prisma'

export const HOLD_TTL_MS = 10 * 60 * 1000 // 10 minutes

export function holdExpiresAt(): Date {
  return new Date(Date.now() + HOLD_TTL_MS)
}

/** Upsert a hold for a user+book, resetting the TTL. */
export async function upsertHold(userId: string, bookId: string): Promise<void> {
  await prisma.cartHold.upsert({
    where: { userId_bookId: { userId, bookId } },
    create: { userId, bookId, expiresAt: holdExpiresAt() },
    update: { expiresAt: holdExpiresAt() },
  })
}

/** Release a single hold. */
export async function releaseHold(userId: string, bookId: string): Promise<void> {
  await prisma.cartHold.deleteMany({ where: { userId, bookId } })
}

/** Release all holds for a user. */
export async function releaseAllHolds(userId: string): Promise<void> {
  await prisma.cartHold.deleteMany({ where: { userId } })
}

/** Refresh all holds for a user (reset TTL). */
export async function refreshHolds(userId: string): Promise<void> {
  await prisma.cartHold.updateMany({
    where: { userId },
    data: { expiresAt: holdExpiresAt() },
  })
}

/** Count active (non-expired) holds on a book from OTHER users. */
export async function countActiveHolds(bookId: string, excludeUserId: string): Promise<number> {
  return prisma.cartHold.count({
    where: {
      bookId,
      userId: { not: excludeUserId },
      expiresAt: { gt: new Date() },
    },
  })
}

/** Delete all expired holds (cleanup). */
export async function purgeExpiredHolds(): Promise<void> {
  await prisma.cartHold.deleteMany({ where: { expiresAt: { lt: new Date() } } })
}
