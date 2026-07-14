import type { Metadata } from 'next';
import Link from 'next/link';
import { MotifBackground } from '@/components/ui/motif-background';
import { isSupabaseConfigured } from '@/lib/supabase/config';
import { LoginForm } from './login-form';

export const metadata: Metadata = {
  title: 'Connexion',
  robots: { index: false, follow: false },
};

export const dynamic = 'force-dynamic';

export default function LoginPage() {
  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden px-6 py-16">
      <MotifBackground className="opacity-60" patternId="login-jouy" />
      <div className="relative z-[1] w-full max-w-[400px] rounded-2xl border border-line bg-panel/95 p-9 shadow-[0_16px_50px_rgba(64,57,42,0.12)] backdrop-blur">
        <div className="mb-7 text-center">
          <span className="font-accent inline-flex h-12 w-12 items-center justify-center rounded-full bg-olive text-[20px] text-panel">
            L∞J
          </span>
          <h1 className="mt-4 font-display text-[38px] leading-none text-ink">Espace des mariés</h1>
          <p className="mt-2 font-body text-[13px] uppercase tracking-[0.2em] text-sage">
            Laura &amp; Jordan
          </p>
        </div>

        {isSupabaseConfigured ? (
          <LoginForm />
        ) : (
          <div className="text-center">
            <p className="font-body text-[15px] leading-relaxed text-muted">
              Mode démonstration — l'authentification Supabase n'est pas configurée. Le tableau de
              bord est accessible librement.
            </p>
            <Link
              href="/dashboard"
              className="mt-6 inline-block rounded-lg border-none bg-olive px-6 py-3 font-body text-[13px] uppercase tracking-[0.14em] text-panel transition-colors hover:bg-ink"
            >
              Accéder au tableau de bord
            </Link>
          </div>
        )}
      </div>
    </main>
  );
}
