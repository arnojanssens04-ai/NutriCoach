-- ============================================================================
-- 20260818000002_add_bilan_kcal_champ.sql
--
-- Complète 20260818000001_add_bilan_kcal_approval.sql : ajoute la colonne
-- kcal_ajustement_champ, qui indique quel champ de `profiles` une
-- validation admin doit modifier pour qu'une proposition d'ajustement ait
-- un effet réel.
--
-- Pourquoi nécessaire : quand un admin force l'objectif calorique d'un
-- patient (admin.html, case "Forcer cet objectif kcal/j" — active
-- plan_fixe et fixe kcal_target), calcTargets() (dashboard.html,
-- bilan.html, bilan_recap.html) retourne directement kcal_target et
-- IGNORE totalement kcal_adjustment. Sans cette colonne, une proposition
-- d'ajustement suite à une stagnation de poids validée par l'admin
-- écrirait dans kcal_adjustment sans aucun effet réel pour ce patient —
-- le mécanisme de suivi de stagnation doit continuer à fonctionner même
-- quand les calories sont forcées.
--
-- bilan.html détermine désormais ce champ au moment de la proposition
-- ('kcal_target' si les calories du patient sont forcées, sinon
-- 'kcal_adjustment'), et bilan_recap.html l'utilise pour savoir quel
-- champ de profiles mettre à jour lors de la validation.
--
-- Portée limitée : une colonne texte avec valeur par défaut, aucune
-- donnée existante modifiée, aucune nouvelle policy RLS nécessaire.
--
-- SÉCURITÉ D'EXÉCUTION : s'arrête si la colonne existe déjà.
--
-- À exécuter manuellement dans l'éditeur SQL Supabase — non exécutée par
-- cette session.
-- ============================================================================

do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'bilans' and column_name = 'kcal_ajustement_champ'
  ) then
    raise exception 'add_bilan_kcal_champ: la colonne bilans.kcal_ajustement_champ existe déjà. Cette migration ne doit pas être réexécutée.';
  end if;
end $$;

alter table bilans
  add column kcal_ajustement_champ text not null default 'kcal_adjustment'
  check (kcal_ajustement_champ in ('kcal_adjustment', 'kcal_target'));
