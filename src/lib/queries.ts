import 'server-only';
import { createServiceClient } from '@/lib/supabase/server';
import { demoDetailCards, demoStore, nextDemoId } from '@/db/demo-data';
import { generateToken } from './tokens';
import {
  DEFAULT_RSVP_FIELDS,
  type Attending,
  type DetailCard,
  type Moment,
  type MomentAsset,
  type Parcours,
  type RsvpFields,
  type RsvpPrefill,
  type RsvpResponse,
  type Wedding,
} from './types';

/**
 * Accès aux données via l'API HTTP de Supabase (PostgREST), avec la clé
 * service-role — SERVEUR UNIQUEMENT (contourne RLS, comme le rôle `postgres`
 * de Drizzle auparavant ; la clé n'est jamais envoyée au navigateur).
 *
 * Pourquoi HTTP et plus de connexion Postgres TCP : en serverless (Vercel),
 * l'instance est « gelée » entre deux requêtes et le socket TCP vers Supabase
 * meurt → la requête suivante restait pendue (504 / timeout 300 s). Les appels
 * HTTP sont **sans état** : rien à maintenir, rien qui périme → cette classe
 * d'erreurs disparaît. `null` quand Supabase n'est pas configuré → mode démo
 * (données en mémoire), exactement comme avant.
 */
const supa = createServiceClient();

/** True quand l'app tourne sur des données en mémoire (pas de Supabase). */
export const isDemoMode = supa === null;

// ── Helpers PostgREST ────────────────────────────────────────────
/** Lève si la réponse porte une erreur, sinon renvoie les données. */
function ok<T>(res: { data: T | null; error: { message: string } | null }): T {
  if (res.error) throw new Error(res.error.message);
  return res.data as T;
}
/** Idem pour les écritures sans `returning` (update / delete). */
function done(res: { error: { message: string } | null }): void {
  if (res.error) throw new Error(res.error.message);
}
/**
 * Une relation embarquée (`media(url)`) est renvoyée par PostgREST en objet
 * unique pour un lien many-to-one, mais supabase-js la type parfois en tableau.
 * On normalise en prenant le premier élément si c'en est un.
 */
function firstOf<T>(v: T | T[] | null | undefined): T | null {
  if (Array.isArray(v)) return v[0] ?? null;
  return v ?? null;
}

// Colonnes sélectionnées (alias snake_case → camelCase attendu par les vues).
const WEDDING_COLS =
  'id, coupleNames:couple_names, eventDate:event_date, venue, welcomeText:welcome_text, rsvpDeadline:rsvp_deadline, locales, notifyEmails:notify_emails, notifyEnabled:notify_enabled, siteDomain:site_domain, coverMediaId:cover_media_id, heroVideoId:hero_video_id';
const MOMENT_COLS =
  'id, title, startsAt:starts_at, location, description, dressCode:dress_code, mapLat:map_lat, mapLng:map_lng, sortOrder:sort_order, mediaId:media_id';
const PARCOURS_COLS =
  'id, token, name, visibleMomentIds:visible_moment_ids, rsvpFields:rsvp_fields, introOverride:intro_override, createdAt:created_at';
const RSVP_COLS =
  'id, parcoursId:parcours_id, guestName:guest_name, attending, headcount, perMoment:per_moment, dietary, message, locale, createdAt:created_at';
const DETAIL_COLS_BASE = 'id, label, value, sortOrder:sort_order';

type WeddingSel = {
  id: string;
  coupleNames: string;
  eventDate: string | null;
  venue: string | null;
  welcomeText: string;
  rsvpDeadline: string | null;
  locales: string[];
  notifyEmails: string[];
  notifyEnabled: boolean;
  siteDomain: string | null;
  coverMediaId: string | null;
  heroVideoId: string | null;
};
type MomentSel = {
  id: string;
  title: string;
  startsAt: string | null;
  location: string | null;
  description: string;
  dressCode: string | null;
  mapLat: number | null;
  mapLng: number | null;
  sortOrder: number;
  mediaId: string | null;
};
type ParcoursSel = {
  id: string;
  token: string;
  name: string;
  visibleMomentIds: string[];
  rsvpFields: RsvpFields | null;
  introOverride: string | null;
  createdAt: string;
};
type RsvpSel = {
  id: string;
  parcoursId: string;
  guestName: string;
  attending: Attending;
  headcount: number;
  perMoment: Record<string, boolean>;
  dietary: string | null;
  message: string | null;
  locale: string;
  createdAt: string;
};

