import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { auth } from '@/auth'

const PROTECTED_PREFIXES = ['/dashboard', '/profile', '/my-loans']
const ADMIN_PREFIXES = ['/admin']
const AUTH_ONLY_ROUTES = ['/login', '/register', '/forgot-password', '/reset-password']

// In Next.js 16 the middleware file is proxy.ts and the export must be named `proxy`.
export async function proxy(request: NextRequest) {
  const session = await auth()
  const { pathname } = request.nextUrl
  const isAuthenticated = !!session?.user

  // Admin routes
  const isAdminRoute = ADMIN_PREFIXES.some((p) => pathname.startsWith(p))
  if (isAdminRoute) {
    if (!isAuthenticated) {
      return NextResponse.redirect(
        new URL(`/login?callbackUrl=${encodeURIComponent(pathname)}`, request.url),
      )
    }
    if (session.user.role !== 'ADMIN') {
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }
    return NextResponse.next()
  }

  // Protected routes
  const isProtected = PROTECTED_PREFIXES.some((p) => pathname.startsWith(p))
  if (isProtected && !isAuthenticated) {
    return NextResponse.redirect(
      new URL(`/login?callbackUrl=${encodeURIComponent(pathname)}`, request.url),
    )
  }

  // Auth-only routes (redirect logged-in users away)
  const isAuthRoute = AUTH_ONLY_ROUTES.some((p) => pathname.startsWith(p))
  if (isAuthRoute && isAuthenticated) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|public).*)'],
}
