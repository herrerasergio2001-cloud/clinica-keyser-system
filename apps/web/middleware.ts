import { jwtVerify } from 'jose';
import { NextRequest, NextResponse } from 'next/server';

const publicRoutes = new Set([
  '/',
  '/login',
  '/servicios',
  '/promociones',
  '/noticias',
  '/contacto',
  '/preguntas',
]);

export async function middleware(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const token = request.cookies.get('ck_access_token')?.value;

  if (publicRoutes.has(pathname)) {
    if (pathname === '/login' && token && await isValid(token)) {
      return NextResponse.redirect(new URL('/panel', request.url));
    }
    return NextResponse.next();
  }

  if (!token || !(await isValid(token))) {
    const login = new URL('/login', request.url);
    login.searchParams.set('next', `${pathname}${search}`);
    const response = NextResponse.redirect(login);
    response.cookies.delete('ck_access_token');
    response.cookies.delete('ck_refresh_token');
    return response;
  }

  return NextResponse.next();
}

async function isValid(token: string) {
  const secret = process.env.JWT_ACCESS_SECRET;
  if (!secret) return false;
  try {
    await jwtVerify(token, new TextEncoder().encode(secret), { algorithms: ['HS256'] });
    return true;
  } catch {
    return false;
  }
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
};
