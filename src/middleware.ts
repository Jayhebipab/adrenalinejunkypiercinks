import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const token = request.cookies.get("auth_token")?.value;
  const { pathname } = request.nextUrl;

  // I-check sa terminal kung lumalabas ito pag nag-login ka
  console.log(`--- Middleware: ${pathname} | Token: ${token ? "YES" : "NO"} ---`);

  // Proteksyon para sa /admin-panel
  if (pathname.startsWith('/admin-panel')) {
    if (!token) {
      return NextResponse.redirect(new URL('/login', request.url));
    }
  }

  // Iwasan ang login page kung naka-login na
  if (pathname === '/login' && token) {
    return NextResponse.redirect(new URL('/admin-panel', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin-panel/:path*', '/login'],
}