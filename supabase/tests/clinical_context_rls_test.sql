-- ============================================================================
-- clinical_context_rls_test.sql
-- Tests RLS isolés au niveau PostgreSQL pour les tables cliniques.
--
-- OBJECTIF : vérifier les policies RLS des tables clinical_* sans créer de
-- comptes Auth persistants, en simulant l'identité via
-- SET LOCAL "request.jwt.claims" à l'intérieur d'une transaction annulée
-- par ROLLBACK.
--
-- À EXÉCUTER dans l'éditeur SQL Supabase (session connectée en tant que
-- rôle propriétaire / postgres, qui peut faire SET LOCAL ROLE).
--
-- GARANTIES :
--   - Aucune donnée ne persiste : tout le script est encadré par
--     BEGIN ... ROLLBACK.
--   - Aucune policy n'est modifiée.
--   - Aucun compte Auth persistant n'est créé (les lignes auth.users de
--     test sont insérées puis annulées par le ROLLBACK final).
--   - N'utilise jamais service_role pour valider une policy : chaque
--     scénario passe par SET LOCAL ROLE authenticated + un JWT simulé,
--     exactement comme un vrai client applicatif.
--   - Aucune donnée personnelle réelle : UUID de test fixes, emails
--     fictifs *.test.local.
--
-- LECTURE DU RÉSULTAT :
--   Chaque assertion imprime NOTICE 'PASS ...' ou WARNING 'FAIL ...'.
--   Le script continue jusqu'au bout même en cas d'échec (chaque test est
--   isolé par un bloc DO ... EXCEPTION qui capture l'erreur attendue ou
--   inattendue sans interrompre la transaction globale).
-- ============================================================================

BEGIN;

-- ----------------------------------------------------------------------------
-- 0. Compteurs de résultat (variables de session via set_config/current_setting
--    — même mécanisme que request.jwt.claims plus bas, aucune table requise,
--    donc aucun problème de privilège possible ; tout est annulé de toute
--    façon par le ROLLBACK final, ces réglages ne survivent pas à la session)
-- ----------------------------------------------------------------------------
select set_config('app.test_total', '0', true);
select set_config('app.test_passed', '0', true);
select set_config('app.test_log', '', true);

create or replace function pg_temp.record_result(p_id text, p_desc text, p_passed boolean, p_detail text default '')
returns void language plpgsql as $$
declare
  v_line text;
begin
  perform set_config('app.test_total', (current_setting('app.test_total')::int + 1)::text, true);
  if p_passed then
    perform set_config('app.test_passed', (current_setting('app.test_passed')::int + 1)::text, true);
    v_line := 'PASS ' || p_id || ' — ' || p_desc;
  else
    v_line := 'FAIL ' || p_id || ' — ' || p_desc || ' (' || p_detail || ')';
  end if;
  perform set_config('app.test_log', current_setting('app.test_log') || v_line || E'\n', true);
  raise notice '%', v_line;
end;
$$;

-- ----------------------------------------------------------------------------
-- 1. UUID de test (fixes, reconnaissables, jamais réutilisés en dehors de
--    cette transaction)
-- ----------------------------------------------------------------------------
-- patient_A         a0000000-0000-4000-a000-000000000001
-- patient_B         a0000000-0000-4000-a000-000000000002
-- professionnel_C   a0000000-0000-4000-a000-000000000003
-- admin_technique_D a0000000-0000-4000-a000-000000000004

-- ----------------------------------------------------------------------------
-- 2. Données minimales : lignes auth.users temporaires
--    (nécessaires pour satisfaire les FK vers auth.users(id) ; supprimées
--    par le ROLLBACK final, jamais committées)
-- ----------------------------------------------------------------------------
insert into auth.users (
  id, instance_id, aud, role, email, encrypted_password,
  email_confirmed_at, created_at, updated_at,
  raw_app_meta_data, raw_user_meta_data, is_super_admin
) values
  ('a0000000-0000-4000-a000-000000000001', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'patient-a@test.local', '', now(), now(), now(), '{}', '{}', false),
  ('a0000000-0000-4000-a000-000000000002', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'patient-b@test.local', '', now(), now(), now(), '{}', '{}', false),
  ('a0000000-0000-4000-a000-000000000003', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'pro-c@test.local',     '', now(), now(), now(), '{}', '{}', false),
  ('a0000000-0000-4000-a000-000000000004', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'admin-d@test.local',   '', now(), now(), now(), '{}', '{}', false)
