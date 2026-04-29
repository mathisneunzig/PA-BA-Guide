// Integration tests for /api/admin/config (GET + PUT)

jest.mock('../../lib/prisma', () => ({
  prisma: {
    config: {
      findUnique: jest.fn(),
      upsert: jest.fn(),
    },
  },
}))

jest.mock('../../lib/auth/dal', () => ({
  requireRole: jest.fn(),
}))

import { GET as getConfig, PUT as putConfig } from '@/app/api/admin/config/route'
import { NextRequest } from 'next/server'

const { prisma } = jest.requireMock('../../lib/prisma')
const { requireRole } = jest.requireMock('../../lib/auth/dal')

const ADMIN_SESSION = { user: { id: 'admin_1', role: 'ADMIN' } }

function makeReq(method: string, url: string, body?: object): NextRequest {
  return new NextRequest(url, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  })
}

beforeEach(() => {
  jest.clearAllMocks()
  requireRole.mockResolvedValue(ADMIN_SESSION)
})

describe('GET /api/admin/config', () => {
  it('returns 400 when key param is missing', async () => {
    const req = makeReq('GET', 'http://localhost/api/admin/config')
    const res = await getConfig(req)
    expect(res.status).toBe(400)
  })

  it('returns value when config exists', async () => {
    prisma.config.findUnique.mockResolvedValue({ key: 'broadcast_test_emails', value: 'test@example.com' })

    const req = makeReq('GET', 'http://localhost/api/admin/config?key=broadcast_test_emails')
    const res = await getConfig(req)
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.value).toBe('test@example.com')
    expect(json.key).toBe('broadcast_test_emails')
  })

  it('returns empty string when config key does not exist', async () => {
    prisma.config.findUnique.mockResolvedValue(null)

    const req = makeReq('GET', 'http://localhost/api/admin/config?key=nonexistent')
    const res = await getConfig(req)
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.value).toBe('')
  })
})

describe('PUT /api/admin/config', () => {
  it('returns 400 when key is missing', async () => {
    const req = makeReq('PUT', 'http://localhost/api/admin/config', { value: 'test' })
    const res = await putConfig(req)
    expect(res.status).toBe(400)
  })

  it('upserts config and returns ok', async () => {
    prisma.config.upsert.mockResolvedValue({ key: 'broadcast_test_emails', value: 'new@example.com' })

    const req = makeReq('PUT', 'http://localhost/api/admin/config', {
      key: 'broadcast_test_emails',
      value: 'new@example.com',
    })
    const res = await putConfig(req)
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.ok).toBe(true)
    expect(prisma.config.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { key: 'broadcast_test_emails' },
        update: { value: 'new@example.com' },
      }),
    )
  })
})
