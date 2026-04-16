jest.mock('../../lib/prisma', () => ({
  prisma: {
    $transaction: jest.fn(),
    book: {
      findUniqueOrThrow: jest.fn(),
      update: jest.fn(),
    },
    loan: {
      findFirst: jest.fn(),
      count: jest.fn(),
      updateMany: jest.fn(),
    },
  },
}))

import { getEarliestAvailableDate, countOverlappingLoans } from '@/lib/loans/availability'
import { LoanStatus } from '@prisma/client'

// Get the mock object AFTER mock is set up
const prismaMock = jest.requireMock<{ prisma: {
  book: { findUniqueOrThrow: jest.Mock; update: jest.Mock }
  loan: { findFirst: jest.Mock; count: jest.Mock; updateMany: jest.Mock }
  $transaction: jest.Mock
} }>('../../lib/prisma').prisma

beforeEach(() => {
  jest.clearAllMocks()
})

describe('getEarliestAvailableDate', () => {
  it('returns today when availableCopies > 0', async () => {
    prismaMock.book.findUniqueOrThrow.mockResolvedValue({ availableCopies: 2 })

    const today = new Date()
    const result = await getEarliestAvailableDate('0201234567897')
    expect(result.toDateString()).toBe(today.toDateString())
  })

  it('returns day after earliest dueDate when no copies available', async () => {
    prismaMock.book.findUniqueOrThrow.mockResolvedValue({ availableCopies: 0 })
    const dueDate = new Date('2026-07-16')
    prismaMock.loan.findFirst.mockResolvedValue({ dueDate })

    const result = await getEarliestAvailableDate('0201234567897')
    const expected = new Date('2026-07-17')
    expect(result.toDateString()).toBe(expected.toDateString())
  })

  it('returns today if no copies available but no active loans found', async () => {
    prismaMock.book.findUniqueOrThrow.mockResolvedValue({ availableCopies: 0 })
    prismaMock.loan.findFirst.mockResolvedValue(null)

    const today = new Date()
    const result = await getEarliestAvailableDate('0201234567897')
    expect(result.toDateString()).toBe(today.toDateString())
  })
})

describe('countOverlappingLoans', () => {
  it('returns 0 when no overlapping loans', async () => {
    prismaMock.loan.count.mockResolvedValue(0)

    const result = await countOverlappingLoans(
      '0201234567897',
      new Date('2026-08-01'),
      new Date('2026-10-31'),
    )
    expect(result).toBe(0)
  })

  it('returns correct count with overlaps', async () => {
    prismaMock.loan.count.mockResolvedValue(2)

    const result = await countOverlappingLoans(
      '0201234567897',
      new Date('2026-08-01'),
      new Date('2026-10-31'),
    )
    expect(result).toBe(2)
    expect(prismaMock.loan.count).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          bookId: '0201234567897',
          status: { in: [LoanStatus.ACTIVE, LoanStatus.RESERVED] },
        }),
      }),
    )
  })
})