// ── Mappers rows → vues ──────────────────────────────────────────
/**
 * Convertit une valeur date (string ISO, Date…) en ISO 8601, ou `null`.
 * PostgREST renvoie déjà des chaînes ISO, mais on garde ce garde-fou : une
 * valeur invalide (NaN) reste truthy et `.toISOString()` lèverait alors
 * `RangeError: Invalid time value`.
 */
function toIso(value: unknown): string | null {
  if (value == null) return null;
  const d = value instanceof Date ? value : new Date(value as string | number);
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
}

function toWedding(row: WeddingSel, coverUrl: string | null, heroVideoUrl: string | null): Wedding {
  return {
    id: row.id,
    coupleNames: row.coupleNames,
    eventDate: toIso(row.eventDate),
    venue: row.venue,
    welcomeText: row.welcomeText,
    rsvpDeadline: toIso(row.rsvpDeadline),
    locales: row.locales,
    notifyEmails: row.notifyEmails,
    notifyEnabled: row.notifyEnabled,
    siteDomain: row.siteDomain,
    coverUrl,
    heroVideoUrl,
  };
}

function toMoment(row: MomentSel, media: MomentAsset[]): Moment {
  return {
    id: row.id,
    title: row.title,
    startsAt: toIso(row.startsAt),
    location: row.location,
    description: row.description,
    dressCode: row.dressCode,
    mapLat: row.mapLat,
    mapLng: row.mapLng,
    media,
    sortOrder: row.sortOrder,
  };
}

function toParcours(row: ParcoursSel): Parcours {
  return {
    id: row.id,
    token: row.token,
    name: row.name,
    visibleMomentIds: row.visibleMomentIds,
    rsvpFields: row.rsvpFields ?? { ...DEFAULT_RSVP_FIELDS },
    introOverride: row.introOverride,
    createdAt: toIso(row.createdAt) ?? new Date().toISOString(),
  };
}

function toResponse(row: RsvpSel, parcoursName: string, email: string | null): RsvpResponse {
  return {
    id: row.id,
    parcoursId: row.parcoursId,
    parcoursName,
    guestName: row.guestName,
    email,
    attending: row.attending,
    headcount: row.headcount,
    perMoment: row.perMoment,
    dietary: row.dietary,
    message: row.message,
    locale: row.locale,
    createdAt: toIso(row.createdAt) ?? new Date().toISOString(),
  };
}

async function resolveMediaUrl(id: string | null): Promise<string | null> {
  if (!id || !supa) return null;
  const { data } = await supa.from('media').select('url').eq('id', id).maybeSingle();
  return (data as { url: string | null } | null)?.url ?? null;
}

// ── Lectures ─────────────────────────────────────────────────────
export async function getWedding(): Promise<Wedding> {
  if (!supa) return { ...demoStore().wedding };
  const rows = ok<WeddingSel[]>(await supa.from('wedding').select(WEDDING_COLS).limit(1));
  const row = rows[0];
  if (!row) return { ...demoStore().wedding };
  const [coverUrl, heroVideoUrl] = await Promise.all([
    resolveMediaUrl(row.coverMediaId),
    resolveMediaUrl(row.heroVideoId),
  ]);
  return toWedding(row, coverUrl, heroVideoUrl);
}

