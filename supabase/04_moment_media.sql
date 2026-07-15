-- ============================================================
--  Laura & Jordan — galeries multi-photos par moment
--  À exécuter dans Supabase → SQL Editor, APRÈS 01_schema.sql.
--  Permet d'attacher PLUSIEURS photos (réordonnables) à chaque moment
--  depuis Dashboard → Moments. Sans ce script, chaque moment garde sa
--  photo unique historique (rien ne casse à l'affichage).
--  ⚠️ Idempotent : peut être relancé sans risque.
-- ============================================================

create table if not exists moment_media (
  id          uuid primary key default gen_random_uuid(),
  moment_id   uuid not null references moment(id) on delete cascade,
  media_id    uuid not null references media(id)  on delete cascade,
  sort_order  integer not null default 0,
  unique (moment_id, media_id)
);
create index if not exists moment_media_moment_id_idx on moment_media (moment_id);

-- Même logique de sécurité que les autres tables : RLS activée SANS policy
-- publique (l'app passe par Drizzle/`postgres` qui contourne la RLS).
alter table moment_media enable row level security;

-- Reprend la photo unique existante (moment.media_id) comme 1re photo de la galerie.
insert into moment_media (moment_id, media_id, sort_order)
select id, media_id, 0 from moment where media_id is not null
on conflict (moment_id, media_id) do nothing;
