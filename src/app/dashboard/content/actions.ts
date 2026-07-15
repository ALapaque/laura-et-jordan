'use server';

import { revalidatePath } from 'next/cache';
import { updateWeddingContent } from '@/lib/queries';
import { isStorageConfigured, uploadMedia } from '@/lib/storage';

export async function updateContentAction(input: {
  coupleNames: string;
  eventDate: string | null;
  venue: string | null;
  welcomeText: string;
  musicUrl: string | null;
}) {
  await updateWeddingContent({
    coupleNames: input.coupleNames.trim() || 'Laura & Jordan',
    eventDate: input.eventDate || null,
    venue: input.venue?.trim() || null,
    welcomeText: input.welcomeText,
    musicUrl: input.musicUrl?.trim() || null,
  });
  revalidatePath('/dashboard/content');
  revalidatePath('/dashboard');
  return { ok: true };
}

/** Téléverse un fichier audio vers Supabase Storage (bucket public « media »). */
export async function uploadMusicAction(
  formData: FormData,
): Promise<{ url?: string; error?: string }> {
  const file = formData.get('file');
  if (!(file instanceof File) || file.size === 0) return { error: 'Aucun fichier sélectionné.' };
  if (!file.type.startsWith('audio/')) return { error: 'Le fichier doit être un audio (mp3, m4a…).' };
  if (file.size > 15 * 1024 * 1024) return { error: 'Fichier trop lourd (max 15 Mo).' };
  if (!isStorageConfigured()) {
    return {
      error: 'Storage Supabase non configuré — créez un bucket public « media », ou collez une URL.',
    };
  }
  const ext = (file.name.split('.').pop() || 'mp3').toLowerCase().replace(/[^a-z0-9]/g, '') || 'mp3';
  const result = await uploadMedia(`music/ambiance-${Date.now()}.${ext}`, await file.arrayBuffer(), file.type);
  if (!result) return { error: 'Échec du téléversement.' };
  await updateWeddingContent({ musicUrl: result.url });
  revalidatePath('/dashboard/content');
  revalidatePath('/dashboard');
  return { url: result.url };
}
