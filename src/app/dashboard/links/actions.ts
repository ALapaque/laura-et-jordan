'use server';

import { revalidatePath } from 'next/cache';
import { createParcours, deleteParcours, updateParcours } from '@/lib/queries';
import type { RsvpQuestion } from '@/lib/types';

function revalidateAll() {
  revalidatePath('/dashboard/links');
  revalidatePath('/dashboard');
}

export async function createParcoursAction(input: {
  name: string;
  momentIds: string[];
  formQuestions?: RsvpQuestion[];
}) {
  const name = input.name.trim() || 'Nouveau parcours';
  const parcours = await createParcours({
    name,
    visibleMomentIds: input.momentIds,
    formQuestions: input.formQuestions,
  });
  revalidateAll();
  return { token: parcours.token };
}

export async function updateParcoursAction(
  id: string,
  input: { name?: string; momentIds?: string[]; formQuestions?: RsvpQuestion[] },
) {
  await updateParcours(id, {
    name: input.name?.trim() || undefined,
    visibleMomentIds: input.momentIds,
    formQuestions: input.formQuestions,
  });
  revalidateAll();
}

export async function deleteParcoursAction(id: string) {
  await deleteParcours(id);
  revalidateAll();
}
