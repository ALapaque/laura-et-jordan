import 'server-only';
import { redirect } from 'next/navigation';
import { createClient } from './supabase/server';
import { hasRealData, isAllowedAdmin, isSupabaseConfigured } from './supabase/config';

export interface SessionUser {
  id: string;
  email: string;
}

/**
 * Utilisateur admin connecté côté serveur (ou null).
 *
 * Mode démo : un utilisateur fictif n'est renvoyé QUE s'il n'y a aucune vraie
 * donnée derrière (pas de clé service-role → données en mémoire). Si de vraies
 * données sont accessibles mais que l'auth n'est pas configurée, on refuse.
 */
export async function getSessionUser(): Promise<SessionUser | null> {
  if (!isSupabaseConfigured) {
    return hasRealData ? null : { id: 'demo', email: 'démo@mariage.local' };
  }
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user || !isAllowedAdmin(user.email)) return null;
  return { id: user.id, email: user.email ?? '' };
}

/**
 * Garde d'accès admin. À appeler au début de CHAQUE Server Action, page et route
 * du dashboard : une Server Action est un point d'entrée HTTP public, et le
 * middleware / le layout ne suffisent pas à la protéger.
 */
export async function requireAdmin(): Promise<SessionUser> {
  const user = await getSessionUser();
  if (!user) redirect('/login');
  return user;
}
