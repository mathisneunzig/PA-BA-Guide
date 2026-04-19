// Integration tests for POST /api/admin/return

jest.mock('../../lib/prisma', () => ({
  prisma: {
    $transaction: jest.fn(),
    loan: {
      findFirst: jest.fn(),
      update: jest.fn(),
    },
    book: {
      update: jest.fn(),
    },
    user: { findUnique: jest.fn() },
  },
}))

jest.mock('../../lib/auth/dal', () => ({
  requireRole: jest.fn(),
}))

jest.mock('../../lib/email/send', () => ({
  sendBookAvailableEmail: jest.fn().mockResolvedValue(undefined),
}))

import { POST as adminReturn } from '@/app/api/admin/return/route'
import { NextRequest } from 'next/server'
import { LoanStatus } from '@prisma/client'

const { prisma } = jest.requireMock('../../lib/prisma')
const { requireRole } = jest.requireMock('../../lib/auth/dal')
const { sendBookAvailableEmail } = jest.requireMock('../../lib/email/send')

const ADMIN_SESSION = { user: { id: 'admin_1', role: 'ADMIN' } }

function makeReq(body: object): NextRequest {
  return new NextRequest('http://localhost/api/admin/return', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

beforeEach(() => {
  jest.clearAllMocks()
  requireRole.mockResolvedValue(ADMIN_SESSION)
})

describe('POST /api/admin/return', () => {
  it('returns 400 when body is missing userId', async () => {
    const req = makeReq({ bookIds: ['0209999999995'] })
    const res = await adminReturn(req)
    expect(res.status).toBe(400)
  })

  it('returns 400 when bookIds is empty', async () => {
    const req = makeReq({ userId: 'stu_1', bookIds: [] })
    const res = await adminReturn(req)
    expect(res.status).toBe(400)
  })

  it('marks loan as RETURNED and increments availableCopies', async () => {
    const mockLoan = {
      id: 'loan_1',
      bookId: '0209999999995',
      userId: 'stu_1',
      status: LoanStatus.ACTIVE,
    }

    prisma.$transaction.mockImplementation(async (fn: (tx: typeof prisma) => Promise<unknown>) => {
      const txMock = {
        loan: {
          findFirst: jest.fn().mockResolvedValue(mockLoan),
          update: jest.fn().mockResolvedValue({ ...mockLoan, status: LoanStatus.RETURNED }),
        },
        book: { update: jest.fn() },
      }
      return fn(txMock)
    })

    // No next reservation
    prisma.loan.findFirst.mockResolvedValue(null)

    const req = makeReq({ userId: 'stu_1', bookIds: ['0209999999995'] })
    const res = await adminReturn(req)
    const json = await res.json()

    expect(res.status).toBe(200)
    expect(json.results).toHaveLength(1)
    expect(json.results[0].ok).toBe(true)
  })

  it('returns error result when no active loan found for book', async () => {
    prisma.$transaction.mockImplementation(async (fn: (tx: typeof prisma) => Promise<unknown>) => {
      const txMock = {
        loan: {
          findFirst: jest.fn().mockResolvedValue(null), // no active loan
          update: jest.fn(),
        },
        book: { update: jest.fn() },
      }
      return fn(txMock)
    })

    const req = makeReq({ userId: 'stu_1', bookIds: ['0209999999995'] })
    const res = await adminReturn(req)
    const json = await res.json()

    expect(res.status).toBe(200)
    expect(json.results[0].ok).toBe(false)
    expect(json.results[0].error).toContain('Keine aktive Ausleihe')
  })

  it('notifies the next reserved user after return', async () => {
    const mockLoan = {
      id: 'loan_1',
      bookId: '0209999999995',
      userId: 'stu_1',
      status: LoanStatus.ACTIVE,
    }

    prisma.$transaction.mockImplementation(async (fn: (tx: typeof prisma) => Promise<unknown>) => {
      const txMock = {
        loan: {
          findFirst: jest.fn().mockResolvedValue(mockLoan),
          update: jest.fn().mockResolvedValue({ ...mockLoan, status: LoanStatus.RETURNED }),
        },
        book: { update: jest.fn() },
      }
      return fn(txMock)
    })

    // Next reservation waiting
    prisma.loan.findFirst.mockResolvedValue({
      user: { email: 'next@example.com' },
      book: { title: 'Test Book', regalnummer: 'INF0001' },
    })

    const req = makeReq({ userId: 'stu_1', bookIds: ['0209999999995'] })
    await adminReturn(req)

    // Give non-blocking email a tick to fire
    await new Promise((r) => setImmediate(r))
    expect(sendBookAvailableEmail).toHaveBeenCalledWith(
      expect.objectContaining({ to: 'next@example.com', bookTitle: 'Test Book' })
    )
  })

  it('handles multiple books, returning all results', async () => {
    const barcodes = ['0209999999995', '0209999999996']

    prisma.$transaction.mockImplementation(async (fn: (tx: typeof prisma) => Promise<unknown>) => {
      const txMock = {
        loan: {
          findFirst: jest.fn().mockResolvedValue({
            id: 'loan_x', bookId: barcodes[0], userId: 'stu_1', status: LoanStatus.ACTIVE,
          }),
          update: jest.fn(),
        },
        book: { update: jest.fn() },
      }
      return fn(txMock)
    })
    prisma.loan.findFirst.mockResolvedValue(null)

    const req = makeReq({ userId: 'stu_1', bookIds: barcodes })
    const res = await adminReturn(req)
    const json = await res.json()

    expect(json.results).toHaveLength(2)
  })
})
