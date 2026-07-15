import 'server-only';
import { createServiceClient } from './supabase/server';

/**
 * Helpers Supabase Storage (bucket `media`). Compression/optimisation à faire
 * à l'upload pour respecter le free tier (spec §1). No-op gracieux en démo.
 */
const BUCKET = 'media';

export function isStorageConfigured(): boolean {
  return createServiceClient() !== null;
}

export async function uploadMedia(
  path: string,
  body: ArrayBuffer | Uint8Array | Blob,
  contentType: string,
): Promise<{ path: string; url: string } | null> {
  const supabase = createServiceClient();
  if (!supabase) return null;
  const { error } = await supabase.storage.from(BUCKET).upload(path, body, {
    contentType,
    upsert: true,
    cacheControl: '31536000', // cache agressif (1 an)
  });
  if (error) {
    console.error('[storage] upload échoué :', error.message);
    return null;
  }
  // Bucket public → URL stable non expirante (recommandé pour médias du mariage).
  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
  return { path, url: data.publicUrl };
}

/** URL signée (bucket privé). Durée par défaut : 1 an. */
export async function getSignedUrl(path: string, expiresIn = 31_536_000): Promise<string | null> {
  const supabase = createServiceClient();
  if (!supabase) return null;
  const { data, error } = await supabase.storage.from(BUCKET).createSignedUrl(path, expiresIn);
  if (error) {
    console.error('[storage] URL signée échouée :', error.message);
    return null;
  }
  return data.signedUrl;
}
