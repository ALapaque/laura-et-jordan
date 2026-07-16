import {
  DEFAULT_QUESTIONS,
  DEFAULT_RSVP_FIELDS,
  type DetailCard,
  type Moment,
  type MomentAsset,
  type Parcours,
  type RsvpResponse,
  type Wedding,
} from '@/lib/types';

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
    media: [
      { id: 'cm-1', url: '/motif.jpg', sortOrder: 0 },
      { id: 'cm-2', url: '/motif.jpg', sortOrder: 1 },
    ],
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
    media: [],
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
    media: [
      { id: 'dm-1', url: '/motif.jpg', sortOrder: 0 },
      { id: 'dm-2', url: '/motif.jpg', sortOrder: 1 },
      { id: 'dm-3', url: '/motif.jpg', sortOrder: 2 },
    ],
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
    media: [],
    sortOrder: 3,
  },
];

export const demoDetailCards: DetailCard[] = [
  { id: 'd-lieu', label: 'Lieu', value: 'Le lieu vous sera bientôt dévoilé', mediaUrl: null, sortOrder: 0 },
  {
    id: 'd-dress',
    label: 'Dress code',
    value: 'Élégant · tons naturels bienvenus',
    mediaUrl: null,
    sortOrder: 1,
  },
  {
    id: 'd-acces',
    label: 'Accès & hébergements',
    value: 'Informations à venir prochainement',
    mediaUrl: null,
    sortOrder: 2,
  },
];

export const demoParcours: Parcours[] = [
  {
    id: 'p1',
    token: 'ax7f9k2m',
    name: 'Journée complète',
    visibleMomentIds: ['ceremonie', 'apero', 'diner', 'soiree'],
    rsvpFields: { ...DEFAULT_RSVP_FIELDS },
    formQuestions: [
      { id: 'headcount', label: 'Nombre de personnes', type: 'headcount' },
      { id: 'moments', label: 'À quels moments serez-vous présents ?', type: 'moments' },
      {
        id: 'menu',
        label: 'Choix du menu',
        type: 'single_choice',
        options: ['Viande', 'Poisson', 'Végétarien'],
        required: true,
      },
      { id: 'allergies', label: 'Allergies / régime particulier', type: 'short_text' },
      { id: 'lodging', label: "Avez-vous besoin d'un hébergement ?", type: 'yes_no' },
      {
        id: 'stay',
        label: 'Dates de séjour au gîte',
        type: 'date_range',
        help: 'Arrivée → départ.',
        showIf: { questionId: 'lodging', value: 'Oui' },
      },
      { id: 'song', label: 'Une chanson à demander au DJ ?', type: 'short_text' },
      { id: 'message', label: 'Un petit mot pour les mariés', type: 'long_text' },
    ],
    introOverride: null,
    createdAt: '2026-05-01T10:00:00.000Z',
  },
  {
    id: 'p2',
    token: 'q3m8t1zv',
    name: 'Apéro & Dîner',
    visibleMomentIds: ['apero', 'diner', 'soiree'],
    rsvpFields: { ...DEFAULT_RSVP_FIELDS },
    formQuestions: DEFAULT_QUESTIONS.map((q) => ({ ...q })),
    introOverride: null,
    createdAt: '2026-05-02T10:00:00.000Z',
  },
  {
    id: 'p3',
    token: 'k9v2p7wd',
    name: 'Cérémonie',
    visibleMomentIds: ['ceremonie', 'apero'],
    rsvpFields: { ...DEFAULT_RSVP_FIELDS, askPerMoment: false },
    formQuestions: DEFAULT_QUESTIONS.filter((q) => q.type !== 'moments').map((q) => ({ ...q })),
    introOverride: null,
    createdAt: '2026-05-03T10:00:00.000Z',
  },
];

export const demoResponses: RsvpResponse[] = [
  resp(
    'r1',
    'p1',
    'Famille Dubois',
    'yes',
    4,
    '2026-06-12',
    { ceremonie: true, apero: true, diner: true, soiree: true },
    'famille.dubois@exemple.be',
  ),
  resp(
    'r2',
    'p2',
    'Camille & Théo',
    'yes',
    2,
    '2026-06-11',
    { apero: true, diner: true, soiree: true },
    'camille.theo@exemple.be',
  ),
  resp('r3', 'p3', 'Oncle Marc', 'maybe', 1, '2026-06-10'),
  resp('r4', 'p1', 'Sophie Laurent', 'yes', 2, '2026-06-09', { ceremonie: true, diner: true }, 'sophie.laurent@exemple.be'),
  resp('r5', 'p1', 'Les Moreau', 'no', 0, '2026-06-08'),
  resp('r6', 'p2', 'Julie & Sam', 'yes', 2, '2026-06-07', { apero: true, diner: true }),
  resp('r7', 'p3', 'Grand-mère Alice', 'yes', 1, '2026-06-06'),
  resp('r8', 'p1', 'Nicolas P.', 'maybe', 2, '2026-06-05', { ceremonie: true, soiree: true }),
];

function resp(
  id: string,
  parcoursId: string,
  guestName: string,
  attending: RsvpResponse['attending'],
  headcount: number,
  date: string,
  perMoment: Record<string, boolean> = {},
  email: string | null = null,
): RsvpResponse {
  const parcoursName = demoParcours.find((p) => p.id === parcoursId)?.name ?? '';
  return {
    id,
    parcoursId,
    parcoursName,
    guestName,
    email,
    attending,
    headcount,
    perMoment,
    dietary: null,
    message: null,
    answers: {},
    locale: 'fr',
    createdAt: `${date}T12:00:00.000Z`,
  };
}

// ── Mutations en mémoire (mode démo) ─────────────────────────────
const store = {
  wedding: { ...demoWedding },
  moments: demoMoments.map((m) => ({ ...m })),
  detailCards: demoDetailCards.map((c) => ({ ...c })),
  parcours: demoParcours.map((p) => ({ ...p })),
  responses: demoResponses.map((r) => ({ ...r })),
  gallery: [] as MomentAsset[],
};

export function demoStore() {
  return store;
}

let counter = store.responses.length;
export function nextDemoId(prefix: string): string {
  counter += 1;
  return `${prefix}-${counter}`;
}
