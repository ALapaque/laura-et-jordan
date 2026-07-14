'use server';

import { revalidatePath } from 'next/cache';
import { updateSettings } from '@/lib/queries';

export async function updateSettingsAction(input: {
  notifyEmails: string[];
  notifyEnabled: boolean;
  rsvpDeadline: string | null;
  locales: string[];
  siteDomain: string | null;
}) {
  await updateSettings({
    notifyEmails: input.notifyEmails.map((e) => e.trim()).filter(Boolean),
    notifyEnabled: input.notifyEnabled,
    rsvpDeadline: input.rsvpDeadline || null,
    locales: input.locales.length ? input.locales : ['fr'],
    siteDomain: input.siteDomain?.trim() || null,
  });
  revalidatePath('/dashboard/settings');
  revalidatePath('/dashboard');
  return { ok: true };
}
