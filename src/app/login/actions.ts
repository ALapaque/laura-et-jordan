'use server';

import { redirect } from 'next/navigation';
import { isAllowedAdmin, isSupabaseConfigured } from '@/lib/supabase/config';
import { createClient } from '@/lib/supabase/server';

export interface LoginState {
  error?: string;
}

export async function signIn(_prev: LoginState | null, formData: FormData): Promise<LoginState> {
  if (!isSupabaseConfigured) redirect('/dashboard');

  const email = String(formData.get('email') ?? '').trim();
  const password = String(formData.get('password') ?? '');
  if (!email || !password) return { error: 'Renseignez votre email et votre mot de passe.' };

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) return { error: 'Identifiants invalides.' };
  if (!isAllowedAdmin(data.user?.email)) {
    // Compte Supabase valide mais non autorisé : on ferme la session, même message.
    await supabase.auth.signOut();
    return { error: 'Identifiants invalides.' };
  }

  redirect('/dashboard');
}
