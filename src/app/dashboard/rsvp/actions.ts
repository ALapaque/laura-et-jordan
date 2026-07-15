'use server';

import { revalidatePath } from 'next/cache';
import { deleteResponse, updateResponse } from '@/lib/queries';
import type { Attending } from '@/lib/types';

export async function updateResponseAction(
  id: string,
  patch: {
    guestName?: string;
    attending?: Attending;
    headcount?: number;
    perMoment?: Record<string, boolean>;
    dietary?: string | null;
    message?: string | null;
  },
) {
  await updateResponse(id, patch);
  revalidatePath('/dashboard/rsvp');
  revalidatePath('/dashboard');
}

export async function deleteResponseAction(id: string) {
  await deleteResponse(id);
  revalidatePath('/dashboard/rsvp');
  revalidatePath('/dashboard');
}