on conflict (id) do nothing;

-- Si profiles.role existe et distingue admin technique, marquer D comme admin
-- (n'affecte que cette transaction, annulé par ROLLBACK) — ajuster le nom de
-- colonne si besoin après lecture du schéma réel de profiles.
do $$
begin
  begin
    insert into profiles (id, role) values ('a0000000-0000-4000-a000-000000000004', 'admin')
    on conflict (id) do update set role = 'admin';
  exception when others then
    raise notice 'Info: insertion profiles.role ignorée (%), non bloquant pour les tests cliniques', sqlerrm;
  end;
end $$;

-- professionnel_C actif dans clinical_professionals
insert into clinical_professionals (user_id, is_active)
values ('a0000000-0000-4000-a000-000000000003', true);

-- Assignation professionnel_C -> patient_A uniquement (aucune vers patient_B)
insert into clinical_patient_assignments (professional_id, patient_id)
values ('a0000000-0000-4000-a000-000000000003', 'a0000000-0000-4000-a000-000000000001');

-- Consentement actif pour A et B (pour ne pas mélanger le test de
-- consentement, déjà couvert séparément, avec les tests de rôle ci-dessous)
insert into clinical_consents (user_id, consent_version, consent_text_hash)
values
  ('a0000000-0000-4000-a000-000000000001', 'test', 'test-hash'),
  ('a0000000-0000-4000-a000-000000000002', 'test', 'test-hash');

-- Une déclaration clinique pour A et pour B, insérées en tant que
-- superuser/owner (RLS non forcée pour le propriétaire de la table à ce
-- stade) afin de préparer les données lues par les tests SELECT.
insert into clinical_context_entries (id, user_id, category, code, label, status, source)
values
  ('b0000000-0000-4000-b000-000000000001', 'a0000000-0000-4000-a000-000000000001', 'intolerance', 'lactose', 'Lactose', 'to_verify', 'patient_report'),
  ('b0000000-0000-4000-b000-000000000002', 'a0000000-0000-4000-a000-000000000002', 'allergy', 'peanut', 'Arachide', 'to_verify', 'patient_report');

-- Une ligne déjà confirmée pour A (pour tester le refus de modification post-validation)
insert into clinical_context_entries (id, user_id, category, code, label, status, source, reviewed_by, reviewed_at)
values ('b0000000-0000-4000-b000-000000000003', 'a0000000-0000-4000-a000-000000000001', 'pathology', 'test_condition', 'Condition test', 'confirmed', 'professional_entry', 'a0000000-0000-4000-a000-000000000003', now());

-- Un symptôme pour A
insert into clinical_symptoms (id, user_id, symptom_type, status, source)
values ('c0000000-0000-4000-c000-000000000001', 'a0000000-0000-4000-a000-000000000001', 'bloating', 'to_verify', 'patient_report');

-- Une demande de résultat biologique pour A, et un résultat "validé" minimal
insert into clinical_lab_result_requests (id, user_id, request_note)
values ('d0000000-0000-4000-d000-000000000001', 'a0000000-0000-4000-a000-000000000001', 'Bilan demandé par le patient A (test)');

insert into clinical_lab_results (id, user_id, request_id, label, value, source, reviewed_by)
values ('e0000000-0000-4000-e000-000000000001', 'a0000000-0000-4000-a000-000000000001', 'd0000000-0000-4000-d000-000000000001', 'Calcium', '2.3 mmol/L', 'professional_entry', 'a0000000-0000-4000-a000-000000000003');

-- ----------------------------------------------------------------------------
-- 3. Fonction utilitaire : simuler l'identité d'un utilisateur authentifié
-- ----------------------------------------------------------------------------
do $$
begin
  raise notice '=== Vérification auth.uid() sous simulation ===';
end $$;

set local role authenticated;
set local "request.jwt.claims" = '{"sub":"a0000000-0000-4000-a000-000000000001","role":"authenticated"}';

do $$
declare
  v_uid uuid;
begin
  select auth.uid() into v_uid;
  perform pg_temp.record_result(
    '0-jwt-sub',
    'auth.uid() retourne bien l''UUID simulé (patient_A)',
    v_uid = 'a0000000-0000-4000-a000-000000000001'::uuid,
    'obtenu=' || coalesce(v_uid::text, 'NULL')
  );
end $$;

reset role;

-- ============================================================================
-- SECTION 1 — PROFESSIONNEL ASSIGNÉ (professionnel_C sur patient_A)
-- ============================================================================
set local role authenticated;
set local "request.jwt.claims" = '{"sub":"a0000000-0000-4000-a000-000000000003","role":"authenticated"}';

do $$
declare
  v_count int;
begin
  select count(*) into v_count from clinical_context_entries where user_id = 'a0000000-0000-4000-a000-000000000001';
  perform pg_temp.record_result('1a', 'Pro assigné : SELECT données cliniques de A autorisé (>=1 ligne)', v_count >= 1, 'count=' || v_count);
end $$;

do $$
begin
  begin
    insert into clinical_context_entries (user_id, category, code, label, status, source)
    values ('a0000000-0000-4000-a000-000000000001', 'medication', 'test_med', 'Médicament test', 'to_verify', 'professional_entry');
    perform pg_temp.record_result('1b', 'Pro assigné : INSERT professionnel pour A autorisé', true);
  exception when others then
    perform pg_temp.record_result('1b', 'Pro assigné : INSERT professionnel pour A autorisé', false, sqlerrm);
  end;
end $$;

do $$
declare
  v_rows int;
begin
  begin
    update clinical_context_entries
    set status = 'confirmed', reviewed_by = 'a0000000-0000-4000-a000-000000000003', reviewed_at = now()
    where id = 'b0000000-0000-4000-b000-000000000001';
    get diagnostics v_rows = row_count;
    perform pg_temp.record_result('1c', 'Pro assigné : UPDATE de validation pour A autorisé', v_rows = 1, 'rows=' || v_rows);
  exception when others then
    perform pg_temp.record_result('1c', 'Pro assigné : UPDATE de validation pour A autorisé', false, sqlerrm);
  end;
end $$;

do $$
declare
  v_count int;
begin
  select count(*) into v_count from clinical_symptoms where user_id = 'a0000000-0000-4000-a000-000000000001';
  perform pg_temp.record_result('1d', 'Pro assigné : SELECT symptôme de A autorisé (>=1 ligne)', v_count >= 1, 'count=' || v_count);
end $$;

reset role;

-- ============================================================================
-- SECTION 2 — PROFESSIONNEL NON ASSIGNÉ (professionnel_C sur patient_B)
-- ============================================================================
set local role authenticated;
set local "request.jwt.claims" = '{"sub":"a0000000-0000-4000-a000-000000000003","role":"authenticated"}';

do $$
declare
  v_count int;
begin
  select count(*) into v_count from clinical_context_entries where user_id = 'a0000000-0000-4000-a000-000000000002';
  perform pg_temp.record_result('2a', 'Pro non assigné : SELECT patient_B renvoie zéro ligne', v_count = 0, 'count=' || v_count);
end $$;

do $$
begin
  begin
    insert into clinical_context_entries (user_id, category, code, label, status, source)
    values ('a0000000-0000-4000-a000-000000000002', 'medication', 'test_med_b', 'Médicament test B', 'to_verify', 'professional_entry');
    perform pg_temp.record_result('2b', 'Pro non assigné : INSERT pour B refusé', false, 'insertion a réussi alors qu''elle devrait échouer');
  exception when others then
    perform pg_temp.record_result('2b', 'Pro non assigné : INSERT pour B refusé', true, sqlerrm);
  end;
end $$;

do $$
declare
  v_rows int;
begin
  update clinical_context_entries
  set status = 'confirmed', reviewed_by = 'a0000000-0000-4000-a000-000000000003', reviewed_at = now()
  where id = 'b0000000-0000-4000-b000-000000000002';
  get diagnostics v_rows = row_count;
  perform pg_temp.record_result('2c', 'Pro non assigné : UPDATE patient_B refusé (0 ligne affectée)', v_rows = 0, 'rows=' || v_rows);
end $$;

do $$
declare
  v_count int;
begin
  select count(*) into v_count from clinical_symptoms where user_id = 'a0000000-0000-4000-a000-000000000002';
  perform pg_temp.record_result('2d', 'Pro non assigné : SELECT symptômes patient_B renvoie zéro ligne', v_count = 0, 'count=' || v_count);
end $$;

do $$
declare
  v_count int;
begin
  select count(*) into v_count from clinical_lab_results where user_id = 'a0000000-0000-4000-a000-000000000002';
  perform pg_temp.record_result('2e', 'Pro non assigné : SELECT résultats biologiques patient_B refusé (zéro ligne)', v_count = 0, 'count=' || v_count);
end $$;

reset role;

-- ============================================================================
-- SECTION 3 — ADMIN TECHNIQUE SANS PERMISSION CLINIQUE (admin_technique_D)
-- ============================================================================
set local role authenticated;
set local "request.jwt.claims" = '{"sub":"a0000000-0000-4000-a000-000000000004","role":"authenticated"}';

do $$
declare
  v_count int;
begin
  select count(*) into v_count from clinical_context_entries;
  perform pg_temp.record_result('3a', 'Admin technique : SELECT données cliniques refusé (zéro ligne)', v_count = 0, 'count=' || v_count);
end $$;

do $$
begin
  begin
    insert into clinical_context_entries (user_id, category, code, label, status, source)
    values ('a0000000-0000-4000-a000-000000000001', 'medication', 'test_med_admin', 'Médicament test admin', 'to_verify', 'professional_entry');
    perform pg_temp.record_result('3b', 'Admin technique : INSERT refusé', false, 'insertion a réussi alors qu''elle devrait échouer');
  exception when others then
    perform pg_temp.record_result('3b', 'Admin technique : INSERT refusé', true, sqlerrm);
  end;
end $$;

do $$
declare
  v_rows int;
begin
  update clinical_context_entries set details = 'modifié par admin technique (test)' where id = 'b0000000-0000-4000-b000-000000000001';
  get diagnostics v_rows = row_count;
  perform pg_temp.record_result('3c', 'Admin technique : UPDATE refusé (0 ligne affectée)', v_rows = 0, 'rows=' || v_rows);
end $$;

do $$
declare
  v_count int;
begin
  select count(*) into v_count from clinical_symptoms;
  perform pg_temp.record_result('3d', 'Admin technique : SELECT symptômes refusé (zéro ligne)', v_count = 0, 'count=' || v_count);
end $$;

do $$
declare
  v_count int;
begin
  select count(*) into v_count from clinical_lab_results;
  perform pg_temp.record_result('3e', 'Admin technique : SELECT résultats biologiques refusé (zéro ligne)', v_count = 0, 'count=' || v_count);
end $$;

reset role;

-- ============================================================================
-- SECTION 4 — PATIENT (patient_A)
-- ============================================================================
set local role authenticated;
set local "request.jwt.claims" = '{"sub":"a0000000-0000-4000-a000-000000000001","role":"authenticated"}';

do $$
declare
  v_count int;
begin
  select count(*) into v_count from clinical_context_entries where user_id = 'a0000000-0000-4000-a000-000000000001';
  perform pg_temp.record_result('4a', 'Patient A : SELECT ses propres déclarations autorisé (>=1 ligne)', v_count >= 1, 'count=' || v_count);
end $$;

do $$
begin
  begin
    insert into clinical_context_entries (user_id, category, code, label, status, source)
    values ('a0000000-0000-4000-a000-000000000001', 'supplement', 'vitd', 'Vitamine D', 'to_verify', 'patient_report');
    perform pg_temp.record_result('4b', 'Patient A : INSERT status=to_verify/source=patient_report autorisé', true);
  exception when others then
    perform pg_temp.record_result('4b', 'Patient A : INSERT status=to_verify/source=patient_report autorisé', false, sqlerrm);
  end;
end $$;

do $$
begin
  begin
    insert into clinical_context_entries (user_id, category, code, label, status, source)
    values ('a0000000-0000-4000-a000-000000000001', 'supplement', 'vitc', 'Vitamine C', 'confirmed', 'patient_report');
    perform pg_temp.record_result('4c', 'Patient A : INSERT status=confirmed refusé', false, 'insertion a réussi alors qu''elle devrait échouer');
  exception when others then
    perform pg_temp.record_result('4c', 'Patient A : INSERT status=confirmed refusé', true, sqlerrm);
  end;
end $$;

do $$
begin
  begin
    insert into clinical_context_entries (user_id, category, code, label, status, source)
    values ('a0000000-0000-4000-a000-000000000001', 'supplement', 'vitb12', 'Vitamine B12', 'to_verify', 'professional_entry');
    perform pg_temp.record_result('4d', 'Patient A : INSERT source=professional_entry refusé', false, 'insertion a réussi alors qu''elle devrait échouer');
  exception when others then
    perform pg_temp.record_result('4d', 'Patient A : INSERT source=professional_entry refusé', true, sqlerrm);
  end;
end $$;

do $$
begin
  begin
    insert into clinical_context_entries (user_id, category, code, label, status, source, reviewed_by)
    values ('a0000000-0000-4000-a000-000000000001', 'supplement', 'magnesium', 'Magnésium', 'to_verify', 'patient_report', 'a0000000-0000-4000-a000-000000000003');
    perform pg_temp.record_result('4e', 'Patient A : fournir reviewed_by refusé', false, 'insertion a réussi alors qu''elle devrait échouer');
  exception when others then
    perform pg_temp.record_result('4e', 'Patient A : fournir reviewed_by refusé', true, sqlerrm);
  end;
end $$;

do $$
begin
  begin
    insert into clinical_context_entries (user_id, category, code, label, status, source, reviewed_at)
    values ('a0000000-0000-4000-a000-000000000001', 'supplement', 'zinc', 'Zinc', 'to_verify', 'patient_report', now());
    perform pg_temp.record_result('4e-bis', 'Patient A : fournir reviewed_at refusé', false, 'insertion a réussi alors qu''elle devrait échouer');
  exception when others then
    perform pg_temp.record_result('4e-bis', 'Patient A : fournir reviewed_at refusé', true, sqlerrm);
  end;
end $$;

do $$
declare
  v_count int;
begin
  select count(*) into v_count from clinical_context_entries where user_id = 'a0000000-0000-4000-a000-000000000002';
  perform pg_temp.record_result('4f', 'Patient A : SELECT patient_B renvoie zéro ligne', v_count = 0, 'count=' || v_count);
end $$;

do $$
declare
  v_rows int;
begin
  update clinical_context_entries set details = 'tentative patient sur ligne confirmée'
  where id = 'b0000000-0000-4000-b000-000000000003';
  get diagnostics v_rows = row_count;
  perform pg_temp.record_result('4g', 'Patient A : UPDATE de sa ligne confirmée refusé (0 ligne affectée)', v_rows = 0, 'rows=' || v_rows);
end $$;

do $$
declare
  v_rows int;
begin
  begin
    delete from clinical_context_entries where id = 'b0000000-0000-4000-b000-000000000001';
    get diagnostics v_rows = row_count;
    perform pg_temp.record_result('4h', 'Patient A : DELETE physique refusé', v_rows = 0, 'rows=' || v_rows);
  exception when others then
    perform pg_temp.record_result('4h', 'Patient A : DELETE physique refusé', true, sqlerrm);
  end;
end $$;

reset role;

-- ============================================================================
-- RAPPORT — SELECT final, garanti visible dans le tableau de résultats de
-- l'éditeur SQL (contrairement aux NOTICE/WARNING, non fiables dans l'UI)
-- ============================================================================
select
  current_setting('app.test_total')::int as total_tests,
  current_setting('app.test_passed')::int as tests_reussis,
  current_setting('app.test_total')::int - current_setting('app.test_passed')::int as tests_echoues,
  current_setting('app.test_log') as detail_par_test;

-- ============================================================================
-- ANNULATION — aucune donnée de test ne persiste, aucune policy modifiée
-- ============================================================================
ROLLBACK;
