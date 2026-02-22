import { type NextRequest, NextResponse } from 'next/server'
import { updateSession } from './src/lib/supabase/middleware'

export async function middleware(request: NextRequest) {
  const { response, user } = await updateSession(request)

  // Protect dashboard routes (future Phase 2+)
  const isProtectedRoute = request.nextUrl.pathname.startsWith('/dashboard')
  if (isProtectedRoute && !user) {
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('redirect', request.nextUrl.pathname)
    return NextResponse.redirect(loginUrl)
  }

  return response
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