export async function getMoments(): Promise<Moment[]> {
  if (!supa) {
    return demoStore()
      .moments.map((m) => ({ ...m, media: m.media.map((a) => ({ ...a })) }))
      .sort(bySortOrder);
  }
  const rows = ok<MomentSel[]>(
    await supa.from('moment').select(MOMENT_COLS).order('sort_order', { ascending: true }),
  );

  // Galeries multi-photos (table `moment_media`). Résilient : si la table n'existe
  // pas encore (script SQL non lancé), on retombe sur la photo unique historique
  // (`moment.media_id`) pour ne rien perdre à l'affichage.
  try {
    type Emb = { url: string | null };
    const res = await supa
      .from('moment_media')
      .select('id, momentId:moment_id, sortOrder:sort_order, media(url)')
      .order('sort_order', { ascending: true });
    if (res.error) throw new Error(res.error.message);
    const assets = (res.data ?? []) as unknown as Array<{
      id: string;
      momentId: string;
      sortOrder: number;
      media: Emb | Emb[] | null;
    }>;
    const galleries = new Map<string, MomentAsset[]>();
    for (const a of assets) {
      const url = firstOf(a.media)?.url;
      if (!url) continue;
      const list = galleries.get(a.momentId) ?? [];
      list.push({ id: a.id, url, sortOrder: a.sortOrder });
      galleries.set(a.momentId, list);
    }
    return rows.map((r) => toMoment(r, galleries.get(r.id) ?? []));
  } catch {
    // Table `moment_media` absente → repli sur la photo unique existante.
    const covers = await Promise.all(rows.map((r) => resolveMediaUrl(r.mediaId)));
    return rows.map((r, i) =>
      toMoment(r, covers[i] ? [{ id: `${r.id}-cover`, url: covers[i]!, sortOrder: 0 }] : []),
    );
  }
}

export async function getParcoursList(): Promise<Parcours[]> {
  if (!supa) return demoStore().parcours.map((p) => ({ ...p }));
  const rows = ok<ParcoursSel[]>(
    await supa.from('parcours').select(PARCOURS_COLS).order('created_at', { ascending: true }),
  );
  return rows.map(toParcours);
}

export interface Invitation {
  wedding: Wedding;
  parcours: Parcours;
  moments: Moment[]; // visibles, ordonnés
}

/** Résout un token opaque en son invitation (moments visibles filtrés). */
export async function getInvitationByToken(token: string): Promise<Invitation | null> {
  const [w, allMoments, parcoursList] = await Promise.all([
    getWedding(),
    getMoments(),
    getParcoursList(),
  ]);
  const p = parcoursList.find((x) => x.token === token);
  if (!p) return null;
  const order = new Map(allMoments.map((m, i) => [m.id, i]));
  const moments = allMoments
    .filter((m) => p.visibleMomentIds.includes(m.id))
    .sort((a, b) => (order.get(a.id) ?? 0) - (order.get(b.id) ?? 0));
  return { wedding: w, parcours: p, moments };
}

export async function getResponses(): Promise<RsvpResponse[]> {
  if (!supa) {
    return [...demoStore().responses].sort(byRecent);
  }
  const parcoursList = await getParcoursList();
  const nameById = new Map(parcoursList.map((p) => [p.id, p.name]));
  const rows = ok<RsvpSel[]>(
    await supa.from('rsvp_response').select(RSVP_COLS).order('created_at', { ascending: false }),
  );
  const emailById = await loadEmailMap();
  return rows.map((r) =>
    toResponse(r, nameById.get(r.parcoursId) ?? '—', emailById.get(r.id) ?? null),
  );
}

/**
 * L'email est une colonne *additive* (`rsvp_response.email`, script 05).
 * Pour ne JAMAIS casser les lectures si le script n'est pas encore lancé, on
 * la lit à part, en tolérant l'erreur « colonne inexistante ».
 */
async function loadEmailMap(): Promise<Map<string, string | null>> {
  const map = new Map<string, string | null>();
  if (!supa) return map;
  const { data, error } = await supa.from('rsvp_response').select('id, email');
  if (error) return map; // colonne `email` absente → aucun email
  for (const r of (data ?? []) as Array<{ id: string; email: string | null }>) {
    map.set(r.id, r.email ?? null);
  }
  return map;
}

// ── Statistiques dashboard ───────────────────────────────────────
export interface DashboardStats {
  present: number;
  absent: number;
  maybe: number;
  total: number;
  perParcours: { id: string; name: string; count: number }[];
  recent: RsvpResponse[];
}

export async function getStats(): Promise<DashboardStats> {
  const [responses, parcoursList] = await Promise.all([getResponses(), getParcoursList()]);
  const present = responses
    .filter((r) => r.attending === 'yes')
    .reduce((a, r) => a + r.headcount, 0);
  const absent = responses.filter((r) => r.attending === 'no').length;
  const maybe = responses.filter((r) => r.attending === 'maybe').length;
  const perParcours = parcoursList.map((p) => ({
    id: p.id,
    name: p.name,
    count: responses.filter((r) => r.parcoursId === p.id).length,
  }));
  return {
    present,
    absent,
    maybe,
    total: responses.length,
    perParcours,
    recent: responses.slice(0, 5),
  };
}

