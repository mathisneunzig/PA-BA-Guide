/**
 * Manual mock of @/lib/prisma for Jest tests.
 * Uses jest.fn() for each commonly tested method so that
 * tests can call .mockResolvedValue() etc. directly.
 */

function makeDelegateMock() {
  return {
    findMany: jest.fn(),
    findFirst: jest.fn(),
    findUnique: jest.fn(),
    findUniqueOrThrow: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    updateMany: jest.fn(),
    delete: jest.fn(),
    count: jest.fn(),
    upsert: jest.fn(),
  }
}

export const prisma = {
  $transaction: jest.fn(),
  user: makeDelegateMock(),
  book: makeDelegateMock(),
  loan: makeDelegateMock(),
  account: makeDelegateMock(),
  verificationToken: makeDelegateMock(),
  config: makeDelegateMock(),
}

beforeEach(() => {
  // Reset all mocks between tests
  Object.values(prisma).forEach((delegate) => {
    if (typeof delegate === 'function') {
      ;(delegate as jest.Mock).mockReset()
    } else if (typeof delegate === 'object' && delegate !== null) {
      Object.values(delegate).forEach((fn) => {
        if (typeof fn === 'function') (fn as jest.Mock).mockReset()
      })
    }
  })
})
