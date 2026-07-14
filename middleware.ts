import { NextResponse, type NextRequest } from 'next/server';
import { isSupabaseConfigured } from '@/lib/supabase/config';
import { updateSession } from '@/lib/supabase/middleware';

/**
 * Rafraîchit la session Supabase et protège `/dashboard/**`.
 * En mode démo (Supabase non configuré), le dashboard reste accessible.
 */
export async function middleware(request: NextRequest) {
  const { response, user } = await updateSession(request);
  const { pathname } = request.nextUrl;

  if (pathname.startsWith('/dashboard') && isSupabaseConfigured && !user) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    url.searchParams.set('redirect', pathname);
    return NextResponse.redirect(url);
  }

  if (pathname === '/login' && isSupabaseConfigured && user) {
    const url = request.nextUrl.clone();
    url.pathname = '/dashboard';
    return NextResponse.redirect(url);
  }

  return response;
}

export const config = {
  matcher: [
    // Tout sauf les assets statiques et médias.
    '/((?!_next/static|_next/image|favicon.svg|.*\\.(?:svg|png|jpg|jpeg|gif|webp|webm|mp4|ico|woff2?)$).*)',
  ],
};
