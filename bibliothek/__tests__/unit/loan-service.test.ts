jest.mock('../../lib/prisma', () => ({
  prisma: {
    $transaction: jest.fn(),
    book: { update: jest.fn() },
    loanGroup: {
      findUniqueOrThrow: jest.fn(),
      update: jest.fn(),
    },
    loanItem: {
      findUniqueOrThrow: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
    },
  },
}))

import {
  computeDueDate,
  isOverdue,
  activateLoanGroup,
  returnLoanItem,
  cancelLoanItem,
} from '@/lib/loans/loan-service'
import { LoanStatus } from '@prisma/client'

const prismaMock = jest.requireMock<{ prisma: {
  $transaction: jest.Mock
  book: { update: jest.Mock }
  loanGroup: { findUniqueOrThrow: jest.Mock; update: jest.Mock }
  loanItem: { findUniqueOrThrow: jest.Mock; findMany: jest.Mock; update: jest.Mock; updateMany: jest.Mock }
} }>('../../lib/prisma').prisma

beforeEach(() => {
  jest.clearAllMocks()
})

const MOCK_GROUP = {
  id: 'group_1',
  userId: 'user_1',
  status: LoanStatus.RESERVED,
  startDate: new Date('2026-04-16'),
  dueDate: new Date('2026-07-16'),
  loanDurationDays: 91,
  notes: null,
  createdAt: new Date(),
  updatedAt: new Date(),
  items: [
    { id: 'item_1', groupId: 'group_1', bookId: '0201234567897', status: LoanStatus.RESERVED },
  ],
}

const MOCK_ITEM = {
  id: 'item_1',
  groupId: 'group_1',
  bookId: '0201234567897',
  status: LoanStatus.ACTIVE,
  returnedAt: null,
  createdAt: new Date(),
  updatedAt: new Date(),
}

describe('computeDueDate', () => {
  it('adds exact days', () => {
    const start = new Date('2026-04-16')
    const due = computeDueDate(start, 91)
    expect(due.toISOString().slice(0, 10)).toBe('2026-07-16')
  })

  it('does not mutate input', () => {
    const start = new Date('2026-04-16')
    computeDueDate(start, 30)
    expect(start.toISOString().slice(0, 10)).toBe('2026-04-16')
  })
})

describe('isOverdue', () => {
  it('returns true for past date', () => {
    expect(isOverdue(new Date(Date.now() - 1000))).toBe(true)
  })

  it('returns false for future date', () => {
    expect(isOverdue(new Date(Date.now() + 86400000))).toBe(false)
  })
})

// Helper: make prisma.$transaction call the callback with the provided tx mock
function mockTransaction(txMock: object) {
  prismaMock.$transaction.mockImplementation((fn: (tx: typeof txMock) => Promise<unknown>) => fn(txMock))
}

describe('activateLoanGroup', () => {
  it('throws when status is not RESERVED', async () => {
    const activeGroup = { ...MOCK_GROUP, status: LoanStatus.ACTIVE }
    const txMock = {
      loanGroup: {
        findUniqueOrThrow: jest.fn().mockResolvedValue(activeGroup),
        update: jest.fn(),
      },
      loanItem: { updateMany: jest.fn() },
    }
    mockTransaction(txMock)
    await expect(activateLoanGroup('group_1')).rejects.toThrow('Cannot activate loan group with status ACTIVE')
  })

  it('transitions RESERVED → ACTIVE for all items', async () => {
    const txMock = {
      loanGroup: {
        findUniqueOrThrow: jest.fn().mockResolvedValue(MOCK_GROUP),
        update: jest.fn().mockResolvedValue({ ...MOCK_GROUP, status: LoanStatus.ACTIVE }),
      },
      loanItem: { updateMany: jest.fn() },
    }
    mockTransaction(txMock)
    await activateLoanGroup('group_1')
    expect(txMock.loanItem.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ status: LoanStatus.ACTIVE }),
      }),
    )
  })
})

describe('returnLoanItem', () => {
  it('throws when status is not ACTIVE or OVERDUE', async () => {
    const reservedItem = { ...MOCK_ITEM, status: LoanStatus.RESERVED }
    const txMock = {
      loanItem: {
        findUniqueOrThrow: jest.fn().mockResolvedValue(reservedItem),
        update: jest.fn(),
        findMany: jest.fn().mockResolvedValue([reservedItem]),
      },
      book: { update: jest.fn() },
      loanGroup: { update: jest.fn() },
    }
    mockTransaction(txMock)
    await expect(returnLoanItem('item_1')).rejects.toThrow('Cannot return item with status RESERVED')
  })

  it('increments availableCopies on success', async () => {
    const txMock = {
      loanItem: {
        findUniqueOrThrow: jest.fn().mockResolvedValue(MOCK_ITEM),
        update: jest.fn(),
        findMany: jest.fn().mockResolvedValue([{ ...MOCK_ITEM, status: LoanStatus.RETURNED }]),
      },
      book: { update: jest.fn() },
      loanGroup: { update: jest.fn() },
    }
    mockTransaction(txMock)
    await returnLoanItem('item_1')
    expect(txMock.book.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: { availableCopies: { increment: 1 } },
      }),
    )
  })
})

describe('cancelLoanItem', () => {
  it('throws when status is RETURNED (terminal state)', async () => {
    const returnedItem = { ...MOCK_ITEM, status: LoanStatus.RETURNED }
    const txMock = {
      loanItem: {
        findUniqueOrThrow: jest.fn().mockResolvedValue(returnedItem),
        update: jest.fn(),
        findMany: jest.fn(),
      },
      book: { update: jest.fn() },
      loanGroup: { update: jest.fn() },
    }
    mockTransaction(txMock)
    await expect(cancelLoanItem('item_1')).rejects.toThrow()
  })

  it('increments availableCopies on success', async () => {
    const txMock = {
      loanItem: {
        findUniqueOrThrow: jest.fn().mockResolvedValue({ ...MOCK_ITEM, status: LoanStatus.RESERVED }),
        update: jest.fn(),
        findMany: jest.fn().mockResolvedValue([{ ...MOCK_ITEM, status: LoanStatus.CANCELLED }]),
      },
      book: { update: jest.fn() },
      loanGroup: { update: jest.fn() },
    }
    mockTransaction(txMock)
    await cancelLoanItem('item_1')
    expect(txMock.book.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: { availableCopies: { increment: 1 } },
      }),
    )
  })
})
