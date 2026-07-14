'use server';

import { revalidatePath } from 'next/cache';
import { createMoment, deleteMoment, reorderMoments, updateMoment } from '@/lib/queries';
import type { Moment } from '@/lib/types';

function revalidateAll() {
  revalidatePath('/dashboard/moments');
  revalidatePath('/dashboard');
  revalidatePath('/dashboard/links');
}

export async function createMomentAction(title: string): Promise<Moment> {
  const moment = await createMoment({ title: title.trim() || 'Nouveau moment' });
  revalidateAll();
  return moment;
}

export async function updateMomentAction(
  id: string,
  patch: {
    title?: string;
    startsAt?: string | null;
    location?: string | null;
    description?: string;
    dressCode?: string | null;
  },
) {
  await updateMoment(id, patch);
  revalidateAll();
}

export async function deleteMomentAction(id: string) {
  await deleteMoment(id);
  revalidateAll();
}

export async function reorderMomentsAction(ids: string[]) {
  await reorderMoments(ids);
  revalidateAll();
}