// ── Mutations : parcours ─────────────────────────────────────────
export async function createParcours(input: {
  name: string;
  visibleMomentIds: string[];
  rsvpFields?: RsvpFields;
  introOverride?: string | null;
}): Promise<Parcours> {
  const token = generateToken(10);
  if (!supa) {
    const store = demoStore();
    const p: Parcours = {
      id: nextDemoId('p'),
      token,
      name: input.name,
      visibleMomentIds: input.visibleMomentIds,
      rsvpFields: input.rsvpFields ?? { ...DEFAULT_RSVP_FIELDS },
      introOverride: input.introOverride ?? null,
      createdAt: new Date().toISOString(),
    };
    store.parcours.push(p);
    return p;
  }
  const w = ok<Array<{ id: string }>>(await supa.from('wedding').select('id').limit(1))[0];
  if (!w) throw new Error('Aucun mariage configuré');
  const row = ok<ParcoursSel>(
    await supa
      .from('parcours')
      .insert({
        wedding_id: w.id,
        token,
        name: input.name,
        visible_moment_ids: input.visibleMomentIds,
        rsvp_fields: input.rsvpFields ?? { ...DEFAULT_RSVP_FIELDS },
        intro_override: input.introOverride ?? null,
      })
      .select(PARCOURS_COLS)
      .single(),
  );
  return toParcours(row);
}

export async function deleteParcours(id: string): Promise<void> {
  if (!supa) {
    const store = demoStore();
    store.parcours = store.parcours.filter((p) => p.id !== id);
    store.responses = store.responses.filter((r) => r.parcoursId !== id);
    return;
  }
  done(await supa.from('parcours').delete().eq('id', id));
}

// ── Mutations : RSVP (upsert par parcours + email, repli sur le nom) ──
export interface SaveRsvpInput {
  parcoursId: string;
  guestName: string;
  email: string | null;
  attending: Attending;
  headcount: number;
  perMoment: Record<string, boolean>;
  dietary: string | null;
  message: string | null;
  locale: string;
  ipHash: string | null;
}

export async function saveRsvp(
  input: SaveRsvpInput,
): Promise<{ response: RsvpResponse; parcours: Parcours }> {
  const parcoursList = await getParcoursList();
  const p = parcoursList.find((x) => x.id === input.parcoursId);
  if (!p) throw new Error('Parcours introuvable');
  const email = input.email?.trim() || null;
  const emailLc = email?.toLowerCase();

  if (!supa) {
    const store = demoStore();
    const existing = store.responses.find(
      (r) =>
        r.parcoursId === input.parcoursId &&
        (emailLc
          ? r.email?.trim().toLowerCase() === emailLc
          : r.guestName.trim().toLowerCase() === input.guestName.trim().toLowerCase()),
    );
    const base: RsvpResponse = {
      id: existing?.id ?? nextDemoId('r'),
      parcoursId: input.parcoursId,
      parcoursName: p.name,
      guestName: input.guestName,
      email,
      attending: input.attending,
      headcount: input.headcount,
      perMoment: input.perMoment,
      dietary: input.dietary,
      message: input.message,
      locale: input.locale,
      createdAt: new Date().toISOString(),
    };
    if (existing) Object.assign(existing, base);
    else store.responses.unshift(base);
    return { response: base, parcours: p };
  }

  // Réponse existante : par email d'abord (identifiant fiable), sinon par nom.
  // On récupère les réponses du parcours et on matche côté JS (insensible à la
  // casse), en tolérant l'absence de la colonne `email` (script 05 non lancé).
  let existingId: string | null = null;
  const withEmail = await supa
    .from('rsvp_response')
    .select('id, guestName:guest_name, email')
    .eq('parcours_id', input.parcoursId)
    .order('created_at', { ascending: false });
  let matchRows: Array<{ id: string; guestName: string; email: string | null }>;
  if (withEmail.error) {
    const noEmail = ok<Array<{ id: string; guestName: string }>>(
      await supa
        .from('rsvp_response')
        .select('id, guestName:guest_name')
        .eq('parcours_id', input.parcoursId)
        .order('created_at', { ascending: false }),
    );
    matchRows = noEmail.map((r) => ({ ...r, email: null }));
  } else {
    matchRows = (withEmail.data ?? []) as Array<{ id: string; guestName: string; email: string | null }>;
  }
  if (emailLc) {
    existingId = matchRows.find((r) => r.email?.trim().toLowerCase() === emailLc)?.id ?? null;
  }
  if (!existingId) {
    const nameLc = input.guestName.trim().toLowerCase();
    existingId = matchRows.find((r) => r.guestName.trim().toLowerCase() === nameLc)?.id ?? null;
  }

  const values = {
    parcours_id: input.parcoursId,
    guest_name: input.guestName,
    attending: input.attending,
    headcount: input.headcount,
    per_moment: input.perMoment,
    dietary: input.dietary,
    message: input.message,
    locale: input.locale,
    ip_hash: input.ipHash,
  };

  let row: RsvpSel;
  if (existingId) {
    // `created_at` remis à maintenant → « récent » reflète la dernière modification.
    row = ok<RsvpSel>(
      await supa
        .from('rsvp_response')
        .update({ ...values, created_at: new Date().toISOString() })
        .eq('id', existingId)
        .select(RSVP_COLS)
        .single(),
    );
  } else {
    row = ok<RsvpSel>(await supa.from('rsvp_response').insert(values).select(RSVP_COLS).single());
  }
  // Email : colonne additive, écrite en best-effort (ignorée si absente — le
  // reste de la réponse est déjà enregistré).
  if (email) {
    try {
      await supa.from('rsvp_response').update({ email }).eq('id', row.id);
    } catch {
      // ignoré
    }
  }
  return { response: toResponse(row, p.name, email), parcours: p };
}

