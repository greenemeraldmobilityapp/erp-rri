import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { supabase } from './lib/db/client';

// This function can be marked as async if needed
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Redirect root to login
  if (pathname === '/') {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // Protect dashboard routes
  if (pathname.startsWith('/dashboard')) {
    const token = request.cookies.get('sb-access-token')?.value;

    if (!token) {
      // Redirect to login if not authenticated
      const url = new URL('/login', request.url);
      url.searchParams.set('callbackUrl', pathname);
      return NextResponse.redirect(url);
    }

    // Verify the session with Supabase
    try {
      const { data: { user }, error } = await supabase.auth.getUser(token);
      
      if (error || !user) {
        // Redirect to login if token is invalid
        const url = new URL('/login', request.url);
        url.searchParams.set('callbackUrl', pathname);
        return NextResponse.redirect(url);
      }
    } catch (err) {
      // Redirect to login on any error
      const url = new URL('/login', request.url);
      url.searchParams.set('callbackUrl', pathname);
      return NextResponse.redirect(url);
    }
  }

  // Allow all other requests to proceed
  return NextResponse.next();
}

// Configure which paths the middleware should run on
export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico
     * - public folder
     * - auth routes (login, register)
     * - api routes
     */
    '/((?!_next/static|_next/image|favicon.ico|public|login|register|api).*)',
  ],
};