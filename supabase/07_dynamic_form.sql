-- 07_dynamic_form.sql — Formulaire RSVP dynamique par parcours.
-- Additif & idempotent : peut être relancé sans risque.

-- Liste ordonnée des questions du formulaire d'un parcours (RsvpQuestion[]).
-- Absente (ancien parcours) → l'app applique un formulaire par défaut.
alter table parcours add column if not exists form_questions jsonb;

-- Réponses aux questions dynamiques d'une réponse RSVP (clé = id de la question).
alter table rsvp_response add column if not exists answers jsonb not null default '{}'::jsonb;
