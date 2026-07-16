/**
 * Types applicatifs (découplés de Drizzle) partagés par les Server
 * Components, les Server Actions, l'API RSVP et les composants clients.
 * Les requêtes DB comme les données de démo produisent ces mêmes formes.
 */

export type Attending = 'yes' | 'no' | 'maybe';

/** Configuration des étapes RSVP, pilotée par parcours (spec §4.3). */
export interface RsvpFields {
  askNames: boolean;
  askHeadcount: boolean;
  askPerMoment: boolean;
  askDietary: boolean;
  askMessage: boolean;
  maxHeadcount: number;
}

export const DEFAULT_RSVP_FIELDS: RsvpFields = {
  askNames: true,
  askHeadcount: true,
  askPerMoment: true,
  askDietary: true,
  askMessage: true,
  maxHeadcount: 12,
};

// ── Formulaire dynamique par parcours ────────────────────────────
export type RsvpQuestionType =
  | 'short_text'
  | 'long_text'
  | 'single_choice'
  | 'multi_choice'
  | 'yes_no'
  | 'number'
  | 'date'
  | 'date_range'
  | 'time'
  | 'headcount' // spécial → colonne `headcount` (stat des présents)
  | 'moments'; // spécial → colonne `per_moment` (filtre par moment)

export interface RsvpQuestion {
  id: string;
  label: string;
  type: RsvpQuestionType;
  /** Options pour `single_choice` / `multi_choice`. */
  options?: string[];
  required?: boolean;
  /** Texte d'aide affiché sous le libellé. */
  help?: string;
  /** Bornes pour le type `number`. */
  min?: number;
  max?: number;
  /** Conditionnel : afficher seulement si la réponse à `questionId` vaut (ou contient) `value`. */
  showIf?: { questionId: string; value: string };
}

/** Réponse générique : chaîne (texte/date/heure/choix unique) ou tableau (multi-choix / plage de dates). */
export type RsvpAnswerValue = string | string[];

/**
 * Formulaire par défaut — parcours créés avant la fonctionnalité (ou sans questions).
 * Reproduit le formulaire historique : nombre de personnes, moments, régime, petit mot.
 */
export const DEFAULT_QUESTIONS: RsvpQuestion[] = [
  { id: 'headcount', label: 'Nombre de personnes', type: 'headcount' },
  { id: 'moments', label: 'À quels moments serez-vous présents ?', type: 'moments' },
  { id: 'dietary', label: 'Régime alimentaire / allergies', type: 'short_text' },
  { id: 'message', label: 'Un petit mot pour les mariés', type: 'long_text' },
];

export interface DetailCard {
  id: string;
  label: string;
  value: string;
  mediaUrl: string | null;
  sortOrder: number;
}

export interface Wedding {
  id: string;
  coupleNames: string;
  eventDate: string | null; // ISO — null => « [ Date à confirmer ] »
  venue: string | null;
  welcomeText: string;
  rsvpDeadline: string | null;
  locales: string[];
  notifyEmails: string[];
  notifyEnabled: boolean;
  siteDomain: string | null;
  coverUrl: string | null;
  heroVideoUrl: string | null;
}

/** Une photo de la galerie d'un moment (`id` = ligne moment_media, pour réordonner/retirer). */
export interface MomentAsset {
  id: string;
  url: string;
  sortOrder: number;
}

export interface Moment {
  id: string;
  title: string;
  startsAt: string | null;
  location: string | null;
  description: string;
  dressCode: string | null;
  mapLat: number | null;
  mapLng: number | null;
  media: MomentAsset[];
  sortOrder: number;
}

export interface Parcours {
  id: string;
  token: string;
  name: string;
  visibleMomentIds: string[];
  rsvpFields: RsvpFields;
  /** Formulaire RSVP dynamique (questions ordonnées). Défaut si le parcours n'en a pas. */
  formQuestions: RsvpQuestion[];
  introOverride: string | null;
  createdAt: string;
}

export interface RsvpResponse {
  id: string;
  parcoursId: string;
  parcoursName: string;
  guestName: string;
  email: string | null;
  attending: Attending;
  headcount: number;
  perMoment: Record<string, boolean>;
  dietary: string | null;
  message: string | null;
  /** Réponses aux questions dynamiques du parcours (clé = id de la question). */
  answers: Record<string, RsvpAnswerValue>;
  locale: string;
  createdAt: string;
}

/** Données pré-remplies quand un invité retrouve sa réponse via son email. */
export interface RsvpPrefill {
  guestName: string;
  email: string;
  attending: Attending;
  headcount: number;
  perMoment: Record<string, boolean>;
  dietary: string;
  message: string;
  answers: Record<string, RsvpAnswerValue>;
}
