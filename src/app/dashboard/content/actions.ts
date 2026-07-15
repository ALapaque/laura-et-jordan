'use server';

import { revalidatePath } from 'next/cache';
import { updateWeddingContent } from '@/lib/queries';

export async function updateContentAction(input: {
  coupleNames: string;
  eventDate: string | null;
  venue: string | null;
  welcomeText: string;
}) {
  await updateWeddingContent({
    coupleNames: input.coupleNames.trim() || 'Laura & Jordan',
    eventDate: input.eventDate || null,
    venue: input.venue?.trim() || null,
    welcomeText: input.welcomeText,
  });
  revalidatePath('/dashboard/content');
  revalidatePath('/dashboard');
  return { ok: true };
}
