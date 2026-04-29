// Integration tests for /api/loans and /api/loans/[id]

jest.mock('../../lib/prisma', () => ({
  prisma: {
    $transaction: jest.fn(),
    book: {
      findMany: jest.fn(),
      update: jest.fn(),
    },
    loanGroup: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
    },
    loanItem: {
      findUnique: jest.fn(),
    },
    user: { findUnique: jest.fn(), findMany: jest.fn() },
    cartHold: { count: jest.fn().mockResolvedValue(0) },
  },
}))

jest.mock('../../lib/auth/dal', () => ({
  verifySession: jest.fn(),
  requireRole: jest.fn(),
}))

jest.mock('../../lib/loans/loan-service', () => ({
  computeDueDate: jest.requireActual('../../lib/loans/loan-service').computeDueDate,
}))

jest.mock('../../lib/loans/availability', () => ({
  countOverlappingLoans: jest.fn(),
}))

jest.mock('../../lib/email/send', () => ({
  sendReservationConfirmationEmail: jest.fn().mockResolvedValue(undefined),
  sendLoanReceiptEmail: jest.fn().mockResolvedValue(undefined),
  sendNewReservationEmail: jest.fn().mockResolvedValue(undefined),
}))

jest.mock('../../lib/cart/holds', () => ({
  releaseAllHolds: jest.fn().mockResolvedValue(undefined),
}))

import { GET as getLoans, POST as createLoan } from '@/app/api/loans/route'
import { GET as getLoan, DELETE as cancelLoanRoute } from '@/app/api/loans/[id]/route'
import { NextRequest } from 'next/server'
import { LoanStatus } from '@prisma/client'

const { prisma } = jest.requireMock('../../lib/prisma')
const { verifySession } = jest.requireMock('../../lib/auth/dal')
const { countOverlappingLoans } = jest.requireMock('../../lib/loans/availability')

const STUDENT_SESSION = { user: { id: 'stu_1', role: 'STUDENT' } }
const GUEST_SESSION = { user: { id: 'guest_1', role: 'GUEST' } }
const ADMIN_SESSION = { user: { id: 'admin_1', role: 'ADMIN' } }

const MOCK_BOOK = { id: '0209999999995', totalCopies: 2, title: 'Test Book', author: 'Author', regalnummer: null }

const MOCK_GROUP = {
  id: 'group_1',
  userId: 'stu_1',
  status: LoanStatus.RESERVED,
  startDate: new Date('2026-04-20'),
  dueDate: new Date('2026-07-20'),
  loanDurationDays: 91,
  notes: null,
  createdAt: new Date(),
  updatedAt: new Date(),
  items: [
    { id: 'item_1', groupId: 'group_1', bookId: '0209999999995', status: LoanStatus.RESERVED, book: { id: '0209999999995', title: 'Test Book', author: 'Author' } },
  ],
}

function makeReq(method: string, url: string, body?: object): NextRequest {
  return new NextRequest(url, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  })
}

beforeEach(() => {
  jest.clearAllMocks()
})

describe('GET /api/loans', () => {
  it('returns own loan groups', async () => {
    verifySession.mockResolvedValue(STUDENT_SESSION)
    prisma.loanGroup.findMany.mockResolvedValue([MOCK_GROUP])

    const req = makeReq('GET', 'http://localhost/api/loans')
    const res = await getLoans(req)
    const json = await res.json()

    expect(res.status).toBe(200)
    expect(json.groups).toHaveLength(1)
    expect(prisma.loanGroup.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { userId: 'stu_1' } }),
    )
  })
})

describe('POST /api/loans', () => {
  it('returns 403 for GUEST', async () => {
    verifySession.mockResolvedValue(GUEST_SESSION)

    const req = makeReq('POST', 'http://localhost/api/loans', {
      bookIds: ['0209999999995'],
      startDate: new Date().toISOString(),
      durationDays: 30,
    })
    const res = await createLoan(req)
    expect(res.status).toBe(403)
  })

  it('returns 404 when book not found', async () => {
    verifySession.mockResolvedValue(STUDENT_SESSION)
    prisma.book.findMany.mockResolvedValue([]) // empty — book not found

    const req = makeReq('POST', 'http://localhost/api/loans', {
      bookIds: ['0209999999995'],
      startDate: new Date().toISOString(),
      durationDays: 30,
    })
    const res = await createLoan(req)
    expect(res.status).toBe(404)
  })

  it('returns 409 when no copies available', async () => {
    verifySession.mockResolvedValue(STUDENT_SESSION)
    prisma.book.findMany.mockResolvedValue([{ ...MOCK_BOOK, totalCopies: 1 }])
    countOverlappingLoans.mockResolvedValue(1)

    const req = makeReq('POST', 'http://localhost/api/loans', {
      bookIds: ['0209999999995'],
      startDate: new Date().toISOString(),
      durationDays: 30,
    })
    const res = await createLoan(req)
    expect(res.status).toBe(409)
  })

  it('creates RESERVED loan group and returns 201', async () => {
    verifySession.mockResolvedValue(STUDENT_SESSION)
    prisma.book.findMany.mockResolvedValue([MOCK_BOOK])
    countOverlappingLoans.mockResolvedValue(0)
    prisma.$transaction.mockImplementation(async (fn: (tx: typeof prisma) => Promise<unknown>) => {
      const txMock = {
        loanGroup: { create: jest.fn().mockResolvedValue(MOCK_GROUP) },
        book: { update: jest.fn() },
      }
      return fn(txMock)
    })
    prisma.user.findUnique.mockResolvedValue(null)
    prisma.user.findMany.mockResolvedValue([])

    const req = makeReq('POST', 'http://localhost/api/loans', {
      bookIds: ['0209999999995'],
      startDate: new Date().toISOString(),
      durationDays: 30,
    })
    const res = await createLoan(req)
    expect(res.status).toBe(201)
  })

  it('returns 403 when non-admin sends immediate: true', async () => {
    verifySession.mockResolvedValue(STUDENT_SESSION)
    prisma.book.findMany.mockResolvedValue([MOCK_BOOK])
    countOverlappingLoans.mockResolvedValue(0)

    const req = makeReq('POST', 'http://localhost/api/loans', {
      bookIds: ['0209999999995'],
      startDate: new Date().toISOString(),
      durationDays: 30,
      immediate: true,
    })
    const res = await createLoan(req)
    expect(res.status).toBe(403)
  })
})

describe('DELETE /api/loans/[id]', () => {
  it('returns 403 when another user tries to cancel', async () => {
    verifySession.mockResolvedValue({ user: { id: 'other_user', role: 'STUDENT' } })
    prisma.loanItem.findUnique.mockResolvedValue({ id: 'item_1', status: LoanStatus.RESERVED, group: { userId: 'stu_1' } })

    const req = makeReq('DELETE', 'http://localhost/api/loans/item_1')
    const res = await cancelLoanRoute(req, { params: Promise.resolve({ id: 'item_1' }) })
    expect(res.status).toBe(403)
  })

  it('returns 403 when non-admin tries to cancel ACTIVE item', async () => {
    verifySession.mockResolvedValue(STUDENT_SESSION)
    prisma.loanItem.findUnique.mockResolvedValue({ id: 'item_1', status: LoanStatus.ACTIVE, group: { userId: 'stu_1' } })

    const req = makeReq('DELETE', 'http://localhost/api/loans/item_1')
    const res = await cancelLoanRoute(req, { params: Promise.resolve({ id: 'item_1' }) })
    expect(res.status).toBe(403)
  })
})
