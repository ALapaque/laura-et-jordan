import 'server-only';
import { and, asc, desc, eq, sql } from 'drizzle-orm';
import { db } from '@/db';
import { detailCard, media, moment, momentMedia, parcours, rsvpResponse, wedding } from '@/db/schema';
import { demoDetailCards, demoStore, nextDemoId } from '@/db/demo-data';
import type {
  DetailCardRow,
  MomentRow,
  ParcoursRow,
  RsvpResponseRow,
  WeddingRow,
} from '@/db/schema';
import { generateToken } from './tokens';
import {
  DEFAULT_RSVP_FIELDS,
  type Attending,
  type DetailCard,
  type Moment,
  type MomentAsset,
  type Parcours,
  type RsvpFields,
  type RsvpResponse,
  type Wedding,
} from './types';

/** True quand l'app tourne sur des données en mémoire (pas de Postgres). */
export const isDemoMode = db === null;

// ── Mappers rows → vues ──────────────────────────────────────────
/**
 * Convertit une valeur date (Date, string, number…) en ISO 8601, ou `null`.
 * Le driver Postgres peut renvoyer un `Date` invalide (NaN) selon la valeur
 * stockée ; un `?` sur la vérité ne l'attrape pas (un `Date` invalide reste
 * truthy) et `.toISOString()` lève alors `RangeError: Invalid time value`.
 * On teste donc explicitement `getTime()` avant de sérialiser.
 */
function toIso(value: unknown): string | null {
  if (value == null) return null;
  const d = value instanceof Date ? value : new Date(value as string | number);
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
}

