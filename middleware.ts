import { type NextRequest, NextResponse } from 'next/server'
import { updateSession } from './src/lib/supabase/middleware'
import { checkRateLimit } from './src/lib/rate-limit'

export async function middleware(request: NextRequest) {
  // Rate limit signup endpoint
  if (request.nextUrl.pathname === '/api/auth/signup') {
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0] ||
               request.ip ||
               'unknown'

    const { allowed, resetTime } = checkRateLimit(
      ip,
      3, // 3 signups
      24 * 60 * 60 * 1000 // per day
    )

    if (!allowed) {
      return NextResponse.json(
        { error: 'Signup rate limit exceeded. Try again tomorrow.' },
        {
          status: 429,
          headers: {
            'Retry-After': String(Math.ceil((resetTime - Date.now()) / 1000)),
          },
        }
      )
    }
  }

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
