import { z } from 'zod';

/**
 * Schéma RSVP partagé client + serveur (spec §4.3).
 * Validation pure (sans transformation) pour rester compatible avec les
 * formulaires contrôlés côté client ; la normalisation se fait côté serveur.
 */

export const ATTENDING_VALUES = ['yes', 'no', 'maybe'] as const;
export const attendingSchema = z.enum(ATTENDING_VALUES);

export const rsvpInputSchema = z
  .object({
    token: z.string().min(4).max(64),
    guestName: z.string().max(120).default(''),
    email: z.string().trim().min(1, 'Merci d’indiquer votre email.').email('Email invalide.').max(200),
    attending: attendingSchema,
    headcount: z.number().int().min(0).max(20).default(1),
    perMoment: z.record(z.string(), z.boolean()).default({}),
    dietary: z.string().max(500).default(''),
    message: z.string().max(2000).default(''),
    locale: z.enum(['fr', 'nl']).default('fr'),
  })
  .superRefine((val, ctx) => {
    // Un nom est requis dès qu'on ne décline pas (le flux « Non » n'en demande pas).
    if (val.attending !== 'no' && val.guestName.trim().length === 0) {
      ctx.addIssue({
        code: 'custom',
        path: ['guestName'],
        message: 'Merci d’indiquer votre nom.',
      });
    }
  });

export type RsvpInput = z.infer<typeof rsvpInputSchema>;

/** Libellés FR des statuts de présence. */
export const ATTENDING_LABELS: Record<(typeof ATTENDING_VALUES)[number], string> = {
  yes: 'Présent',
  no: 'Absent',
  maybe: 'Peut-être',
};