/**
 * Retrouve la réponse d'un invité par son email (pour pré-remplir la modification).
 * Résilient : renvoie `null` si la colonne `email` n'existe pas encore.
 */
export async function getGuestResponse(
  parcoursId: string,
  email: string,
): Promise<RsvpPrefill | null> {
  const emailLc = email.trim().toLowerCase();
  if (!emailLc) return null;
  if (!supa) {
    const r = demoStore().responses.find(
      (x) => x.parcoursId === parcoursId && x.email?.trim().toLowerCase() === emailLc,
    );
    if (!r) return null;
    return {
      guestName: r.guestName,
      email: r.email ?? '',
      attending: r.attending,
      headcount: r.headcount,
      perMoment: { ...r.perMoment },
      dietary: r.dietary ?? '',
      message: r.message ?? '',
    };
  }
  const { data, error } = await supa
    .from('rsvp_response')
    .select('guestName:guest_name, email, attending, headcount, perMoment:per_moment, dietary, message')
    .eq('parcours_id', parcoursId)
    .order('created_at', { ascending: false });
  if (error) return null; // colonne `email` absente ou autre → pas de pré-remplissage
  const rows = (data ?? []) as Array<{
    guestName: string;
    email: string | null;
    attending: Attending;
    headcount: number;
    perMoment: Record<string, boolean> | null;
    dietary: string | null;
    message: string | null;
  }>;
  const r = rows.find((x) => x.email?.trim().toLowerCase() === emailLc);
  if (!r) return null;
  return {
    guestName: r.guestName,
    email: r.email ?? '',
    attending: r.attending,
    headcount: r.headcount,
    perMoment: r.perMoment ?? {},
    dietary: r.dietary ?? '',
    message: r.message ?? '',
  };
}

/** Édition d'une réponse RSVP par le couple (dashboard). */
export async function updateResponse(
  id: string,
  patch: {
    guestName?: string;
    attending?: Attending;
    headcount?: number;
    perMoment?: Record<string, boolean>;
    dietary?: string | null;
    message?: string | null;
  },
): Promise<void> {
  if (!supa) {
    const r = demoStore().responses.find((x) => x.id === id);
    if (r) {
      if (patch.guestName !== undefined) r.guestName = patch.guestName;
      if (patch.attending !== undefined) r.attending = patch.attending;
      if (patch.headcount !== undefined) r.headcount = patch.headcount;
      if (patch.perMoment !== undefined) r.perMoment = patch.perMoment;
      if (patch.dietary !== undefined) r.dietary = patch.dietary;
      if (patch.message !== undefined) r.message = patch.message;
    }
    return;
  }
  const set: Record<string, unknown> = {};
  if (patch.guestName !== undefined) set.guest_name = patch.guestName;
  if (patch.attending !== undefined) set.attending = patch.attending;
  if (patch.headcount !== undefined) set.headcount = patch.headcount;
  if (patch.perMoment !== undefined) set.per_moment = patch.perMoment;
  if (patch.dietary !== undefined) set.dietary = patch.dietary;
  if (patch.message !== undefined) set.message = patch.message;
  if (Object.keys(set).length === 0) return;
  done(await supa.from('rsvp_response').update(set).eq('id', id));
}

