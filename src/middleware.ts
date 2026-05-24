import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { checkRateLimit, getRateLimitHeaders } from '@/lib/utils/rate-limit'

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  if (pathname === '/') {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  if (pathname.startsWith('/api/v1/ai/agents/') || pathname.startsWith('/api/v1/cron/automation')) {
    const ip = request.headers.get('x-forwarded-for') ?? request.headers.get('x-real-ip') ?? 'anonymous'
    const key = `${ip}:${pathname}`

    let config = { windowMs: 60_000, maxRequests: 100 }
    if (pathname.includes('/vision-agent') || pathname.includes('/ocr')) {
      config = { windowMs: 60_000, maxRequests: 30 }
    }
    if (pathname.includes('/data-agent/chat') || pathname.includes('/chat')) {
      config = { windowMs: 60_000, maxRequests: 50 }
    }

    const result = checkRateLimit(key, config)
    const response = NextResponse.next()
    const headers = getRateLimitHeaders(key)

    for (const [k, v] of Object.entries(headers)) {
      response.headers.set(k, v)
    }

    if (!result.allowed) {
      return NextResponse.json(
        { error: 'Too many requests. Silakan coba lagi nanti.', code: 'RATE_LIMIT_EXCEEDED' },
        { status: 429, headers: { ...headers, 'Retry-After': String(Math.ceil((result.resetAt - Date.now()) / 1000)) } }
      )
    }

    return response
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|public|login|register).*)',
  ],
}
