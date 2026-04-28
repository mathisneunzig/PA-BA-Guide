// Integration tests for /api/users

jest.mock('../../lib/prisma', () => ({
  prisma: {
    user: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
  },
}))

jest.mock('../../lib/auth/dal', () => ({
  verifySession: jest.fn(),
  requireRole: jest.fn(),
}))

import { GET as listUsers } from '@/app/api/users/route'
import { GET as getUser, PUT as updateUser, DELETE as deleteUser } from '@/app/api/users/[id]/route'
import { NextRequest } from 'next/server'

const { prisma } = jest.requireMock('../../lib/prisma')
const { verifySession, requireRole } = jest.requireMock('../../lib/auth/dal')

const ADMIN_SESSION = { user: { id: 'admin_1', role: 'ADMIN' } }
const STUDENT_SESSION = { user: { id: 'stu_1', role: 'STUDENT' } }

const MOCK_USER = {
  id: 'stu_1', username: 'student', email: 'stu@example.com',
  firstname: 'Ada', lastname: 'L', phone: null, role: 'STUDENT',
  email_verified: true,
  createdAt: new Date(), updatedAt: new Date(),
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

describe('GET /api/users', () => {
  it('returns 403 for non-admin (requireRole throws)', async () => {
    requireRole.mockImplementation(() => { throw new Error('Forbidden') })

    await expect(listUsers()).rejects.toThrow('Forbidden')
  })

  it('returns user list for admin', async () => {
    requireRole.mockResolvedValue(ADMIN_SESSION)
    prisma.user.findMany.mockResolvedValue([MOCK_USER])

    const res = await listUsers()
    const json = await res.json()
    expect(res.status).toBe(200)
    expect(json.users).toHaveLength(1)
  })
})

describe('GET /api/users/[id]', () => {
  it('returns 200 for own profile', async () => {
    verifySession.mockResolvedValue(STUDENT_SESSION)
    prisma.user.findUnique.mockResolvedValue(MOCK_USER)

    const req = makeReq('GET', 'http://localhost/api/users/stu_1')
    const res = await getUser(req, { params: Promise.resolve({ id: 'stu_1' }) })
    expect(res.status).toBe(200)
    // Response must be flat user object (not wrapped in { user: ... })
    const json = await res.json()
    expect(json.id).toBe('stu_1')
    expect(json.email_verified).toBe(true)
    expect(json.user).toBeUndefined()
  })

  it('returns 403 when accessing another user', async () => {
    verifySession.mockResolvedValue(STUDENT_SESSION) // id is stu_1
    const req = makeReq('GET', 'http://localhost/api/users/other_user')
    const res = await getUser(req, { params: Promise.resolve({ id: 'other_user' }) })
    expect(res.status).toBe(403)
  })

  it('returns 404 when user not found', async () => {
    verifySession.mockResolvedValue(ADMIN_SESSION)
    prisma.user.findUnique.mockResolvedValue(null)

    const req = makeReq('GET', 'http://localhost/api/users/missing')
    const res = await getUser(req, { params: Promise.resolve({ id: 'missing' }) })
    expect(res.status).toBe(404)
  })
})

describe('PUT /api/users/[id]', () => {
  it('updates own profile', async () => {
    verifySession.mockResolvedValue(STUDENT_SESSION)
    prisma.user.findFirst.mockResolvedValue(null) // username not taken
    prisma.user.update.mockResolvedValue({ ...MOCK_USER, firstname: 'Updated' })

    const req = makeReq('PUT', 'http://localhost/api/users/stu_1', { firstname: 'Updated' })
    const res = await updateUser(req, { params: Promise.resolve({ id: 'stu_1' }) })
    expect(res.status).toBe(200)
  })

  it('returns 403 when updating another user', async () => {
    verifySession.mockResolvedValue(STUDENT_SESSION)

    const req = makeReq('PUT', 'http://localhost/api/users/other', { firstname: 'X' })
    const res = await updateUser(req, { params: Promise.resolve({ id: 'other' }) })
    expect(res.status).toBe(403)
  })

  it('returns 409 when username is taken', async () => {
    verifySession.mockResolvedValue(STUDENT_SESSION)
    prisma.user.findFirst.mockResolvedValue({ id: 'another_user' }) // username taken

    const req = makeReq('PUT', 'http://localhost/api/users/stu_1', { username: 'taken' })
    const res = await updateUser(req, { params: Promise.resolve({ id: 'stu_1' }) })
    expect(res.status).toBe(409)
  })
})

describe('DELETE /api/users/[id]', () => {
  it('deletes own account', async () => {
    verifySession.mockResolvedValue(STUDENT_SESSION)
    prisma.user.delete.mockResolvedValue(MOCK_USER)

    const req = makeReq('DELETE', 'http://localhost/api/users/stu_1')
    const res = await deleteUser(req, { params: Promise.resolve({ id: 'stu_1' }) })
    expect(res.status).toBe(200)
  })

  it('returns 403 when deleting another user', async () => {
    verifySession.mockResolvedValue(STUDENT_SESSION)

    const req = makeReq('DELETE', 'http://localhost/api/users/other')
    const res = await deleteUser(req, { params: Promise.resolve({ id: 'other' }) })
    expect(res.status).toBe(403)
  })
})
