import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// 1. The function MUST be exported with the exact name "middleware"
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Protect the admin routes
  if (pathname.startsWith('/admin')) {
    const token = request.cookies.get('admin_session')?.value;

    if (!token) {
      // If no token exists, redirect them to the storefront login
      return NextResponse.redirect(new URL('/login', request.url));
    }
  }

  // Allow the request to proceed if it passes checks
  return NextResponse.next();
}

// 2. The config object MUST be exported to tell Next.js which routes to intercept
export const config = {
  matcher: [
    /*
     * Match all request paths that start with /admin
     */
    '/admin/:path*',
  ],
};