export async function deleteResponse(id: string): Promise<void> {
  if (!supa) {
    const store = demoStore();
    store.responses = store.responses.filter((r) => r.id !== id);
    return;
  }
  done(await supa.from('rsvp_response').delete().eq('id', id));
}

// ── Mutations : contenu & paramètres ─────────────────────────────
export async function updateWeddingContent(input: {
  coupleNames?: string;
  eventDate?: string | null;
  venue?: string | null;
  welcomeText?: string;
}): Promise<void> {
  if (!supa) {
    const w = demoStore().wedding;
    if (input.coupleNames !== undefined) w.coupleNames = input.coupleNames;
    if (input.eventDate !== undefined) w.eventDate = input.eventDate;
    if (input.venue !== undefined) w.venue = input.venue;
    if (input.welcomeText !== undefined) w.welcomeText = input.welcomeText;
    return;
  }
  const w = ok<Array<{ id: string }>>(await supa.from('wedding').select('id').limit(1))[0];
  if (!w) return;
  const set: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (input.coupleNames !== undefined) set.couple_names = input.coupleNames;
  if (input.eventDate !== undefined)
    set.event_date = input.eventDate ? new Date(input.eventDate).toISOString() : null;
  if (input.venue !== undefined) set.venue = input.venue;
  if (input.welcomeText !== undefined) set.welcome_text = input.welcomeText;
  done(await supa.from('wedding').update(set).eq('id', w.id));
}

export async function updateSettings(input: {
  notifyEmails?: string[];
  notifyEnabled?: boolean;
  rsvpDeadline?: string | null;
  locales?: string[];
  siteDomain?: string | null;
}): Promise<void> {
  if (!supa) {
    const w = demoStore().wedding;
    if (input.notifyEmails !== undefined) w.notifyEmails = input.notifyEmails;
    if (input.notifyEnabled !== undefined) w.notifyEnabled = input.notifyEnabled;
    if (input.rsvpDeadline !== undefined) w.rsvpDeadline = input.rsvpDeadline;
    if (input.locales !== undefined) w.locales = input.locales;
    if (input.siteDomain !== undefined) w.siteDomain = input.siteDomain;
    return;
  }
  const w = ok<Array<{ id: string }>>(await supa.from('wedding').select('id').limit(1))[0];
  if (!w) return;
  const set: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (input.notifyEmails !== undefined) set.notify_emails = input.notifyEmails;
  if (input.notifyEnabled !== undefined) set.notify_enabled = input.notifyEnabled;
  if (input.rsvpDeadline !== undefined)
    set.rsvp_deadline = input.rsvpDeadline ? new Date(input.rsvpDeadline).toISOString() : null;
  if (input.locales !== undefined) set.locales = input.locales;
  if (input.siteDomain !== undefined) set.site_domain = input.siteDomain;
  done(await supa.from('wedding').update(set).eq('id', w.id));
}

// ── Mutations : moments ──────────────────────────────────────────
export async function createMoment(input: { title: string }): Promise<Moment> {
  if (!supa) {
    const store = demoStore();
    const m: Moment = {
      id: nextDemoId('m'),
      title: input.title,
      startsAt: null,
      location: null,
      description: '',
      dressCode: null,
      mapLat: null,
      mapLng: null,
      media: [],
      sortOrder: store.moments.length,
    };
    store.moments.push(m);
    return m;
  }
  const w = ok<Array<{ id: string }>>(await supa.from('wedding').select('id').limit(1))[0];
  if (!w) throw new Error('Aucun mariage configuré');
  const { count } = await supa.from('moment').select('*', { count: 'exact', head: true });
  const row = ok<MomentSel>(
    await supa
      .from('moment')
      .insert({ wedding_id: w.id, title: input.title, sort_order: count ?? 0 })
      .select(MOMENT_COLS)
      .single(),
  );
  return toMoment(row, []);
}

