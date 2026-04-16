import type { NextAuthConfig } from 'next-auth'
import Credentials from 'next-auth/providers/credentials'

// Edge-safe config: no Prisma imports here.
// Used by proxy.ts for optimistic route checks.
export const authConfig: NextAuthConfig = {
  providers: [
    Credentials({
      credentials: {
        email: { type: 'email' },
        password: { type: 'password' },
      },
      // Real authorize() lives in auth.ts. This stub is required for the provider to be listed.
      async authorize() {
        return null
      },
    }),
  ],
  pages: {
    signIn: '/login',
    error: '/login',
  },
  callbacks: {
    authorized({ auth, request }) {
      const isLoggedIn = !!auth?.user
      const path = request.nextUrl.pathname
      const isProtected =
        path.startsWith('/dashboard') ||
        path.startsWith('/profile') ||
        path.startsWith('/my-loans') ||
        path.startsWith('/admin')
      if (isProtected && !isLoggedIn) return false
      return true
    },
  },
}
