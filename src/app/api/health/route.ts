import { NextResponse } from 'next/server';
import { withDbRetry } from '@/db';
import { getWedding } from '@/lib/queries';

/**
 * Endpoint de supervision — cible du pinger externe (cron-job.org, UptimeRobot…).
 *
 * Pourquoi il existe : les projets Supabase gratuits sont mis en pause après
 * 7 jours SANS activité base. Il faut donc une URL qui déclenche une **vraie
 * lecture Postgres** à chaque appel. La page d'accueil est statique (elle ne
 * réveillerait rien) et `/i/<token>` renvoie 404 sur un token inexistant, ce
 * que les services de monitoring interprètent comme une panne.
 *
 * Ici : lecture réelle en base, puis **200** si tout va bien (compatible avec
 * n'importe quel service de monitoring), **503** si la base ne répond pas —
 * ce qui déclenche une alerte utile plutôt qu'un faux positif.
 *
 * Aucune donnée sensible n'est renvoyée : uniquement un statut.
 */
export const dynamic = 'force-dynamic'; // jamais de cache → chaque appel touche la base

export async function GET() {
  try {
    await withDbRetry(() => getWedding());
    return NextResponse.json(
      { ok: true, db: 'up', at: new Date().toISOString() },
      { headers: { 'Cache-Control': 'no-store' } },
    );
  } catch {
    return NextResponse.json(
      { ok: false, db: 'down', at: new Date().toISOString() },
      { status: 503, headers: { 'Cache-Control': 'no-store' } },
    );
  }
}
