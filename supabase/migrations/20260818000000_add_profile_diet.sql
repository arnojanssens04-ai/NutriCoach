-- ============================================================================
-- 20260818000000_add_profile_diet.sql
--
-- STATUT : MIGRATION DE RÉFÉRENCE — SCHÉMA DÉJÀ APPLIQUÉ (exécutée
-- manuellement dans l'éditeur SQL Supabase le 2026-08-18, confirmation
-- "Success"). NE DOIT PAS être réexécutée sur ce projet — la garde
-- ci-dessous s'en assure de toute façon.
--
-- Ajoute une colonne `diet` déclarative à la table `profiles` existante,
-- pour permettre à une personne d'indiquer un régime végétarien/végétalien
-- à l'inscription (index.html, formulaire de création de compte).
--
-- Portée volontairement limitée :
--   - colonne nullable, valeur par défaut NULL ("aucune restriction
--     déclarée", cohérent avec la convention déjà utilisée par
--     nutrition-food-selector.js : profileDiet falsy => aucune
--     restriction) ;
--   - aucune donnée existante modifiée (ALTER TABLE ADD COLUMN pur,
--     rétrocompatible) ;
--   - ne crée aucune policy RLS supplémentaire : `profiles` a déjà ses
--     propres policies existantes (non documentées ici, hors périmètre de
--     cette migration) qui s'appliquent automatiquement à la colonne
--     ajoutée ;
--   - cette valeur reste une préférence déclarative simple, distincte des
--     tables cliniques (`clinical_context_entries` etc.) — pas de lien
--     avec le moteur de conseils confiné (nutrition-*.js), qui reste en
--     simulation admin uniquement.
--
-- SÉCURITÉ D'EXÉCUTION : s'arrête si la colonne existe déjà, pour éviter
-- toute réexécution accidentelle.
--
-- Ce fichier doit être exécuté manuellement dans l'éditeur SQL Supabase
-- (même procédure que 20260814000000_clinical_context_reference.sql) —
-- il n'est pas exécuté automatiquement par cette session.
-- ============================================================================

do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'profiles' and column_name = 'diet'
  ) then
    raise exception 'add_profile_diet: la colonne profiles.diet existe déjà. Cette migration ne doit pas être réexécutée.';
  end if;
end $$;

alter table profiles
  add column diet text
  check (diet is null or diet in ('vegetarian', 'vegan'));
