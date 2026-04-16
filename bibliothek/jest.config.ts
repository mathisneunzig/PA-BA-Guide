import type { Config } from 'jest'
import nextJest from 'next/jest.js'

const createJestConfig = nextJest({ dir: './' })

const config: Config = {
  testEnvironment: 'node',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
  moduleNameMapper: {
    // Server-only stub (must come before general @/ alias)
    '^server-only$': '<rootDir>/__mocks__/server-only.ts',
    // Prisma mock (must come before the general @/ alias so it takes precedence)
    '^@/lib/prisma$': '<rootDir>/__mocks__/prisma.ts',
    // General path alias
    '^@/(.*)$': '<rootDir>/$1',
  },
  testMatch: ['**/__tests__/**/*.test.ts'],
}

// next/jest prepends its own mappers. We need the prisma mock to override the @/ alias,
// so we post-process the config to move it before the general @/ entry.
const nextConfig = createJestConfig(config)

export default async () => {
  const resolved = await (nextConfig as () => Promise<Config>)()
  const mapper = resolved.moduleNameMapper as Record<string, string | string[]>

  // Re-order: ensure prisma mock entry appears before the general @/ alias
  const entries = Object.entries(mapper)
  const prismaEntry = entries.find(([k]) => k === '^@/lib/prisma$')
  const aliasEntry = entries.find(([k]) => k === '^@/(.*)$')

  if (prismaEntry && aliasEntry) {
    const prismaIdx = entries.indexOf(prismaEntry)
    const aliasIdx = entries.indexOf(aliasEntry)
    if (prismaIdx > aliasIdx) {
      // Move prisma before alias
      entries.splice(prismaIdx, 1)
      entries.splice(aliasIdx, 0, prismaEntry)
      resolved.moduleNameMapper = Object.fromEntries(entries)
    }
  }

  return resolved
}
