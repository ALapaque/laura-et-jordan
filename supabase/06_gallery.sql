-- 06_gallery.sql — Galerie du couple (album libre, non lié à un moment).
-- Additif & idempotent : peut être relancé sans risque. Calqué sur 04_moment_media.sql.

create table if not exists gallery_photo (
  id          uuid primary key default gen_random_uuid(),
  wedding_id  uuid not null references wedding(id) on delete cascade,
  media_id    uuid not null references media(id)  on delete cascade,
  sort_order  integer not null default 0,
  unique (wedding_id, media_id)
);

create index if not exists gallery_photo_wedding_id_idx on gallery_photo (wedding_id);

-- RLS activée SANS policy publique : l'app accède via la clé service-role
-- (qui contourne RLS). Ne PAS ajouter de policy publique sur cette table.
alter table gallery_photo enable row level security;
