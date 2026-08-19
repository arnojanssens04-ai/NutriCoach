-- ============================================================================
-- 20260814000000_clinical_context_reference.sql
--
-- STATUT : MIGRATION DE RÉFÉRENCE — SCHÉMA DÉJÀ APPLIQUÉ.
--
-- Ce fichier documente fidèlement les objets cliniques déjà créés sur le
-- projet Supabase de Cap Santé (exécutés manuellement, bloc par bloc, dans
-- l'éditeur SQL Supabase). Il NE DOIT PAS être réexécuté sur ce projet.
--
-- Contenu vérifié contre le schéma réel le 2026-08-14 :
--   - 7 tables : RLS activé confirmé sur les 7 (relrowsecurity = true) ;
--   - 18 policies confirmées (noms, table, commande) ;
--   - 0 policy DELETE confirmée sur les 7 tables ;
--   - 5 triggers confirmés (nom, table, timing, événement) ;
--   - 5 fonctions confirmées, toutes security definer ;
--   - 15 index confirmés (clés primaires + index applicatifs) ;
--   - 12 contraintes CHECK confirmées, texte exact ;
--   - 13 clés étrangères confirmées, texte exact.
-- Aucune divergence trouvée entre ce SQL et le schéma réel au moment de la
-- vérification. Aucun GRANT explicite n'a été émis par ce script : les
-- privilèges visibles sur anon/authenticated/service_role sont les GRANT
-- par défaut de Supabase pour toute table du schéma public exposée via
-- l'API — la restriction réelle vient uniquement des policies RLS
-- ci-dessous (auth.uid() est NULL pour anon, ce qui bloque toutes les
-- conditions user_id = auth.uid()).
--
-- SÉCURITÉ D'EXÉCUTION : ce fichier s'arrête immédiatement avec une erreur
-- explicite s'il détecte que les tables existent déjà, pour empêcher toute
-- réexécution accidentelle sur ce projet ou son écrasement sur un autre
-- projet où elles existeraient déjà sous une autre forme.
-- ============================================================================

do $$
begin
  if exists (
    select 1 from information_schema.tables
    where table_schema = 'public' and table_name = 'clinical_professionals'
  ) then
    raise exception 'clinical_context_reference: clinical_professionals existe déjà. Ce fichier est une référence de l''état déjà appliqué et ne doit pas être réexécuté sur ce projet.';
  end if;
end $$;

-- ============================================================================
-- 1. clinical_professionals
-- ============================================================================
create table clinical_professionals (
  user_id uuid primary key references auth.users(id) on delete cascade,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

alter table clinical_professionals enable row level security;
-- Aucune policy définie : accès direct refusé par défaut pour tous les rôles.

-- ============================================================================
-- 2. clinical_patient_assignments
-- ============================================================================
create table clinical_patient_assignments (
  id uuid primary key default gen_random_uuid(),
  professional_id uuid not null references clinical_professionals(user_id) on delete cascade,
  patient_id uuid not null references auth.users(id) on delete cascade,
  assigned_at timestamptz not null default now(),
  revoked_at timestamptz,
  unique (professional_id, patient_id)
);

create index idx_assignments_patient on clinical_patient_assignments (patient_id) where revoked_at is null;
create index idx_assignments_professional on clinical_patient_assignments (professional_id) where revoked_at is null;

alter table clinical_patient_assignments enable row level security;
-- Aucune policy définie : accès direct refusé par défaut pour tous les rôles.

-- ============================================================================
-- 3. Fonctions de rôle
-- ============================================================================
create or replace function is_active_clinical_professional()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from clinical_professionals
    where user_id = auth.uid() and is_active = true
  );
$$;

create or replace function is_assigned_professional_for(p_patient_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from clinical_patient_assignments a
    join clinical_professionals p on p.user_id = a.professional_id
    where a.professional_id = auth.uid()
      and a.patient_id = p_patient_id
      and a.revoked_at is null
      and p.is_active = true
  );
$$;

-- ============================================================================
-- 4. clinical_consents
-- ============================================================================
create table clinical_consents (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  purpose text not null default 'clinical_context' check (purpose = 'clinical_context'),
  consent_version text not null,
  consent_text_hash text not null,
  granted_at timestamptz not null default now(),
  withdrawn_at timestamptz,
  created_at timestamptz not null default now()
);

create index idx_consents_user_purpose on clinical_consents (user_id, purpose);

alter table clinical_consents enable row level security;

create policy consents_select_own on clinical_consents
  for select using (user_id = auth.uid());

create policy consents_insert_own on clinical_consents
  for insert with check (user_id = auth.uid());

create policy consents_withdraw_own on clinical_consents
  for update using (user_id = auth.uid())
  with check (
    user_id = auth.uid()
    and purpose = 'clinical_context'
    and consent_version = (select consent_version from clinical_consents c2 where c2.id = clinical_consents.id)
    and consent_text_hash = (select consent_text_hash from clinical_consents c2 where c2.id = clinical_consents.id)
    and granted_at = (select granted_at from clinical_consents c2 where c2.id = clinical_consents.id)
  );

create or replace function has_active_clinical_consent(p_user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from clinical_consents
    where user_id = p_user_id
      and purpose = 'clinical_context'
      and withdrawn_at is null
  );
$$;

-- ============================================================================
-- 5. clinical_context_entries
-- ============================================================================
create table clinical_context_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  category text not null check (category in ('pathology','allergy','intolerance','medication','supplement')),
  code text not null,
  label text not null,
  details text not null default '',
  status text not null default 'to_verify' check (status in ('to_verify','confirmed','denied','unknown')),
  source text not null check (source in ('patient_report','professional_entry','journal_observation','imported_data')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  reviewed_at timestamptz,
  reviewed_by uuid references clinical_professionals(user_id)
);

create index idx_context_entries_user_category on clinical_context_entries (user_id, category);

alter table clinical_context_entries enable row level security;

create or replace function protect_clinical_review_fields()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if not is_active_clinical_professional() then
    if new.status is distinct from old.status
       or new.source is distinct from old.source
       or new.reviewed_at is distinct from old.reviewed_at
       or new.reviewed_by is distinct from old.reviewed_by then
      raise exception 'Seul un professionnel actif peut modifier status/source/reviewed_at/reviewed_by';
    end if;
  end if;
  new.updated_at := now();
  return new;
end;
$$;

create trigger trg_protect_context_review
  before update on clinical_context_entries
  for each row execute function protect_clinical_review_fields();

create or replace function require_active_consent()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if not has_active_clinical_consent(new.user_id) then
    raise exception 'Consentement clinique actif requis avant toute écriture';
  end if;
  return new;
end;
$$;

create trigger trg_require_consent_context
  before insert on clinical_context_entries
  for each row execute function require_active_consent();

create policy context_select on clinical_context_entries
  for select using (
    user_id = auth.uid()
    or is_assigned_professional_for(user_id)
  );

create policy context_insert_patient on clinical_context_entries
  for insert with check (
    user_id = auth.uid()
    and status = 'to_verify'
    and source = 'patient_report'
    and reviewed_by is null
    and reviewed_at is null
  );

create policy context_insert_professional on clinical_context_entries
  for insert with check (
    is_assigned_professional_for(user_id)
    and source in ('professional_entry')
  );

create policy context_update_patient on clinical_context_entries
  for update using (
    user_id = auth.uid() and status = 'to_verify'
  )
  with check (
    user_id = auth.uid()
    and status = 'to_verify'
    and source = 'patient_report'
    and reviewed_by is null
    and reviewed_at is null
  );

create policy context_update_professional on clinical_context_entries
  for update using (
    is_assigned_professional_for(user_id)
  )
  with check (
    is_assigned_professional_for(user_id)
  );

-- Aucune policy DELETE définie -> DELETE refusé par défaut pour tous les rôles.

-- ============================================================================
-- 6. clinical_symptoms
-- ============================================================================
create table clinical_symptoms (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  symptom_type text not null check (symptom_type in ('bloating','abdominal_distension','peripheral_swelling','rapid_weight_change','unknown')),
  location text,
  occurred_at timestamptz not null default now(),
  intensity int check (intensity between 1 and 10),
  duration_minutes int check (duration_minutes is null or duration_minutes >= 0),
  meal_id uuid,
  food_groups text[] not null default '{}',
  stress_context text,
  activity_context text,
  medication_context text,
  cycle_context text,
  patient_comment text not null default '',
  status text not null default 'to_verify' check (status in ('to_verify','confirmed','denied','unknown')),
  source text not null check (source in ('patient_report','professional_entry','journal_observation')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  reviewed_at timestamptz,
  reviewed_by uuid references clinical_professionals(user_id)
);

create index idx_symptoms_user_type on clinical_symptoms (user_id, symptom_type);

alter table clinical_symptoms enable row level security;

create trigger trg_protect_symptoms_review
  before update on clinical_symptoms
  for each row execute function protect_clinical_review_fields();

create trigger trg_require_consent_symptoms
  before insert on clinical_symptoms
  for each row execute function require_active_consent();

create policy symptoms_select on clinical_symptoms
  for select using (
    user_id = auth.uid() or is_assigned_professional_for(user_id)
  );

create policy symptoms_insert_patient on clinical_symptoms
  for insert with check (
    user_id = auth.uid()
    and status = 'to_verify'
    and source = 'patient_report'
    and reviewed_by is null
    and reviewed_at is null
  );

create policy symptoms_insert_professional on clinical_symptoms
  for insert with check (
    is_assigned_professional_for(user_id)
    and source in ('professional_entry')
  );

create policy symptoms_update_patient on clinical_symptoms
  for update using (user_id = auth.uid() and status = 'to_verify')
  with check (
    user_id = auth.uid()
    and status = 'to_verify'
    and source = 'patient_report'
    and reviewed_by is null
    and reviewed_at is null
  );

create policy symptoms_update_professional on clinical_symptoms
  for update using (is_assigned_professional_for(user_id))
  with check (is_assigned_professional_for(user_id));

-- Aucune policy DELETE définie.

-- ============================================================================
-- 7. clinical_lab_result_requests et clinical_lab_results
-- ============================================================================
create table clinical_lab_result_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  request_note text not null default '',
  status text not null default 'to_verify' check (status in ('to_verify','confirmed','denied','unknown')),
  created_at timestamptz not null default now(),
  reviewed_at timestamptz,
  reviewed_by uuid references clinical_professionals(user_id)
);

create index idx_lab_requests_user on clinical_lab_result_requests (user_id);

alter table clinical_lab_result_requests enable row level security;

create trigger trg_require_consent_lab_requests
  before insert on clinical_lab_result_requests
  for each row execute function require_active_consent();

create policy lab_requests_select on clinical_lab_result_requests
  for select using (
    user_id = auth.uid() or is_assigned_professional_for(user_id)
  );

create policy lab_requests_insert_patient on clinical_lab_result_requests
  for insert with check (
    user_id = auth.uid() and status = 'to_verify' and reviewed_by is null
  );

create policy lab_requests_update_professional on clinical_lab_result_requests
  for update using (is_assigned_professional_for(user_id))
  with check (is_assigned_professional_for(user_id));

create table clinical_lab_results (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  request_id uuid references clinical_lab_result_requests(id),
  label text not null,
  value text not null,
  unit text,
  status text not null default 'confirmed' check (status in ('confirmed','denied','unknown')),
  source text not null check (source in ('professional_entry','laboratory_result','imported_data')),
  created_at timestamptz not null default now(),
  reviewed_at timestamptz not null default now(),
  reviewed_by uuid not null references clinical_professionals(user_id)
);

create index idx_lab_results_user on clinical_lab_results (user_id);

alter table clinical_lab_results enable row level security;

create policy lab_results_select on clinical_lab_results
  for select using (
    user_id = auth.uid() or is_assigned_professional_for(user_id)
  );

create policy lab_results_insert_professional on clinical_lab_results
  for insert with check (
    is_assigned_professional_for(user_id)
    and reviewed_by = auth.uid()
  );
-- Aucune policy INSERT patient -> écriture directe impossible par construction.
-- Aucune policy UPDATE/DELETE définie dans cette version.
