-- ============================================================
--  Laura & Jordan — schéma de base de données
--  Supabase → SQL Editor → coller ce fichier → RUN.
--  (à exécuter une seule fois, avant 02_seed.sql)
-- ============================================================

create extension if not exists pgcrypto;

-- ── Types énumérés ──────────────────────────────────────────
do $$ begin
  create type attending as enum ('yes', 'no', 'maybe');
exception when duplicate_object then null; end $$;

do $$ begin
  create type media_kind as enum ('image', 'video');
exception when duplicate_object then null; end $$;

-- ── Tables ──────────────────────────────────────────────────
create table if not exists media (
  id            uuid primary key default gen_random_uuid(),
  kind          media_kind not null default 'image',
  storage_path  text not null,
  url           text,
  width         integer,
  height        integer,
  alt           text
);

create table if not exists wedding (
  id             uuid primary key default gen_random_uuid(),
  couple_names   text not null default 'Laura & Jordan',
  event_date     timestamptz,
  venue          text,
  cover_media_id uuid references media(id) on delete set null,
  hero_video_id  uuid references media(id) on delete set null,
  music_url      text,
  welcome_text   text not null default '',
  rsvp_deadline  timestamptz,
  theme          jsonb not null default '{}'::jsonb,
  locales        text[] not null default '{fr}',
  notify_emails  text[] not null default '{}',
  notify_enabled boolean not null default true,
  site_domain    text,
  updated_at     timestamptz not null default now()
);

create table if not exists moment (
  id          uuid primary key default gen_random_uuid(),
  wedding_id  uuid not null references wedding(id) on delete cascade,
  title       text not null,
  starts_at   timestamptz,
  location    text,
  map_lat     double precision,
  map_lng     double precision,
  description text not null default '',
  media_id    uuid references media(id) on delete set null,
  dress_code  text,
  sort_order  integer not null default 0
);
create index if not exists moment_wedding_id_idx on moment (wedding_id);

create table if not exists parcours (
  id                 uuid primary key default gen_random_uuid(),
  wedding_id         uuid not null references wedding(id) on delete cascade,
  token              text not null unique,
  name               text not null,
  visible_moment_ids uuid[] not null default '{}',
  rsvp_fields        jsonb,
  intro_override     text,
  created_at         timestamptz not null default now()
);

create table if not exists rsvp_response (
  id          uuid primary key default gen_random_uuid(),
  parcours_id uuid not null references parcours(id) on delete cascade,
  guest_name  text not null,
  attending   attending not null,
  headcount   integer not null default 1,
  per_moment  jsonb not null default '{}'::jsonb,
  dietary     text,
  message     text,
  locale      text not null default 'fr',
  created_at  timestamptz not null default now(),
  ip_hash     text
);
create index if not exists rsvp_response_parcours_id_idx on rsvp_response (parcours_id);

-- ── Sécurité (RLS) ──────────────────────────────────────────
-- L'application se connecte à Postgres via Drizzle (DATABASE_URL, rôle
-- `postgres`) qui CONTOURNE la RLS. Activer la RLS SANS policy publique
-- bloque l'accès anonyme via l'API auto-générée de Supabase (PostgREST) :
-- personne ne peut lire les réponses RSVP avec la clé anon. Ne PAS ajouter
-- de policy publique sur ces tables.
alter table wedding       enable row level security;
alter table moment        enable row level security;
alter table parcours      enable row level security;
alter table rsvp_response enable row level security;
alter table media         enable row level security;

-- ── Storage : bucket public « media » ───────────────────────
-- Sert le motif, la musique et les photos (URL publiques, non expirantes).
-- Les uploads se font côté serveur avec la clé service-role (contourne la RLS).
insert into storage.buckets (id, name, public)
values ('media', 'media', true)
on conflict (id) do nothing;
