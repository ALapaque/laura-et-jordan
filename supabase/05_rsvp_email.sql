-- ============================================================
--  Laura & Jordan — email des invités (auto-modification de la réponse)
--  À exécuter dans Supabase → SQL Editor, APRÈS 01_schema.sql.
--  Ajoute la colonne `email` à rsvp_response : identifiant qui permet à un
--  invité de RETROUVER et MODIFIER sa réponse depuis son lien.
--  Sans ce script, le site continue de fonctionner (l'email n'est simplement
--  ni stocké ni exploitable) — rien ne casse.
--  ⚠️ Idempotent : peut être relancé sans risque.
-- ============================================================

alter table rsvp_response add column if not exists email text;

-- Index insensible à la casse pour la recherche par email.
create index if not exists rsvp_response_email_idx on rsvp_response (lower(email));
