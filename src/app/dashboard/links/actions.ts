'use server';

import { revalidatePath } from 'next/cache';
import { createParcours, deleteParcours } from '@/lib/queries';

export async function createParcoursAction(input: { name: string; momentIds: string[] }) {
  const name = input.name.trim() || 'Nouveau parcours';
  const parcours = await createParcours({ name, visibleMomentIds: input.momentIds });
  revalidatePath('/dashboard/links');
  revalidatePath('/dashboard');
  return { token: parcours.token };
}

export async function deleteParcoursAction(id: string) {
  await deleteParcours(id);
  revalidatePath('/dashboard/links');
  revalidatePath('/dashboard');
}
