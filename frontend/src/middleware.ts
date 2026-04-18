import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 1. Define customer routes that require authentication
  const protectedCustomerRoutes = ['/dashboard', '/cart', '/trade-in'];
  const isCustomerRoute = protectedCustomerRoutes.some(route => pathname.startsWith(route));

  // 2. Protect Admin Routes
  if (pathname.startsWith('/admin')) {
    // Check for either the old admin session or the new unified vshop token
    const token = request.cookies.get('admin_session')?.value || request.cookies.get('universalAI_marketplace_token')?.value;

    if (!token) {
      return NextResponse.redirect(new URL('/auth', request.url));
    }
  }

  // 3. Protect Customer Routes
  if (isCustomerRoute) {
    // Looks for the unified token cookie
    const token = request.cookies.get('universalAI_marketplace')?.value;

    if (!token) {
      return NextResponse.redirect(new URL('/auth', request.url));
    }
  }

  // Allow the request to proceed if it passes checks
  return NextResponse.next();
}

// Tell Next.js which routes to intercept
export const config = {
  matcher: [
    '/admin/:path*',
    '/dashboard/:path*',
    
    '/trade-in/:path*',
  ],
};