export async function updateMoment(
  id: string,
  input: Partial<Pick<Moment, 'title' | 'startsAt' | 'location' | 'description' | 'dressCode'>>,
): Promise<void> {
  if (!supa) {
    const m = demoStore().moments.find((x) => x.id === id);
    if (m) Object.assign(m, input);
    return;
  }
  const set: Record<string, unknown> = {};
  if (input.title !== undefined) set.title = input.title;
  if (input.startsAt !== undefined)
    set.starts_at = input.startsAt ? new Date(input.startsAt).toISOString() : null;
  if (input.location !== undefined) set.location = input.location;
  if (input.description !== undefined) set.description = input.description;
  if (input.dressCode !== undefined) set.dress_code = input.dressCode;
  if (Object.keys(set).length === 0) return;
  done(await supa.from('moment').update(set).eq('id', id));
}

export async function deleteMoment(id: string): Promise<void> {
  if (!supa) {
    const store = demoStore();
    store.moments = store.moments.filter((m) => m.id !== id);
    return;
  }
  done(await supa.from('moment').delete().eq('id', id));
}

export async function reorderMoments(orderedIds: string[]): Promise<void> {
  if (!supa) {
    const store = demoStore();
    const index = new Map(orderedIds.map((id, i) => [id, i]));
    store.moments.forEach((m) => {
      if (index.has(m.id)) m.sortOrder = index.get(m.id)!;
    });
    store.moments.sort(bySortOrder);
    return;
  }
  const client = supa;
  await Promise.all(
    orderedIds.map((id, i) => client.from('moment').update({ sort_order: i }).eq('id', id)),
  );
}

/** Insère une ligne `media` (image) et renvoie son id. */
async function insertImageMedia(storagePath: string, url: string): Promise<string | null> {
  if (!supa) return null;
  const row = ok<{ id: string }>(
    await supa
      .from('media')
      .insert({ kind: 'image', storage_path: storagePath, url })
      .select('id')
      .single(),
  );
  return row?.id ?? null;
}

/** Ajoute une photo à la galerie d'un moment ; renvoie l'asset créé. */
export async function addMomentAsset(
  momentId: string,
  input: { url: string; storagePath: string },
): Promise<MomentAsset> {
  if (!supa) {
    const m = demoStore().moments.find((x) => x.id === momentId);
    const asset: MomentAsset = {
      id: nextDemoId('ma'),
      url: input.url,
      sortOrder: m ? m.media.length : 0,
    };
    m?.media.push(asset);
    return asset;
  }
  const mediaId = await insertImageMedia(input.storagePath, input.url);
  if (!mediaId) throw new Error('Média non créé');
  const { count } = await supa
    .from('moment_media')
    .select('*', { count: 'exact', head: true })
    .eq('moment_id', momentId);
  const row = ok<{ id: string; sortOrder: number }>(
    await supa
      .from('moment_media')
      .insert({ moment_id: momentId, media_id: mediaId, sort_order: count ?? 0 })
      .select('id, sortOrder:sort_order')
      .single(),
  );
  return { id: row.id, url: input.url, sortOrder: row.sortOrder };
}

/** Retire une photo de la galerie (id = ligne moment_media). */
export async function removeMomentAsset(assetId: string): Promise<void> {
  if (!supa) {
    for (const m of demoStore().moments) {
      m.media = m.media.filter((a) => a.id !== assetId);
    }
    return;
  }
  done(await supa.from('moment_media').delete().eq('id', assetId));
}

/** Réordonne la galerie d'un moment (liste ordonnée d'ids moment_media). */
export async function reorderMomentAssets(momentId: string, orderedIds: string[]): Promise<void> {
  if (!supa) {
    const m = demoStore().moments.find((x) => x.id === momentId);
    if (m) {
      const index = new Map(orderedIds.map((id, i) => [id, i]));
      m.media.forEach((a) => {
        if (index.has(a.id)) a.sortOrder = index.get(a.id)!;
      });
      m.media.sort((a, b) => a.sortOrder - b.sortOrder);
    }
    return;
  }
  const client = supa;
  await Promise.all(
    orderedIds.map((id, i) => client.from('moment_media').update({ sort_order: i }).eq('id', id)),
  );
}

