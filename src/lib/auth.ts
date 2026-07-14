import 'server-only';
import { createClient } from './supabase/server';
import { isSupabaseConfigured } from './supabase/config';

export interface SessionUser {
  id: string;
  email: string;
}

/**
 * Utilisateur connecté côté serveur (ou null). En mode démo (Supabase non
 * configuré), renvoie un utilisateur fictif pour que le dashboard soit visible.
 */
export async function getSessionUser(): Promise<SessionUser | null> {
  if (!isSupabaseConfigured) {
    return { id: 'demo', email: 'démo@mariage.local' };
  }
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
  return { id: user.id, email: user.email ?? '' };
}
