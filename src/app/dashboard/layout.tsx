import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { withDbRetry } from '@/db';
import { getSessionUser } from '@/lib/auth';
import { isDemoMode } from '@/lib/queries';
import { getWedding } from '@/lib/queries';
import { isSupabaseConfigured } from '@/lib/supabase/config';
import { signOut } from './actions';
import { DashboardNav } from './nav';

export const metadata: Metadata = {
  title: 'Tableau de bord',
  robots: { index: false, follow: false },
};

export const dynamic = 'force-dynamic';

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const user = await getSessionUser();
  if (!user) redirect('/login');
  const wedding = await withDbRetry(() => getWedding());
  const domain =
    wedding.siteDomain ??
    (process.env.NEXT_PUBLIC_SITE_URL
      ? new URL(process.env.NEXT_PUBLIC_SITE_URL).host
      : 'mariage.example.be');

  return (
    <div className="min-h-screen bg-bg px-5 pb-16 pt-16">
      <div className="mx-auto max-w-[1080px]">
        {isDemoMode && (
          <div className="mb-5 rounded-xl border border-gold/40 bg-accent-soft/50 px-4 py-3 font-body text-[13px] text-ink">
            <strong className="font-medium">Mode démonstration</strong> — données en mémoire (aucune
            base configurée). Renseignez <code className="font-mono text-[12px]">DATABASE_URL</code>{' '}
            et les clés Supabase pour passer en production.
          </div>
        )}

        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <span className="font-accent flex h-11 w-11 items-center justify-center rounded-full bg-olive text-[19px] text-panel">
              L∞J
            </span>
            <div>
              <div className="font-display text-[30px] leading-none text-ink">
                Espace des mariés
              </div>
              <div className="mt-0.5 font-body text-[11px] uppercase tracking-[0.2em] text-sage">
                {wedding.coupleNames} · Tableau de bord
              </div>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <span className="hidden font-mono text-[12px] text-sage sm:inline">{domain}</span>
            {isSupabaseConfigured && (
              <form action={signOut}>
                <button className="rounded-lg border border-line bg-transparent px-3.5 py-2 font-body text-[12px] uppercase tracking-[0.1em] text-olive transition-colors hover:bg-panel">
                  Déconnexion
                </button>
              </form>
            )}
          </div>
        </div>

        <DashboardNav />
        {children}
      </div>
    </div>
  );
}
