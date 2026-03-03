import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

const SECRET = new TextEncoder().encode(process.env.SESSION_SECRET || "fallback-secret");

export async function proxy(request: NextRequest) {
  const sessionToken = request.cookies.get('session_token')?.value;

  const isProtectedRoute = 
    request.nextUrl.pathname.startsWith('/dashboard') ||
    request.nextUrl.pathname.startsWith('/perfil') ||
    request.nextUrl.pathname.startsWith('/admin') ||
    request.nextUrl.pathname.startsWith('/prova');

  const isLoginPage = request.nextUrl.pathname === '/login';

  if (isProtectedRoute && !sessionToken) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  if (sessionToken) {
    try {
      await jwtVerify(sessionToken, SECRET);
      
      if (isLoginPage) {
        return NextResponse.redirect(new URL('/dashboard', request.url));
      }
    } catch (error) {
      if (isProtectedRoute) {
        const response = NextResponse.redirect(new URL('/login', request.url));
        response.cookies.delete('session_token');
        return response;
      }
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Roda em tudo EXCETO:
     * - api (rotas de API)
     * - _next/static (arquivos estáticos)
     * - _next/image (otimização de imagens)
     * - favicon.ico (ícone)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};