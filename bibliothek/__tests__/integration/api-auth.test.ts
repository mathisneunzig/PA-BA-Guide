// Integration tests for auth routes

jest.mock('../../lib/prisma', () => ({
  prisma: {
    user: {
      findUnique: jest.fn(),
      findMany: jest.fn().mockResolvedValue([]),
      create: jest.fn(),
      update: jest.fn(),
    },
  },
}))

jest.mock('../../lib/email/send', () => ({
  sendVerificationEmail: jest.fn().mockResolvedValue(undefined),
  sendPasswordResetEmail: jest.fn().mockResolvedValue(undefined),
  sendNewGuestEmail: jest.fn().mockResolvedValue(undefined),
}))

jest.mock('../../lib/utils/hash', () => ({
  hashPassword: jest.fn().mockResolvedValue('hashed_pw'),
  verifyPassword: jest.fn().mockResolvedValue(true),
}))

jest.mock('../../lib/utils/token', () => ({
  generateToken: jest.fn().mockReturnValue('mock_token_abc'),
}))

import { POST as register } from '@/app/api/auth/register/route'
import { GET as verifyEmail } from '@/app/api/auth/verify-email/route'
import { POST as login } from '@/app/api/auth/login/route'
import { NextRequest } from 'next/server'

const { prisma } = jest.requireMock('../../lib/prisma')

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

describe('POST /api/auth/register', () => {
  const validBody = {
    firstname: 'Ada',
    lastname: 'Lovelace',
    username: 'ada',
    email: 'ada@example.com',
    password: 'Secret123!',
    passwordConfirm: 'Secret123!',
    agbAccepted: true,
  }

  it('creates new user and returns 201', async () => {
    prisma.user.findUnique.mockResolvedValue(null) // no existing user
    prisma.user.create.mockResolvedValue({
      id: 'u1', email: validBody.email, username: validBody.username,
      firstname: validBody.firstname, lastname: validBody.lastname,
      phone: null, createdAt: new Date(),
    })

    const req = makeReq('POST', 'http://localhost/api/auth/register', validBody)
    const res = await register(req)
    expect(res.status).toBe(201)
  })

  it('returns 409 for duplicate email', async () => {
    prisma.user.findUnique
      .mockResolvedValueOnce({ id: 'existing' }) // email exists
      .mockResolvedValueOnce(null)

    const req = makeReq('POST', 'http://localhost/api/auth/register', validBody)
    const res = await register(req)
    expect(res.status).toBe(409)
    const json = await res.json()
    expect(json.error).toMatch(/Email/i)
  })

  it('returns 409 for duplicate username', async () => {
    prisma.user.findUnique
      .mockResolvedValueOnce(null) // email not taken
      .mockResolvedValueOnce({ id: 'existing' }) // username taken

    const req = makeReq('POST', 'http://localhost/api/auth/register', validBody)
    const res = await register(req)
    expect(res.status).toBe(409)
  })

  it('returns 400 for mismatched passwords', async () => {
    const req = makeReq('POST', 'http://localhost/api/auth/register', {
      ...validBody,
      passwordConfirm: 'different',
    })
    const res = await register(req)
    expect(res.status).toBe(400)
  })
})

describe('GET /api/auth/verify-email', () => {
  it('redirects to /login on valid token', async () => {
    prisma.user.findUnique.mockResolvedValue({
      id: 'u1',
      email_verified: false,
      email_verify_expires: new Date(Date.now() + 3600000), // 1h in future
    })
    prisma.user.update.mockResolvedValue({})

    const req = makeReq('GET', 'http://localhost/api/auth/verify-email?token=valid_token')
    const res = await verifyEmail(req)
    expect(res.status).toBe(302)
    expect(res.headers.get('location')).toMatch(/login\?verified=true/)
  })

  it('returns 400 for expired token', async () => {
    prisma.user.findUnique.mockResolvedValue({
      id: 'u1',
      email_verified: false,
      email_verify_expires: new Date(Date.now() - 1000), // expired
    })

    const req = makeReq('GET', 'http://localhost/api/auth/verify-email?token=expired_token')
    const res = await verifyEmail(req)
    expect(res.status).toBe(400)
  })

  it('returns 400 for missing token', async () => {
    const req = makeReq('GET', 'http://localhost/api/auth/verify-email')
    const res = await verifyEmail(req)
    expect(res.status).toBe(400)
  })
})

describe('POST /api/auth/login', () => {
  it('returns 200 on valid credentials', async () => {
    prisma.user.findUnique.mockResolvedValue({
      id: 'u1',
      email: 'ada@example.com',
      password: 'hashed_pw',
      email_verified: true,
      role: 'STUDENT',
    })

    const req = makeReq('POST', 'http://localhost/api/auth/login', {
      email: 'ada@example.com',
      password: 'Secret123!',
    })
    const res = await login(req)
    expect(res.status).toBe(200)
  })

  it('returns 401 for wrong password', async () => {
    const { verifyPassword } = jest.requireMock('../../lib/utils/hash')
    verifyPassword.mockResolvedValueOnce(false)

    prisma.user.findUnique.mockResolvedValue({
      id: 'u1',
      email: 'ada@example.com',
      password: 'hashed_pw',
      email_verified: true,
    })

    const req = makeReq('POST', 'http://localhost/api/auth/login', {
      email: 'ada@example.com',
      password: 'WrongPass!',
    })
    const res = await login(req)
    expect(res.status).toBe(401)
  })

  it('returns 403 for unverified email', async () => {
    prisma.user.findUnique.mockResolvedValue({
      id: 'u1',
      email: 'ada@example.com',
      password: 'hashed_pw',
      email_verified: false,
    })

    const req = makeReq('POST', 'http://localhost/api/auth/login', {
      email: 'ada@example.com',
      password: 'Secret123!',
    })
    const res = await login(req)
    expect(res.status).toBe(403)
  })
})
