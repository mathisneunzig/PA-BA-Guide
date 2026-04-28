// Integration tests for /api/admin/broadcast and /api/admin/broadcast/preview

jest.mock('../../lib/prisma', () => ({
  prisma: {
    user: {
      findMany: jest.fn(),
    },
    config: {
      findUnique: jest.fn(),
    },
  },
}))

jest.mock('../../lib/auth/dal', () => ({
  requireRole: jest.fn(),
}))

jest.mock('../../lib/email/send', () => ({
  sendBroadcastEmail: jest.fn().mockResolvedValue(undefined),
}))

jest.mock('../../lib/email/render-template', () => ({
  renderTemplate: jest.fn().mockReturnValue('<html>preview</html>'),
}))

import { POST as broadcast } from '@/app/api/admin/broadcast/route'
import { POST as previewRoute } from '@/app/api/admin/broadcast/preview/route'
import { NextRequest } from 'next/server'

const { prisma } = jest.requireMock('../../lib/prisma')
const { requireRole } = jest.requireMock('../../lib/auth/dal')
const { sendBroadcastEmail } = jest.requireMock('../../lib/email/send')

const ADMIN_SESSION = { user: { id: 'admin_1', role: 'ADMIN' } }

function makeReq(url: string, body: object): NextRequest {
  return new NextRequest(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

const VALID_SUBJECTS = { de: 'Test Betreff', en: 'Test Subject', fr: 'Sujet test', es: 'Asunto prueba' }
const VALID_MESSAGES = { de: 'Test Nachricht', en: 'Test message', fr: 'Message test', es: 'Mensaje prueba' }

const VALID_BODY = {
  subjects: VALID_SUBJECTS,
  messages: VALID_MESSAGES,
  template: 'broadcast-news' as const,
}

beforeEach(() => {
  jest.clearAllMocks()
  requireRole.mockResolvedValue(ADMIN_SESSION)
})

describe('POST /api/admin/broadcast', () => {
  it('returns 400 when subjects missing', async () => {
    const req = makeReq('http://localhost/api/admin/broadcast', { messages: VALID_MESSAGES, template: 'broadcast-news' })
    const res = await broadcast(req)
    expect(res.status).toBe(400)
  })

  it('returns 400 when messages missing', async () => {
    const req = makeReq('http://localhost/api/admin/broadcast', { subjects: VALID_SUBJECTS, template: 'broadcast-news' })
    const res = await broadcast(req)
    expect(res.status).toBe(400)
  })

  it('returns 400 when German (DE) subject/message missing', async () => {
    const req = makeReq('http://localhost/api/admin/broadcast', {
      subjects: { de: '', en: 'Subject' },
      messages: { de: '', en: 'Message' },
      template: 'broadcast-news',
    })
    const res = await broadcast(req)
    expect(res.status).toBe(400)
  })

  it('returns 400 for invalid template', async () => {
    const req = makeReq('http://localhost/api/admin/broadcast', { ...VALID_BODY, template: 'invalid-template' })
    const res = await broadcast(req)
    expect(res.status).toBe(400)
  })

  it('only sends to users with marketingConsent=true', async () => {
    // Returns only consenting users (filter is applied in DB query)
    prisma.user.findMany.mockResolvedValue([
      { email: 'consenting@example.com', preferredLocale: 'de' },
    ])

    const req = makeReq('http://localhost/api/admin/broadcast', VALID_BODY)
    const res = await broadcast(req)
    expect(res.status).toBe(200)

    // Verify query filters by marketingConsent
    expect(prisma.user.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ marketingConsent: true }),
      }),
    )
    expect(sendBroadcastEmail).toHaveBeenCalledTimes(1)
    expect(sendBroadcastEmail).toHaveBeenCalledWith(
      expect.objectContaining({ to: 'consenting@example.com' }),
    )
  })

  it('sends email in user preferredLocale', async () => {
    prisma.user.findMany.mockResolvedValue([
      { email: 'de@example.com', preferredLocale: 'de' },
      { email: 'en@example.com', preferredLocale: 'en' },
    ])

    const req = makeReq('http://localhost/api/admin/broadcast', VALID_BODY)
    await broadcast(req)

    expect(sendBroadcastEmail).toHaveBeenCalledWith(
      expect.objectContaining({ to: 'de@example.com', subject: 'Test Betreff' }),
    )
    expect(sendBroadcastEmail).toHaveBeenCalledWith(
      expect.objectContaining({ to: 'en@example.com', subject: 'Test Subject' }),
    )
  })

  it('returns sent/failed counts', async () => {
    prisma.user.findMany.mockResolvedValue([
      { email: 'a@example.com', preferredLocale: 'de' },
      { email: 'b@example.com', preferredLocale: 'en' },
    ])
    sendBroadcastEmail.mockResolvedValueOnce(undefined).mockRejectedValueOnce(new Error('SMTP error'))

    const req = makeReq('http://localhost/api/admin/broadcast', VALID_BODY)
    const res = await broadcast(req)
    const json = await res.json()

    expect(json.sent).toBe(1)
    expect(json.failed).toBe(1)
    expect(json.errors).toHaveLength(1)
    expect(json.errors[0]).toContain('b@example.com')
  })

  it('returns sent=0 when no users have marketingConsent', async () => {
    prisma.user.findMany.mockResolvedValue([])

    const req = makeReq('http://localhost/api/admin/broadcast', VALID_BODY)
    const res = await broadcast(req)
    const json = await res.json()

    expect(res.status).toBe(200)
    expect(json.sent).toBe(0)
    expect(json.failed).toBe(0)
  })
})

describe('POST /api/admin/broadcast/preview', () => {
  it('returns rendered HTML when sendTest is false', async () => {
    const req = makeReq('http://localhost/api/admin/broadcast/preview', {
      ...VALID_BODY,
      sendTest: false,
    })
    const res = await previewRoute(req)
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.html).toBe('<html>preview</html>')
    expect(sendBroadcastEmail).not.toHaveBeenCalled()
  })

  it('sends to test group when sendTest is true', async () => {
    prisma.config.findUnique.mockResolvedValue({
      key: 'broadcast_test_emails',
      value: 'test1@example.com, test2@example.com',
    })

    const req = makeReq('http://localhost/api/admin/broadcast/preview', {
      ...VALID_BODY,
      sendTest: true,
    })
    const res = await previewRoute(req)
    const json = await res.json()

    expect(res.status).toBe(200)
    expect(json.sent).toBe(2)
    expect(sendBroadcastEmail).toHaveBeenCalledTimes(2)
    // Subject should be prefixed with [TESTMAIL]
    expect(sendBroadcastEmail).toHaveBeenCalledWith(
      expect.objectContaining({ subject: '[TESTMAIL] Test Betreff' }),
    )
  })

  it('returns 400 when no test emails configured', async () => {
    prisma.config.findUnique.mockResolvedValue(null)

    const req = makeReq('http://localhost/api/admin/broadcast/preview', {
      ...VALID_BODY,
      sendTest: true,
    })
    const res = await previewRoute(req)
    expect(res.status).toBe(400)
  })

  it('returns 400 when DE subject or message missing', async () => {
    const req = makeReq('http://localhost/api/admin/broadcast/preview', {
      subjects: { de: '', en: 'Subject' },
      messages: { de: '', en: 'Message' },
      template: 'broadcast-news',
      sendTest: false,
    })
    const res = await previewRoute(req)
    expect(res.status).toBe(400)
  })
})