function toWedding(row: WeddingRow, coverUrl: string | null, heroVideoUrl: string | null): Wedding {
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

function toMoment(row: MomentRow, media: MomentAsset[]): Moment {
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

function toParcours(row: ParcoursRow): Parcours {
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

function toResponse(row: RsvpResponseRow, parcoursName: string): RsvpResponse {
  return {
    id: row.id,
    parcoursId: row.parcoursId,
    parcoursName,
    guestName: row.guestName,
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
  if (!id || !db) return null;
  const [row] = await db.select({ url: media.url }).from(media).where(eq(media.id, id)).limit(1);
  return row?.url ?? null;
}

// ── Lectures ─────────────────────────────────────────────────────
export async function getWedding(): Promise<Wedding> {
  if (!db) return { ...demoStore().wedding };
  const [row] = await db.select().from(wedding).limit(1);
  if (!row) return { ...demoStore().wedding };
  const [coverUrl, heroVideoUrl] = await Promise.all([
    resolveMediaUrl(row.coverMediaId),
    resolveMediaUrl(row.heroVideoId),
  ]);
  return toWedding(row, coverUrl, heroVideoUrl);
}

export async function getMoments(): Promise<Moment[]> {
  if (!db) {
    return demoStore()
      .moments.map((m) => ({ ...m, media: m.media.map((a) => ({ ...a })) }))
      .sort(bySortOrder);
  }
  const rows = await db
    .select({ moment, coverUrl: media.url })
    .from(moment)
    .leftJoin(media, eq(moment.mediaId, media.id))
    .orderBy(asc(moment.sortOrder));

  // Galeries multi-photos (table `moment_media`). Résilient : si la table n'existe
  // pas encore (script SQL non lancé), on retombe sur la photo unique historique
  // (`moment.media_id`) pour ne rien perdre à l'affichage.
  const galleries = new Map<string, MomentAsset[]>();
  try {
    const assets = await db
      .select({
        id: momentMedia.id,
        momentId: momentMedia.momentId,
        url: media.url,
        sortOrder: momentMedia.sortOrder,
      })
      .from(momentMedia)
      .innerJoin(media, eq(momentMedia.mediaId, media.id))
      .orderBy(asc(momentMedia.sortOrder));
    for (const a of assets) {
      if (!a.url) continue;
      const list = galleries.get(a.momentId) ?? [];
      list.push({ id: a.id, url: a.url, sortOrder: a.sortOrder });
      galleries.set(a.momentId, list);
    }
    return rows.map((r) => toMoment(r.moment, galleries.get(r.moment.id) ?? []));
  } catch {
    // Table `moment_media` absente → repli sur la photo unique existante.
    return rows.map((r) =>
      toMoment(
        r.moment,
        r.coverUrl ? [{ id: `${r.moment.id}-cover`, url: r.coverUrl, sortOrder: 0 }] : [],
      ),
    );
  }
}

export async function getParcoursList(): Promise<Parcours[]> {
  if (!db) return demoStore().parcours.map((p) => ({ ...p }));
  const rows = await db.select().from(parcours).orderBy(asc(parcours.createdAt));
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
  if (!db) {
    return [...demoStore().responses].sort(byRecent);
  }
  const parcoursList = await getParcoursList();
  const nameById = new Map(parcoursList.map((p) => [p.id, p.name]));
  const rows = await db.select().from(rsvpResponse).orderBy(desc(rsvpResponse.createdAt));
  return rows.map((r) => toResponse(r, nameById.get(r.parcoursId) ?? '—'));
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
  if (!db) {
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
  const [w] = await db.select({ id: wedding.id }).from(wedding).limit(1);
  if (!w) throw new Error('Aucun mariage configuré');
  const [row] = await db
    .insert(parcours)
    .values({
      weddingId: w.id,
      token,
      name: input.name,
      visibleMomentIds: input.visibleMomentIds,
      rsvpFields: input.rsvpFields ?? { ...DEFAULT_RSVP_FIELDS },
      introOverride: input.introOverride ?? null,
    })
    .returning();
  return toParcours(row!);
}

export async function deleteParcours(id: string): Promise<void> {
  if (!db) {
    const store = demoStore();
    store.parcours = store.parcours.filter((p) => p.id !== id);
    store.responses = store.responses.filter((r) => r.parcoursId !== id);
    return;
  }
  await db.delete(parcours).where(eq(parcours.id, id));
}

// ── Mutations : RSVP (upsert par parcours + nom) ─────────────────
export interface SaveRsvpInput {
  parcoursId: string;
  guestName: string;
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

  if (!db) {
    const store = demoStore();
    const existing = store.responses.find(
      (r) =>
        r.parcoursId === input.parcoursId &&
        r.guestName.trim().toLowerCase() === input.guestName.trim().toLowerCase(),
    );
    const base: RsvpResponse = {
      id: existing?.id ?? nextDemoId('r'),
      parcoursId: input.parcoursId,
      parcoursName: p.name,
      guestName: input.guestName,
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

  const existing = await db
    .select()
    .from(rsvpResponse)
    .where(
      and(
        eq(rsvpResponse.parcoursId, input.parcoursId),
        sql`lower(${rsvpResponse.guestName}) = lower(${input.guestName})`,
      ),
    )
    .limit(1);

  const values = {
    parcoursId: input.parcoursId,
    guestName: input.guestName,
    attending: input.attending,
    headcount: input.headcount,
    perMoment: input.perMoment,
    dietary: input.dietary,
    message: input.message,
    locale: input.locale,
    ipHash: input.ipHash,
  };

  let row: RsvpResponseRow;
  if (existing[0]) {
    const [updated] = await db
      .update(rsvpResponse)
      .set({ ...values, createdAt: new Date() })
      .where(eq(rsvpResponse.id, existing[0].id))
      .returning();
    row = updated!;
  } else {
    const [inserted] = await db.insert(rsvpResponse).values(values).returning();
    row = inserted!;
  }
  return { response: toResponse(row, p.name), parcours: p };
}

// ── Mutations : contenu & paramètres ─────────────────────────────
export async function updateWeddingContent(input: {
  coupleNames?: string;
  eventDate?: string | null;
  venue?: string | null;
  welcomeText?: string;
}): Promise<void> {
  if (!db) {
    const w = demoStore().wedding;
    if (input.coupleNames !== undefined) w.coupleNames = input.coupleNames;
    if (input.eventDate !== undefined) w.eventDate = input.eventDate;
    if (input.venue !== undefined) w.venue = input.venue;
    if (input.welcomeText !== undefined) w.welcomeText = input.welcomeText;
    return;
  }
  const [w] = await db.select({ id: wedding.id }).from(wedding).limit(1);
  if (!w) return;
  await db
    .update(wedding)
    .set({
      ...(input.coupleNames !== undefined && { coupleNames: input.coupleNames }),
      ...(input.eventDate !== undefined && {
        eventDate: input.eventDate ? new Date(input.eventDate) : null,
      }),
      ...(input.venue !== undefined && { venue: input.venue }),
      ...(input.welcomeText !== undefined && { welcomeText: input.welcomeText }),
      updatedAt: new Date(),
    })
    .where(eq(wedding.id, w.id));
}

export async function updateSettings(input: {
  notifyEmails?: string[];
  notifyEnabled?: boolean;
  rsvpDeadline?: string | null;
  locales?: string[];
  siteDomain?: string | null;
}): Promise<void> {
  if (!db) {
    const w = demoStore().wedding;
    if (input.notifyEmails !== undefined) w.notifyEmails = input.notifyEmails;
    if (input.notifyEnabled !== undefined) w.notifyEnabled = input.notifyEnabled;
    if (input.rsvpDeadline !== undefined) w.rsvpDeadline = input.rsvpDeadline;
    if (input.locales !== undefined) w.locales = input.locales;
    if (input.siteDomain !== undefined) w.siteDomain = input.siteDomain;
    return;
  }
  const [w] = await db.select({ id: wedding.id }).from(wedding).limit(1);
  if (!w) return;
  await db
    .update(wedding)
    .set({
      ...(input.notifyEmails !== undefined && { notifyEmails: input.notifyEmails }),
      ...(input.notifyEnabled !== undefined && { notifyEnabled: input.notifyEnabled }),
      ...(input.rsvpDeadline !== undefined && {
        rsvpDeadline: input.rsvpDeadline ? new Date(input.rsvpDeadline) : null,
      }),
      ...(input.locales !== undefined && { locales: input.locales }),
      ...(input.siteDomain !== undefined && { siteDomain: input.siteDomain }),
      updatedAt: new Date(),
    })
    .where(eq(wedding.id, w.id));
}

// ── Mutations : moments ──────────────────────────────────────────
export async function createMoment(input: { title: string }): Promise<Moment> {
  if (!db) {
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
  const [w] = await db.select({ id: wedding.id }).from(wedding).limit(1);
  if (!w) throw new Error('Aucun mariage configuré');
  const [{ count } = { count: 0 }] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(moment);
  const [row] = await db
    .insert(moment)
    .values({ weddingId: w.id, title: input.title, sortOrder: count })
    .returning();
  return toMoment(row!, []);
}

export async function updateMoment(
  id: string,
  input: Partial<Pick<Moment, 'title' | 'startsAt' | 'location' | 'description' | 'dressCode'>>,
): Promise<void> {
  if (!db) {
    const m = demoStore().moments.find((x) => x.id === id);
    if (m) Object.assign(m, input);
    return;
  }
  await db
    .update(moment)
    .set({
      ...(input.title !== undefined && { title: input.title }),
      ...(input.startsAt !== undefined && {
        startsAt: input.startsAt ? new Date(input.startsAt) : null,
      }),
      ...(input.location !== undefined && { location: input.location }),
      ...(input.description !== undefined && { description: input.description }),
      ...(input.dressCode !== undefined && { dressCode: input.dressCode }),
    })
    .where(eq(moment.id, id));
}

export async function deleteMoment(id: string): Promise<void> {
  if (!db) {
    const store = demoStore();
    store.moments = store.moments.filter((m) => m.id !== id);
    return;
  }
  await db.delete(moment).where(eq(moment.id, id));
}

export async function reorderMoments(orderedIds: string[]): Promise<void> {
  if (!db) {
    const store = demoStore();
    const index = new Map(orderedIds.map((id, i) => [id, i]));
    store.moments.forEach((m) => {
      if (index.has(m.id)) m.sortOrder = index.get(m.id)!;
    });
    store.moments.sort(bySortOrder);
    return;
  }
  const database = db;
  await Promise.all(
    orderedIds.map((id, i) =>
      database.update(moment).set({ sortOrder: i }).where(eq(moment.id, id)),
    ),
  );
}

/** Insère une ligne `media` (image) et renvoie son id. */
async function insertImageMedia(storagePath: string, url: string): Promise<string | null> {
  if (!db) return null;
  const [row] = await db
    .insert(media)
    .values({ kind: 'image', storagePath, url })
    .returning({ id: media.id });
  return row?.id ?? null;
}

/** Ajoute une photo à la galerie d'un moment ; renvoie l'asset créé. */
export async function addMomentAsset(
  momentId: string,
  input: { url: string; storagePath: string },
): Promise<MomentAsset> {
  if (!db) {
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
  const [{ count } = { count: 0 }] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(momentMedia)
    .where(eq(momentMedia.momentId, momentId));
  const [row] = await db
    .insert(momentMedia)
    .values({ momentId, mediaId, sortOrder: count })
    .returning();
  return { id: row!.id, url: input.url, sortOrder: row!.sortOrder };
}

/** Retire une photo de la galerie (id = ligne moment_media). */
export async function removeMomentAsset(assetId: string): Promise<void> {
  if (!db) {
    for (const m of demoStore().moments) {
      m.media = m.media.filter((a) => a.id !== assetId);
    }
    return;
  }
  await db.delete(momentMedia).where(eq(momentMedia.id, assetId));
}

/** Réordonne la galerie d'un moment (liste ordonnée d'ids moment_media). */
export async function reorderMomentAssets(momentId: string, orderedIds: string[]): Promise<void> {
  if (!db) {
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
  const database = db;
  await Promise.all(
    orderedIds.map((id, i) =>
      database.update(momentMedia).set({ sortOrder: i }).where(eq(momentMedia.id, id)),
    ),
  );
}

// ── Cartes « détails pratiques » ─────────────────────────────────
function toDetailCard(row: DetailCardRow, mediaUrl: string | null): DetailCard {
  return { id: row.id, label: row.label, value: row.value, mediaUrl, sortOrder: row.sortOrder };
}

/**
 * Cartes pratiques (lieu, tenue, accès…). Résilient : si la table `detail_card`
 * n'existe pas encore (script SQL non exécuté) ou est vide, renvoie les cartes
 * par défaut (texte seul) pour ne jamais casser le rendu du site.
 */
export async function getDetailCards(): Promise<DetailCard[]> {
  if (!db) return demoStore().detailCards.map((c) => ({ ...c })).sort(bySortOrder);
  try {
    const rows = await db
      .select({ card: detailCard, mediaUrl: media.url })
      .from(detailCard)
      .leftJoin(media, eq(detailCard.mediaId, media.id))
      .orderBy(asc(detailCard.sortOrder));
    if (rows.length === 0) return demoDetailCards.map((c) => ({ ...c }));
    return rows.map((r) => toDetailCard(r.card, r.mediaUrl));
  } catch {
    // Table absente (script 03_detail_cards.sql non exécuté) → repli défensif.
    return demoDetailCards.map((c) => ({ ...c }));
  }
}

export async function createDetailCard(input: {
  label: string;
  value: string;
}): Promise<DetailCard> {
  if (!db) {
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
  const [w] = await db.select({ id: wedding.id }).from(wedding).limit(1);
  if (!w) throw new Error('Aucun mariage configuré');
  const [{ count } = { count: 0 }] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(detailCard);
  const [row] = await db
    .insert(detailCard)
    .values({ weddingId: w.id, label: input.label, value: input.value, sortOrder: count })
    .returning();
  return toDetailCard(row!, null);
}

export async function updateDetailCard(
  id: string,
  input: { label?: string; value?: string },
): Promise<void> {
  if (!db) {
    const c = demoStore().detailCards.find((x) => x.id === id);
    if (c) {
      if (input.label !== undefined) c.label = input.label;
      if (input.value !== undefined) c.value = input.value;
    }
    return;
  }
  await db
    .update(detailCard)
    .set({
      ...(input.label !== undefined && { label: input.label }),
      ...(input.value !== undefined && { value: input.value }),
    })
    .where(eq(detailCard.id, id));
}

export async function setDetailCardImage(
  id: string,
  input: { url: string; storagePath: string } | null,
): Promise<void> {
  if (!db) {
    const c = demoStore().detailCards.find((x) => x.id === id);
    if (c) c.mediaUrl = input?.url ?? null;
    return;
  }
  if (!input) {
    await db.update(detailCard).set({ mediaId: null }).where(eq(detailCard.id, id));
    return;
  }
  const mediaId = await insertImageMedia(input.storagePath, input.url);
  await db.update(detailCard).set({ mediaId }).where(eq(detailCard.id, id));
}

export async function deleteDetailCard(id: string): Promise<void> {
  if (!db) {
    const store = demoStore();
    store.detailCards = store.detailCards.filter((c) => c.id !== id);
    return;
  }
  await db.delete(detailCard).where(eq(detailCard.id, id));
}

// ── Comparateurs ─────────────────────────────────────────────────
function bySortOrder(a: { sortOrder: number }, b: { sortOrder: number }) {
  return a.sortOrder - b.sortOrder;
}
function byRecent(a: RsvpResponse, b: RsvpResponse) {
  return b.createdAt.localeCompare(a.createdAt);
}
