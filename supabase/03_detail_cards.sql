-- ============================================================
--  Laura & Jordan — cartes « Détails pratiques » (gérables au dashboard)
--  À exécuter dans Supabase → SQL Editor, APRÈS 01_schema.sql.
--  Active la gestion (texte + photo) des cartes Lieu / Tenue / Accès…
--  depuis Dashboard → Contenu. Sans ce script, le site affiche des cartes
--  par défaut (texte seul) — rien ne casse, mais on ne peut pas les éditer.
--  ⚠️ Idempotent : peut être relancé sans risque (ne recrée pas les cartes).
-- ============================================================

create table if not exists detail_card (
  id          uuid primary key default gen_random_uuid(),
  wedding_id  uuid not null references wedding(id) on delete cascade,
  label       text not null default '',
  value       text not null default '',
  media_id    uuid references media(id) on delete set null,
  sort_order  integer not null default 0
);
create index if not exists detail_card_wedding_id_idx on detail_card (wedding_id);

-- Même logique de sécurité que les autres tables : RLS activée SANS policy
-- publique (l'app passe par Drizzle/`postgres` qui contourne la RLS).
alter table detail_card enable row level security;

-- Cartes par défaut (insérées une seule fois, si la table est vide).
do $$
declare w_id uuid;
begin
  select id into w_id from wedding limit 1;
  if w_id is not null and not exists (select 1 from detail_card) then
    insert into detail_card (wedding_id, label, value, sort_order) values
      (w_id, 'Lieu',                 'Le lieu vous sera bientôt dévoilé',   0),
      (w_id, 'Dress code',           'Élégant · tons naturels bienvenus',   1),
      (w_id, 'Accès & hébergements', 'Informations à venir prochainement',  2);
    raise notice 'detail_card : 3 cartes par défaut créées.';
  end if;
end $$;
