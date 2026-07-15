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

export interface Moment {
  id: string;
  title: string;
  startsAt: string | null;
  location: string | null;
  description: string;
  dressCode: string | null;
  mapLat: number | null;
  mapLng: number | null;
  mediaUrl: string | null;
  sortOrder: number;
}

export interface Parcours {
  id: string;
  token: string;
  name: string;
  visibleMomentIds: string[];
  rsvpFields: RsvpFields;
  introOverride: string | null;
  createdAt: string;
}

export interface RsvpResponse {
  id: string;
  parcoursId: string;
  parcoursName: string;
  guestName: string;
  attending: Attending;
  headcount: number;
  perMoment: Record<string, boolean>;
  dietary: string | null;
  message: string | null;
  locale: string;
  createdAt: string;
}
