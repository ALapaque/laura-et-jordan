import { DEFAULT_RSVP_FIELDS, type Moment, type Parcours, type RsvpResponse, type Wedding } from '@/lib/types';

/**
 * Données de démonstration (spec §10) — servent de source aux `seed.ts`
 * et de repli en MÉMOIRE quand `DATABASE_URL` est absent (mode démo).
 * Les mutations en mémoire persistent le temps du process (reset au redémarrage).
 */

export const demoWedding: Wedding = {
  id: 'demo-wedding',
  coupleNames: 'Laura & Jordan',
  eventDate: '2027-07-31T14:00:00.000Z', // 31 juillet 2027 (charte / faire-part)
  venue: null,
  welcomeText: "C'est entourés de ceux qui comptent que nous voulons dire oui.",
  rsvpDeadline: null,
  locales: ['fr'],
  notifyEmails: ['laura@exemple.be', 'jordan@exemple.be'],
  notifyEnabled: true,
  siteDomain: 'mariage.example.be',
  coverUrl: null,
  heroVideoUrl: null,
};

export const demoMoments: Moment[] = [
  {
    id: 'ceremonie',
    title: 'Cérémonie',
    startsAt: null,
    location: null,
    description: "L'échange des vœux, le moment du oui.",
    dressCode: null,
    mapLat: null,
    mapLng: null,
    mediaUrl: null,
    sortOrder: 0,
  },
  {
    id: 'apero',
    title: "Vin d'honneur",
    startsAt: null,
    location: null,
    description: 'Un verre pour trinquer tous ensemble.',
    dressCode: null,
    mapLat: null,
    mapLng: null,
    mediaUrl: null,
    sortOrder: 1,
  },
  {
    id: 'diner',
    title: 'Dîner',
    startsAt: null,
    location: null,
    description: 'Repas, discours et belles surprises.',
    dressCode: null,
    mapLat: null,
    mapLng: null,
    mediaUrl: null,
    sortOrder: 2,
  },
  {
    id: 'soiree',
    title: 'Soirée',
    startsAt: null,
    location: null,
    description: "Musique et danse jusqu'au bout de la nuit.",
    dressCode: null,
    mapLat: null,
    mapLng: null,
    mediaUrl: null,
    sortOrder: 3,
  },
];

export const demoParcours: Parcours[] = [
  {
    id: 'p1',
    token: 'ax7f9k2m',
    name: 'Journée complète',
    visibleMomentIds: ['ceremonie', 'apero', 'diner', 'soiree'],
    rsvpFields: { ...DEFAULT_RSVP_FIELDS },
    introOverride: null,
    createdAt: '2026-05-01T10:00:00.000Z',
  },
  {
    id: 'p2',
    token: 'q3m8t1zv',
    name: 'Apéro & Dîner',
    visibleMomentIds: ['apero', 'diner', 'soiree'],
    rsvpFields: { ...DEFAULT_RSVP_FIELDS },
    introOverride: null,
    createdAt: '2026-05-02T10:00:00.000Z',
  },
  {
    id: 'p3',
    token: 'k9v2p7wd',
    name: 'Cérémonie',
    visibleMomentIds: ['ceremonie', 'apero'],
    rsvpFields: { ...DEFAULT_RSVP_FIELDS, askPerMoment: false },
    introOverride: null,
    createdAt: '2026-05-03T10:00:00.000Z',
  },
];

export const demoResponses: RsvpResponse[] = [
  resp('r1', 'p1', 'Famille Dubois', 'yes', 4, '2026-06-12'),
  resp('r2', 'p2', 'Camille & Théo', 'yes', 2, '2026-06-11'),
  resp('r3', 'p3', 'Oncle Marc', 'maybe', 1, '2026-06-10'),
  resp('r4', 'p1', 'Sophie Laurent', 'yes', 2, '2026-06-09'),
  resp('r5', 'p1', 'Les Moreau', 'no', 0, '2026-06-08'),
  resp('r6', 'p2', 'Julie & Sam', 'yes', 2, '2026-06-07'),
  resp('r7', 'p3', 'Grand-mère Alice', 'yes', 1, '2026-06-06'),
  resp('r8', 'p1', 'Nicolas P.', 'maybe', 2, '2026-06-05'),
];

function resp(
  id: string,
  parcoursId: string,
  guestName: string,
  attending: RsvpResponse['attending'],
  headcount: number,
  date: string,
): RsvpResponse {
  const parcoursName = demoParcours.find((p) => p.id === parcoursId)?.name ?? '';
  return {
    id,
    parcoursId,
    parcoursName,
    guestName,
    attending,
    headcount,
    perMoment: {},
    dietary: null,
    message: null,
    locale: 'fr',
    createdAt: `${date}T12:00:00.000Z`,
  };
}

// ── Mutations en mémoire (mode démo) ─────────────────────────────
const store = {
  wedding: { ...demoWedding },
  moments: demoMoments.map((m) => ({ ...m })),
  parcours: demoParcours.map((p) => ({ ...p })),
  responses: demoResponses.map((r) => ({ ...r })),
};

export function demoStore() {
  return store;
}

let counter = store.responses.length;
export function nextDemoId(prefix: string): string {
  counter += 1;
  return `${prefix}-${counter}`;
}
