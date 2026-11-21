/** Vrai quand Supabase Auth est configuré. Sinon → mode démo (dashboard ouvert). */
export const isSupabaseConfigured = Boolean(
  process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
);

export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';
export const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '';

/**
 * Vrai dès que de VRAIES données sont accessibles (clé service-role présente).
 * Dans ce cas l'authentification est obligatoire, même si les clés publiques
 * manquent : une variable oubliée ne doit jamais ouvrir le dashboard (fail-closed).
 */
export const hasRealData = Boolean(
  process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY,
);

/**
 * Liste blanche optionnelle des comptes autorisés (`ADMIN_EMAILS`, séparés par
 * des virgules). Si elle est renseignée, un compte Supabase connecté mais absent
 * de la liste n'a aucun accès. Si elle est vide, tout compte Supabase connecté
 * est admin (comportement historique) — d'où l'importance de désactiver les
 * inscriptions dans Supabase.
 */
export function isAllowedAdmin(email: string | null | undefined): boolean {
  const allowed = (process.env.ADMIN_EMAILS ?? '')
    .split(',')
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
  if (allowed.length === 0) return true;
  return !!email && allowed.includes(email.trim().toLowerCase());
}
