-- ============================================================================
-- 20260819000000_add_profile_nutrition_advice_consent.sql
--
-- Ajoute un consentement dédié, distinct du consentement santé existant
-- (pathologies), pour l'usage futur du journal alimentaire par le moteur
-- de conseils personnalisés (nutrition-*.js — actuellement confiné à
-- nutrition-simulator-admin.html, profils fictifs uniquement).
--
-- Ce champ ne connecte rien : il prépare le choix explicite du patient
-- pour le jour où la connexion réelle sera autorisée (voir
-- docs/GOVERNANCE_QUESTIONS.md, question 5 — la qualification MDR du
-- moteur reste bloquante tant qu'un avis juridique formel n'a pas
-- tranché ce point).
--
-- Portée limitée : deux colonnes, valeurs par défaut sûres (false/null),
-- aucune donnée existante modifiée, aucune nouvelle policy RLS
-- nécessaire (les policies déjà en place sur `profiles` couvrent ces
-- colonnes comme les autres).
--
-- SÉCURITÉ D'EXÉCUTION : s'arrête si les colonnes existent déjà.
--
-- À exécuter manuellement dans l'éditeur SQL Supabase — non exécutée par
-- cette session.
-- ============================================================================

do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'profiles' and column_name = 'consent_nutrition_advice'
  ) then
    raise exception 'add_profile_nutrition_advice_consent: la colonne profiles.consent_nutrition_advice existe déjà. Cette migration ne doit pas être réexécutée.';
  end if;
end $$;

alter table profiles
  add column consent_nutrition_advice boolean not null default false,
  add column consent_nutrition_advice_at timestamptz null;
