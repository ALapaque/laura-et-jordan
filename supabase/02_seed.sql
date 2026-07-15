-- ============================================================
--  Laura & Jordan — données de démarrage (facultatif)
--  À exécuter APRÈS 01_schema.sql, dans Supabase → SQL Editor.
--  Crée : le mariage, 4 moments, 3 parcours (avec liens) et
--  quelques réponses d'exemple pour peupler le dashboard.
--
--  ⚠️ À n'exécuter qu'UNE fois (sinon doublons). Pour repartir de zéro :
--     truncate rsvp_response, parcours, moment, wedding restart identity cascade;
-- ============================================================

do $$
declare
  w_id     uuid;
  m_cer    uuid;
  m_apero  uuid;
  m_diner  uuid;
  m_soiree uuid;
  p1 uuid; p2 uuid; p3 uuid;
  fields jsonb := '{"askNames":true,"askHeadcount":true,"askPerMoment":true,"askDietary":true,"askMessage":true,"maxHeadcount":12}';
begin
  insert into wedding (couple_names, event_date, welcome_text, locales, notify_emails, notify_enabled, site_domain)
  values (
    'Laura & Jordan',
    '2027-07-31 14:00:00+00',
    'C''est entourés de ceux qui comptent que nous voulons dire oui.',
    '{fr}', '{}', true, 'mariage.example.be'
  )
  returning id into w_id;

  insert into moment (wedding_id, title, description, sort_order)
    values (w_id, 'Cérémonie',    'L''échange des vœux, le moment du oui.',        0) returning id into m_cer;
  insert into moment (wedding_id, title, description, sort_order)
    values (w_id, 'Vin d''honneur','Un verre pour trinquer tous ensemble.',        1) returning id into m_apero;
  insert into moment (wedding_id, title, description, sort_order)
    values (w_id, 'Dîner',        'Repas, discours et belles surprises.',          2) returning id into m_diner;
  insert into moment (wedding_id, title, description, sort_order)
    values (w_id, 'Soirée',       'Musique et danse jusqu''au bout de la nuit.',   3) returning id into m_soiree;

  insert into parcours (wedding_id, token, name, visible_moment_ids, rsvp_fields)
    values (w_id, 'ax7f9k2m', 'Journée complète', array[m_cer, m_apero, m_diner, m_soiree], fields)
    returning id into p1;
  insert into parcours (wedding_id, token, name, visible_moment_ids, rsvp_fields)
    values (w_id, 'q3m8t1zv', 'Apéro & Dîner', array[m_apero, m_diner, m_soiree], fields)
    returning id into p2;
  insert into parcours (wedding_id, token, name, visible_moment_ids, rsvp_fields)
    values (w_id, 'k9v2p7wd', 'Cérémonie', array[m_cer, m_apero],
            jsonb_set(fields, '{askPerMoment}', 'false'))
    returning id into p3;

  insert into rsvp_response (parcours_id, guest_name, attending, headcount) values
    (p1, 'Famille Dubois',   'yes',   4),
    (p2, 'Camille & Théo',   'yes',   2),
    (p3, 'Oncle Marc',       'maybe', 1),
    (p1, 'Sophie Laurent',   'yes',   2),
    (p1, 'Les Moreau',       'no',    0),
    (p2, 'Julie & Sam',      'yes',   2),
    (p3, 'Grand-mère Alice', 'yes',   1),
    (p1, 'Nicolas P.',       'maybe', 2);

  raise notice 'Seed terminé. Liens : /i/ax7f9k2m · /i/q3m8t1zv · /i/k9v2p7wd';
end $$;
