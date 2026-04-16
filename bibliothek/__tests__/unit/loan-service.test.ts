jest.mock('../../lib/prisma', () => ({
  prisma: {
    $transaction: jest.fn(),
    book: { update: jest.fn() },
    loan: {
      findUniqueOrThrow: jest.fn(),
      update: jest.fn(),
    },
  },
}))

import {
  computeDueDate,
  isOverdue,
  activateLoan,
  returnLoan,
  cancelLoan,
} from '@/lib/loans/loan-service'
import { LoanStatus } from '@prisma/client'

const prismaMock = jest.requireMock<{ prisma: {
  $transaction: jest.Mock
  book: { update: jest.Mock }
  loan: { findUniqueOrThrow: jest.Mock; update: jest.Mock }
} }>('../../lib/prisma').prisma

beforeEach(() => {
  jest.clearAllMocks()
})

const MOCK_LOAN = {
  id: 'loan_1',
  userId: 'user_1',
  bookId: '0201234567897',
  status: LoanStatus.RESERVED,
  startDate: new Date('2026-04-16'),
  dueDate: new Date('2026-07-16'),
  returnedAt: null,
  loanDurationDays: 91,
  notes: null,
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

describe('activateLoan', () => {
  it('throws when status is not RESERVED', async () => {
    const activeLoan = { ...MOCK_LOAN, status: LoanStatus.ACTIVE }
    const txMock = {
      loan: {
        findUniqueOrThrow: jest.fn().mockResolvedValue(activeLoan),
        update: jest.fn(),
      },
    }
    mockTransaction(txMock)
    await expect(activateLoan('loan_1')).rejects.toThrow('Cannot activate loan with status ACTIVE')
  })

  it('transitions RESERVED → ACTIVE and recomputes dueDate', async () => {
    const txMock = {
      loan: {
        findUniqueOrThrow: jest.fn().mockResolvedValue(MOCK_LOAN),
        update: jest.fn().mockResolvedValue({ ...MOCK_LOAN, status: LoanStatus.ACTIVE }),
      },
    }
    mockTransaction(txMock)
    await activateLoan('loan_1')
    expect(txMock.loan.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ status: LoanStatus.ACTIVE }),
      }),
    )
  })
})

describe('returnLoan', () => {
  it('throws when status is not ACTIVE or OVERDUE', async () => {
    const reservedLoan = { ...MOCK_LOAN, status: LoanStatus.RESERVED }
    const txMock = {
      loan: { findUniqueOrThrow: jest.fn().mockResolvedValue(reservedLoan), update: jest.fn() },
      book: { update: jest.fn() },
    }
    mockTransaction(txMock)
    await expect(returnLoan('loan_1')).rejects.toThrow('Cannot return loan with status RESERVED')
  })

  it('increments availableCopies on success', async () => {
    const activeLoan = { ...MOCK_LOAN, status: LoanStatus.ACTIVE }
    const txMock = {
      loan: { findUniqueOrThrow: jest.fn().mockResolvedValue(activeLoan), update: jest.fn() },
      book: { update: jest.fn() },
    }
    mockTransaction(txMock)
    await returnLoan('loan_1')
    expect(txMock.book.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: { availableCopies: { increment: 1 } },
      }),
    )
  })
})

describe('cancelLoan', () => {
  it('throws when status is not RESERVED', async () => {
    const activeLoan = { ...MOCK_LOAN, status: LoanStatus.ACTIVE }
    const txMock = {
      loan: { findUniqueOrThrow: jest.fn().mockResolvedValue(activeLoan), update: jest.fn() },
      book: { update: jest.fn() },
    }
    mockTransaction(txMock)
    await expect(cancelLoan('loan_1')).rejects.toThrow('Cannot cancel loan with status ACTIVE')
  })

  it('increments availableCopies on success', async () => {
    const txMock = {
      loan: { findUniqueOrThrow: jest.fn().mockResolvedValue(MOCK_LOAN), update: jest.fn() },
      book: { update: jest.fn() },
    }
    mockTransaction(txMock)
    await cancelLoan('loan_1')
    expect(txMock.book.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: { availableCopies: { increment: 1 } },
      }),
    )
  })
})
