// Integration tests for /api/loans and /api/loans/[id]

jest.mock('../../lib/prisma', () => ({
  prisma: {
    $transaction: jest.fn(),
    book: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    loan: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      findUniqueOrThrow: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    user: { findUnique: jest.fn() },
  },
}))

jest.mock('../../lib/auth/dal', () => ({
  verifySession: jest.fn(),
  requireRole: jest.fn(),
}))

jest.mock('../../lib/loans/loan-service', () => ({
  computeDueDate: jest.requireActual('../../lib/loans/loan-service').computeDueDate,
  activateLoan: jest.fn(),
  returnLoan: jest.fn(),
  cancelLoan: jest.fn(),
}))

jest.mock('../../lib/loans/availability', () => ({
  countOverlappingLoans: jest.fn(),
}))

jest.mock('../../lib/email/send', () => ({
  sendReservationConfirmationEmail: jest.fn().mockResolvedValue(undefined),
  sendLoanReceiptEmail: jest.fn().mockResolvedValue(undefined),
}))

import { GET as getLoans, POST as createLoan } from '@/app/api/loans/route'
import { GET as getLoan, PUT as updateLoan, DELETE as cancelLoanRoute } from '@/app/api/loans/[id]/route'
import { NextRequest } from 'next/server'
import { LoanStatus } from '@prisma/client'

const { prisma } = jest.requireMock('../../lib/prisma')
const { verifySession, requireRole } = jest.requireMock('../../lib/auth/dal')
const { activateLoan, returnLoan, cancelLoan } = jest.requireMock('../../lib/loans/loan-service')
const { countOverlappingLoans } = jest.requireMock('../../lib/loans/availability')

const STUDENT_SESSION = { user: { id: 'stu_1', role: 'STUDENT' } }
const GUEST_SESSION = { user: { id: 'guest_1', role: 'GUEST' } }
const ADMIN_SESSION = { user: { id: 'admin_1', role: 'ADMIN' } }

const MOCK_LOAN = {
  id: 'loan_1',
  userId: 'stu_1',
  bookId: '0209999999995',
  status: LoanStatus.RESERVED,
  startDate: new Date('2026-04-20'),
  dueDate: new Date('2026-07-20'),
  returnedAt: null,
  loanDurationDays: 91,
  notes: null,
  reminderSentAt: null,
  createdAt: new Date(),
  updatedAt: new Date(),
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
  it('returns only own loans', async () => {
    verifySession.mockResolvedValue(STUDENT_SESSION)
    prisma.loan.findMany.mockResolvedValue([MOCK_LOAN])

    const req = makeReq('GET', 'http://localhost/api/loans')
    const res = await getLoans(req)
    const json = await res.json()

    expect(res.status).toBe(200)
    expect(json.loans).toHaveLength(1)
    expect(prisma.loan.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { userId: 'stu_1' } }),
    )
  })
})

describe('POST /api/loans', () => {
  it('returns 403 for GUEST', async () => {
    verifySession.mockResolvedValue(GUEST_SESSION)

    const req = makeReq('POST', 'http://localhost/api/loans', {
      bookId: '0209999999995',
      startDate: new Date().toISOString(),
      durationDays: 30,
    })
    const res = await createLoan(req)
    expect(res.status).toBe(403)
  })

  it('returns 404 when book not found', async () => {
    verifySession.mockResolvedValue(STUDENT_SESSION)
    prisma.book.findUnique.mockResolvedValue(null)

    const req = makeReq('POST', 'http://localhost/api/loans', {
      bookId: '0209999999995',
      startDate: new Date().toISOString(),
      durationDays: 30,
    })
    const res = await createLoan(req)
    expect(res.status).toBe(404)
  })

  it('returns 409 when no copies available', async () => {
    verifySession.mockResolvedValue(STUDENT_SESSION)
    prisma.book.findUnique.mockResolvedValue({ totalCopies: 1, title: 'Test', author: 'Auth' })
    countOverlappingLoans.mockResolvedValue(1) // all copies taken

    const req = makeReq('POST', 'http://localhost/api/loans', {
      bookId: '0209999999995',
      startDate: new Date().toISOString(),
      durationDays: 30,
    })
    const res = await createLoan(req)
    expect(res.status).toBe(409)
  })

  it('creates RESERVED loan and decrements availableCopies', async () => {
    verifySession.mockResolvedValue(STUDENT_SESSION)
    prisma.book.findUnique.mockResolvedValue({ totalCopies: 2, title: 'Test', author: 'Auth' })
    countOverlappingLoans.mockResolvedValue(0)
    prisma.$transaction.mockImplementation(async (fn: (tx: typeof prisma) => Promise<unknown>) => {
      const txMock = {
        loan: { create: jest.fn().mockResolvedValue(MOCK_LOAN) },
        book: { update: jest.fn() },
      }
      return fn(txMock)
    })
    prisma.user.findUnique.mockResolvedValue(null) // no email

    const req = makeReq('POST', 'http://localhost/api/loans', {
      bookId: '0209999999995',
      startDate: new Date().toISOString(),
      durationDays: 30,
    })
    const res = await createLoan(req)
    expect(res.status).toBe(201)
  })
})

