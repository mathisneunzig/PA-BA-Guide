// Integration tests for POST /api/admin/return

jest.mock('../../lib/prisma', () => ({
  prisma: {
    loanItem: {
      findFirst: jest.fn(),
    },
    loanGroup: {
      findUnique: jest.fn(),
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

jest.mock('../../lib/loans/loan-service', () => ({
  returnLoanItem: jest.fn().mockResolvedValue(undefined),
}))

import { POST as adminReturn } from '@/app/api/admin/return/route'
import { NextRequest } from 'next/server'
import { LoanStatus } from '@prisma/client'

const { prisma } = jest.requireMock('../../lib/prisma')
const { requireRole } = jest.requireMock('../../lib/auth/dal')
const { sendBookAvailableEmail } = jest.requireMock('../../lib/email/send')
const { returnLoanItem } = jest.requireMock('../../lib/loans/loan-service')

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

  it('marks loan item as RETURNED via returnLoanItem', async () => {
    prisma.loanItem.findFirst
      .mockResolvedValueOnce({ id: 'item_1', bookId: '0209999999995', status: LoanStatus.ACTIVE })
      .mockResolvedValueOnce(null) // no next reservation

    const req = makeReq({ userId: 'stu_1', bookIds: ['0209999999995'] })
    const res = await adminReturn(req)
    const json = await res.json()

    expect(res.status).toBe(200)
    expect(json.results).toHaveLength(1)
    expect(json.results[0].ok).toBe(true)
    expect(returnLoanItem).toHaveBeenCalledWith('item_1')
  })

  it('returns error result when no active loan found for book', async () => {
    prisma.loanItem.findFirst.mockResolvedValue(null) // no active loan item

    const req = makeReq({ userId: 'stu_1', bookIds: ['0209999999995'] })
    const res = await adminReturn(req)
    const json = await res.json()

    expect(res.status).toBe(200)
    expect(json.results[0].ok).toBe(false)
    expect(json.results[0].error).toContain('Keine aktive Ausleihe')
  })

  it('notifies the next reserved user after return', async () => {
    prisma.loanItem.findFirst
      // first call: find active item for this user
      .mockResolvedValueOnce({ id: 'item_1', bookId: '0209999999995', status: LoanStatus.ACTIVE })
      // second call: find next reservation
      .mockResolvedValueOnce({
        group: { user: { email: 'next@example.com' } },
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
    prisma.loanItem.findFirst
      .mockResolvedValueOnce({ id: 'item_1', bookId: '0209999999995', status: LoanStatus.ACTIVE })
      .mockResolvedValueOnce(null) // no next reservation for first
      .mockResolvedValueOnce({ id: 'item_2', bookId: '0209999999996', status: LoanStatus.ACTIVE })
      .mockResolvedValueOnce(null) // no next reservation for second

    const req = makeReq({ userId: 'stu_1', bookIds: ['0209999999995', '0209999999996'] })
    const res = await adminReturn(req)
    const json = await res.json()

    expect(json.results).toHaveLength(2)
    expect(json.results[0].ok).toBe(true)
    expect(json.results[1].ok).toBe(true)
  })
})
