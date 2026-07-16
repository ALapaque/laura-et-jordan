import { sql } from 'drizzle-orm';
import {
  boolean,
  doublePrecision,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
} from 'drizzle-orm/pg-core';
import type { RsvpFields } from '@/lib/types';

/**
 * Tables applicatives (schéma `public`), gérées par Drizzle.
 * Les utilisateurs d'auth vivent dans le schéma `auth` géré par Supabase :
 * pas de table `admin_user` ici.
 */

export const attendingEnum = pgEnum('attending', ['yes', 'no', 'maybe']);
export const mediaKindEnum = pgEnum('media_kind', ['image', 'video']);

export const media = pgTable('media', {
  id: uuid('id').primaryKey().defaultRandom(),
  kind: mediaKindEnum('kind').notNull().default('image'),
  storagePath: text('storage_path').notNull(),
  url: text('url'),
  width: integer('width'),
  height: integer('height'),
  alt: text('alt'),
});

export const wedding = pgTable('wedding', {
  id: uuid('id').primaryKey().defaultRandom(),
  coupleNames: text('couple_names').notNull().default('Laura & Jordan'),
  eventDate: timestamp('event_date', { withTimezone: true }),
  venue: text('venue'),
  coverMediaId: uuid('cover_media_id').references(() => media.id, { onDelete: 'set null' }),
  heroVideoId: uuid('hero_video_id').references(() => media.id, { onDelete: 'set null' }),
  welcomeText: text('welcome_text').notNull().default(''),
  rsvpDeadline: timestamp('rsvp_deadline', { withTimezone: true }),
  theme: jsonb('theme').$type<Record<string, unknown>>().notNull().default({}),
  locales: text('locales')
    .array()
    .notNull()
    .default(sql`'{fr}'`),
  // Paramètres (spec §4.4)
  notifyEmails: text('notify_emails')
    .array()
    .notNull()
    .default(sql`'{}'`),
  notifyEnabled: boolean('notify_enabled').notNull().default(true),
  siteDomain: text('site_domain'),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

export const moment = pgTable('moment', {
  id: uuid('id').primaryKey().defaultRandom(),
  weddingId: uuid('wedding_id')
    .notNull()
    .references(() => wedding.id, { onDelete: 'cascade' }),
  title: text('title').notNull(),
  startsAt: timestamp('starts_at', { withTimezone: true }),
  location: text('location'),
  mapLat: doublePrecision('map_lat'),
  mapLng: doublePrecision('map_lng'),
  description: text('description').notNull().default(''),
  mediaId: uuid('media_id').references(() => media.id, { onDelete: 'set null' }),
  dressCode: text('dress_code'),
  sortOrder: integer('sort_order').notNull().default(0),
});

export const momentMedia = pgTable('moment_media', {
  id: uuid('id').primaryKey().defaultRandom(),
  momentId: uuid('moment_id')
    .notNull()
    .references(() => moment.id, { onDelete: 'cascade' }),
  mediaId: uuid('media_id')
    .notNull()
    .references(() => media.id, { onDelete: 'cascade' }),
  sortOrder: integer('sort_order').notNull().default(0),
});

export const galleryPhoto = pgTable('gallery_photo', {
  id: uuid('id').primaryKey().defaultRandom(),
  weddingId: uuid('wedding_id')
    .notNull()
    .references(() => wedding.id, { onDelete: 'cascade' }),
  mediaId: uuid('media_id')
    .notNull()
    .references(() => media.id, { onDelete: 'cascade' }),
  sortOrder: integer('sort_order').notNull().default(0),
});

export const detailCard = pgTable('detail_card', {
  id: uuid('id').primaryKey().defaultRandom(),
  weddingId: uuid('wedding_id')
    .notNull()
    .references(() => wedding.id, { onDelete: 'cascade' }),
  label: text('label').notNull().default(''),
  value: text('value').notNull().default(''),
  mediaId: uuid('media_id').references(() => media.id, { onDelete: 'set null' }),
  sortOrder: integer('sort_order').notNull().default(0),
});

export const parcours = pgTable('parcours', {
  id: uuid('id').primaryKey().defaultRandom(),
  weddingId: uuid('wedding_id')
    .notNull()
    .references(() => wedding.id, { onDelete: 'cascade' }),
  token: text('token').notNull().unique(),
  name: text('name').notNull(),
  visibleMomentIds: uuid('visible_moment_ids')
    .array()
    .notNull()
    .default(sql`'{}'`),
  rsvpFields: jsonb('rsvp_fields').$type<RsvpFields>(),
  introOverride: text('intro_override'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

export const rsvpResponse = pgTable('rsvp_response', {
  id: uuid('id').primaryKey().defaultRandom(),
  parcoursId: uuid('parcours_id')
    .notNull()
    .references(() => parcours.id, { onDelete: 'cascade' }),
  guestName: text('guest_name').notNull(),
  attending: attendingEnum('attending').notNull(),
  headcount: integer('headcount').notNull().default(1),
  perMoment: jsonb('per_moment').$type<Record<string, boolean>>().notNull().default({}),
  dietary: text('dietary'),
  message: text('message'),
  locale: text('locale').notNull().default('fr'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  ipHash: text('ip_hash'),
});

export type WeddingRow = typeof wedding.$inferSelect;
export type MomentRow = typeof moment.$inferSelect;
export type MomentMediaRow = typeof momentMedia.$inferSelect;
export type GalleryPhotoRow = typeof galleryPhoto.$inferSelect;
export type DetailCardRow = typeof detailCard.$inferSelect;
export type ParcoursRow = typeof parcours.$inferSelect;
export type RsvpResponseRow = typeof rsvpResponse.$inferSelect;
export type MediaRow = typeof media.$inferSelect;
