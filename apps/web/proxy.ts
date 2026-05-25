import { NextResponse, type NextRequest } from 'next/server';

const PROTECTED_PREFIXES = ['/dashboard', '/quiz', '/tutor', '/attempts', '/account', '/billing', '/admin'];
const AUTH_ROUTES = ['/sign-in', '/sign-up'];

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const sessionCookie =
    request.cookies.get('better-auth.session_token') ??
    request.cookies.get('__Secure-better-auth.session_token');
  const hasSession = Boolean(sessionCookie?.value);

  const isProtected = PROTECTED_PREFIXES.some((p) => pathname.startsWith(p));
  if (isProtected && !hasSession) {
    const url = request.nextUrl.clone();
    url.pathname = '/sign-in';
    url.searchParams.set('redirect', pathname);
    return NextResponse.redirect(url);
  }

  const isAuthRoute = AUTH_ROUTES.includes(pathname);
  if (isAuthRoute && hasSession) {
    const url = request.nextUrl.clone();
    url.pathname = '/dashboard';
    url.search = '';
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/quiz/:path*',
    '/tutor/:path*',
    '/attempts/:path*',
    '/account/:path*',
    '/billing/:path*',
    '/admin/:path*',
    '/sign-in',
    '/sign-up',
  ],
};
