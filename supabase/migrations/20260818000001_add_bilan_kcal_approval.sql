-- ============================================================================
-- 20260818000001_add_bilan_kcal_approval.sql
--
-- Ajoute une étape de validation ADMIN avant tout ajustement calorique
-- automatique proposé par bilan.html (stagnation/dérive de poids). Avant
-- cette migration, profiles.kcal_adjustment était modifié directement par
-- le patient (via bilan.html) dès qu'une stagnation ou une dérive était
-- détectée — plusieurs cas problématiques constatés en usage réel.
--
-- Désormais : bilan.html enregistre uniquement une PROPOSITION
-- (kcal_ajustement_status = 'pending', kcal_ajustement_valeur_proposee =
-- la nouvelle valeur de kcal_adjustment si validée). Seul un admin, via
-- bilan_recap.html, peut faire passer ce statut à 'approved' (et alors
-- appliquer la valeur à profiles.kcal_adjustment) ou 'rejected' (aucun
-- changement).
--
-- Portée limitée : deux colonnes nullables/à défaut sur `bilans`
-- (existante), aucune donnée existante modifiée, aucune nouvelle table,
-- aucune policy RLS supplémentaire (les policies existantes sur
-- `bilans` s'appliquent automatiquement aux nouvelles colonnes).
--
-- SÉCURITÉ D'EXÉCUTION : s'arrête si la colonne existe déjà.
--
-- À exécuter manuellement dans l'éditeur SQL Supabase (même procédure
-- que les migrations précédentes) — non exécutée par cette session.
-- ============================================================================

do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'bilans' and column_name = 'kcal_ajustement_status'
  ) then
    raise exception 'add_bilan_kcal_approval: la colonne bilans.kcal_ajustement_status existe déjà. Cette migration ne doit pas être réexécutée.';
  end if;
end $$;

alter table bilans
  add column kcal_ajustement_status text not null default 'none'
  check (kcal_ajustement_status in ('none', 'pending', 'approved', 'rejected'));

alter table bilans
  add column kcal_ajustement_valeur_proposee integer;
