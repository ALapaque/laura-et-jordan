import type { Moment, Wedding } from './types';

const fr = (opts: Intl.DateTimeFormatOptions) => new Intl.DateTimeFormat('fr-FR', opts);

/** Heure d'un moment, ou placeholder « [ Heure ] ». */
export function momentTime(m: Pick<Moment, 'startsAt'>): string {
  if (!m.startsAt) return '[ Heure ]';
  return fr({ hour: '2-digit', minute: '2-digit' }).format(new Date(m.startsAt));
}

/** Lieu d'un moment, ou placeholder « [ Lieu ] ». */
export function momentLocation(m: Pick<Moment, 'location'>): string {
  return m.location && m.location.trim() ? m.location : '[ Lieu ]';
}

/** Date du hero, ou placeholder « [ Date à confirmer ] ». */
export function heroDate(w: Pick<Wedding, 'eventDate'>): string {
  if (!w.eventDate) return '[ Date à confirmer ]';
  return fr({ weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }).format(
    new Date(w.eventDate),
  );
}

/** Compte à rebours en jours (null si pas de date → masqué). */
export function daysUntil(iso: string | null): number | null {
  if (!iso) return null;
  const target = new Date(iso).getTime();
  const diff = target - Date.now();
  if (diff <= 0) return null;
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

export function shortDate(iso: string): string {
  return fr({ day: 'numeric', month: 'short' }).format(new Date(iso));
}

export function formatDeadline(iso: string | null): string {
  if (!iso) return '[ À définir ]';
  return fr({ day: 'numeric', month: 'long', year: 'numeric' }).format(new Date(iso));
}
