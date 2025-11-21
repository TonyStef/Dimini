import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// ========================================
// Route Configuration
// ========================================

const PUBLIC_ROUTES = ['/', '/login', '/register'];
const PROTECTED_ROUTES = ['/dashboard', '/patients', '/sessions'];

// ========================================
// Middleware Function
// ========================================

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Get token from cookies (if stored there) or check if path suggests authenticated state
  // Note: We're using localStorage for token storage, so we can't directly check it in middleware
  // Instead, we'll rely on client-side AuthContext for the actual auth check
  // This middleware provides a basic layer of route organization

  // If accessing protected route
  const isProtectedRoute = PROTECTED_ROUTES.some((route) => pathname.startsWith(route));

  // If accessing auth pages (login/register)
  const isAuthPage = pathname === '/login' || pathname === '/register';

  // For now, allow all routes since we're using client-side auth with localStorage
  // The AuthContext will handle redirects on the client side
  // This middleware could be enhanced later with cookie-based auth if needed

  return NextResponse.next();
}

// ========================================
// Matcher Configuration
// ========================================

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (images, etc.)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\.svg|.*\\.png|.*\\.jpg|.*\\.jpeg|.*\\.gif|.*\\.webp).*)',
  ],
};