// ── Cartes « détails pratiques » ─────────────────────────────────
function toDetailCard(
  row: { id: string; label: string; value: string; sortOrder: number },
  mediaUrl: string | null,
): DetailCard {
  return { id: row.id, label: row.label, value: row.value, mediaUrl, sortOrder: row.sortOrder };
}

/**
 * Cartes pratiques (lieu, tenue, accès…). Résilient : si la table `detail_card`
 * n'existe pas encore (script SQL non exécuté) ou est vide, renvoie les cartes
 * par défaut (texte seul) pour ne jamais casser le rendu du site.
 */
export async function getDetailCards(): Promise<DetailCard[]> {
  if (!supa) return demoStore().detailCards.map((c) => ({ ...c })).sort(bySortOrder);
  try {
    type Emb = { url: string | null };
    const res = await supa
      .from('detail_card')
      .select('id, label, value, sortOrder:sort_order, media(url)')
      .order('sort_order', { ascending: true });
    if (res.error) throw new Error(res.error.message);
    const rows = (res.data ?? []) as unknown as Array<{
      id: string;
      label: string;
      value: string;
      sortOrder: number;
      media: Emb | Emb[] | null;
    }>;
    if (rows.length === 0) return demoDetailCards.map((c) => ({ ...c }));
    return rows.map((r) => toDetailCard(r, firstOf(r.media)?.url ?? null));
  } catch {
    // Table absente (script 03_detail_cards.sql non exécuté) → repli défensif.
    return demoDetailCards.map((c) => ({ ...c }));
  }
}

export async function createDetailCard(input: {
  label: string;
  value: string;
}): Promise<DetailCard> {
  if (!supa) {
    const store = demoStore();
    const c: DetailCard = {
      id: nextDemoId('d'),
      label: input.label,
      value: input.value,
      mediaUrl: null,
      sortOrder: store.detailCards.length,
    };
    store.detailCards.push(c);
    return c;
  }
  const w = ok<Array<{ id: string }>>(await supa.from('wedding').select('id').limit(1))[0];
  if (!w) throw new Error('Aucun mariage configuré');
  const { count } = await supa.from('detail_card').select('*', { count: 'exact', head: true });
  const row = ok<{ id: string; label: string; value: string; sortOrder: number }>(
    await supa
      .from('detail_card')
      .insert({ wedding_id: w.id, label: input.label, value: input.value, sort_order: count ?? 0 })
      .select(DETAIL_COLS_BASE)
      .single(),
  );
  return toDetailCard(row, null);
}

export async function updateDetailCard(
  id: string,
  input: { label?: string; value?: string },
): Promise<void> {
  if (!supa) {
    const c = demoStore().detailCards.find((x) => x.id === id);
    if (c) {
      if (input.label !== undefined) c.label = input.label;
      if (input.value !== undefined) c.value = input.value;
    }
    return;
  }
  const set: Record<string, unknown> = {};
  if (input.label !== undefined) set.label = input.label;
  if (input.value !== undefined) set.value = input.value;
  if (Object.keys(set).length === 0) return;
  done(await supa.from('detail_card').update(set).eq('id', id));
}

export async function setDetailCardImage(
  id: string,
  input: { url: string; storagePath: string } | null,
): Promise<void> {
  if (!supa) {
    const c = demoStore().detailCards.find((x) => x.id === id);
    if (c) c.mediaUrl = input?.url ?? null;
    return;
  }
  if (!input) {
    done(await supa.from('detail_card').update({ media_id: null }).eq('id', id));
    return;
  }
  const mediaId = await insertImageMedia(input.storagePath, input.url);
  done(await supa.from('detail_card').update({ media_id: mediaId }).eq('id', id));
}

export async function deleteDetailCard(id: string): Promise<void> {
  if (!supa) {
    const store = demoStore();
    store.detailCards = store.detailCards.filter((c) => c.id !== id);
    return;
  }
  done(await supa.from('detail_card').delete().eq('id', id));
}

// ── Comparateurs ─────────────────────────────────────────────────
function bySortOrder(a: { sortOrder: number }, b: { sortOrder: number }) {
  return a.sortOrder - b.sortOrder;
}
function byRecent(a: RsvpResponse, b: RsvpResponse) {
  return b.createdAt.localeCompare(a.createdAt);
}