describe('PUT /api/loans/[id]', () => {
  it('activates loan (RESERVED → ACTIVE)', async () => {
    requireRole.mockResolvedValue(ADMIN_SESSION)
    activateLoan.mockResolvedValue({ ...MOCK_LOAN, status: LoanStatus.ACTIVE, dueDate: new Date() })
    prisma.user.findUnique.mockResolvedValue(null)
    prisma.book.findUnique.mockResolvedValue({ title: 'Test' })

    const req = makeReq('PUT', 'http://localhost/api/loans/loan_1', { status: 'ACTIVE' })
    const res = await updateLoan(req, { params: Promise.resolve({ id: 'loan_1' }) })
    expect(res.status).toBe(200)
    expect(activateLoan).toHaveBeenCalledWith('loan_1')
  })

  it('returns loan (ACTIVE → RETURNED)', async () => {
    requireRole.mockResolvedValue(ADMIN_SESSION)
    returnLoan.mockResolvedValue(undefined)
    prisma.loan.findUniqueOrThrow.mockResolvedValue({ ...MOCK_LOAN, status: LoanStatus.RETURNED })

    const req = makeReq('PUT', 'http://localhost/api/loans/loan_1', { status: 'RETURNED' })
    const res = await updateLoan(req, { params: Promise.resolve({ id: 'loan_1' }) })
    expect(res.status).toBe(200)
    expect(returnLoan).toHaveBeenCalledWith('loan_1')
  })
})

describe('DELETE /api/loans/[id]', () => {
  it('returns 403 when another user tries to cancel', async () => {
    verifySession.mockResolvedValue({ user: { id: 'other_user', role: 'STUDENT' } })
    prisma.loan.findUnique.mockResolvedValue({ userId: 'stu_1', status: LoanStatus.RESERVED })

    const req = makeReq('DELETE', 'http://localhost/api/loans/loan_1')
    const res = await cancelLoanRoute(req, { params: Promise.resolve({ id: 'loan_1' }) })
    expect(res.status).toBe(403)
  })

  it('cancels reservation and increments copies', async () => {
    verifySession.mockResolvedValue(STUDENT_SESSION)
    prisma.loan.findUnique.mockResolvedValue({ userId: 'stu_1', status: LoanStatus.RESERVED })
    cancelLoan.mockResolvedValue(undefined)

    const req = makeReq('DELETE', 'http://localhost/api/loans/loan_1')
    const res = await cancelLoanRoute(req, { params: Promise.resolve({ id: 'loan_1' }) })
    expect(res.status).toBe(200)
    expect(cancelLoan).toHaveBeenCalledWith('loan_1')
  })

  it('returns 403 when non-admin tries to cancel ACTIVE loan', async () => {
    verifySession.mockResolvedValue(STUDENT_SESSION)
    prisma.loan.findUnique.mockResolvedValue({ userId: 'stu_1', status: LoanStatus.ACTIVE })

    const req = makeReq('DELETE', 'http://localhost/api/loans/loan_1')
    const res = await cancelLoanRoute(req, { params: Promise.resolve({ id: 'loan_1' }) })
    expect(res.status).toBe(403)
  })
})

describe('POST /api/loans — handover fields', () => {
  beforeEach(() => {
    verifySession.mockResolvedValue(STUDENT_SESSION)
    prisma.book.findUnique.mockResolvedValue({ totalCopies: 2, title: 'Test', author: 'Auth' })
    countOverlappingLoans.mockResolvedValue(0)
    prisma.$transaction.mockImplementation(async (fn: (tx: typeof prisma) => Promise<unknown>) => {
      const txMock = {
        loan: { create: jest.fn().mockResolvedValue(MOCK_LOAN) },
        book: { update: jest.fn() },
      }
      return fn(txMock)
    })
    prisma.user.findUnique.mockResolvedValue(null)
  })

  it('saves PICKUP handover method', async () => {
    const req = makeReq('POST', 'http://localhost/api/loans', {
      bookId: '0209999999995',
      startDate: new Date().toISOString(),
      durationDays: 30,
      handoverMethod: 'PICKUP',
      handoverDate: new Date().toISOString(),
    })
    const res = await createLoan(req)
    expect(res.status).toBe(201)
  })

  it('saves SHIPPING handover method with cost', async () => {
    const req = makeReq('POST', 'http://localhost/api/loans', {
      bookId: '0209999999995',
      startDate: new Date().toISOString(),
      durationDays: 30,
      handoverMethod: 'SHIPPING',
      handoverCost: 4.99,
    })
    const res = await createLoan(req)
    expect(res.status).toBe(201)
  })

  it('saves MEETINGPOINT handover method with location', async () => {
    const req = makeReq('POST', 'http://localhost/api/loans', {
      bookId: '0209999999995',
      startDate: new Date().toISOString(),
      durationDays: 30,
      handoverMethod: 'MEETINGPOINT',
      handoverDate: new Date().toISOString(),
      handoverLocation: 'Bibliothek, Zimmer 205',
    })
    const res = await createLoan(req)
    expect(res.status).toBe(201)
  })

  it('returns 403 when non-admin sends immediate: true', async () => {
    const req = makeReq('POST', 'http://localhost/api/loans', {
      bookId: '0209999999995',
      startDate: new Date().toISOString(),
      durationDays: 30,
      immediate: true,
    })
    const res = await createLoan(req)
    expect(res.status).toBe(403)
  })

  it('allows admin to create immediate ACTIVE loan', async () => {
    verifySession.mockResolvedValue(ADMIN_SESSION)
    const req = makeReq('POST', 'http://localhost/api/loans', {
      bookId: '0209999999995',
      startDate: new Date().toISOString(),
      durationDays: 30,
      immediate: true,
    })
    const res = await createLoan(req)
    expect(res.status).toBe(201)
  })
})
