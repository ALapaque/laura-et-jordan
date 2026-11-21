import { NextResponse, type NextRequest } from 'next/server';
import { hasRealData, isAllowedAdmin, isSupabaseConfigured } from '@/lib/supabase/config';
import { updateSession } from '@/lib/supabase/middleware';

/**
 * Rafraîchit la session Supabase et protège `/dashboard/**`.
 * En mode démo (aucune vraie donnée), le dashboard reste accessible.
 * Défense en profondeur seulement : chaque Server Action / page vérifie aussi
 * l'accès elle-même (`requireAdmin`).
 */
export async function middleware(request: NextRequest) {
  const { response, user: sessionUser } = await updateSession(request);
  const user = sessionUser && isAllowedAdmin(sessionUser.email) ? sessionUser : null;
  const { pathname } = request.nextUrl;
  const authRequired = isSupabaseConfigured || hasRealData;

  if (pathname.startsWith('/dashboard') && authRequired && !user) {
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
    // Le dashboard est TOUJOURS couvert, quelle que soit la forme de l'URL :
    // l'exclusion par extension ci-dessous laissait passer `/dashboard/links/x.png`.
    '/dashboard/:path*',
    // Tout le reste sauf les assets statiques et médias.
    '/((?!_next/static|_next/image|favicon.svg|.*\\.(?:svg|png|jpg|jpeg|gif|webp|webm|mp4|ico|woff2?)$).*)',
  ],
};
