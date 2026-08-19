-- ============================================================================
-- 20260819000001_add_profile_nutrition_advice_consent_purposes.sql
--
-- Sépare le consentement "conseils alimentaires personnalisés" (ajouté
-- en 20260819000000) en finalités distinctes, conformément au principe
-- de minimisation et de finalité déterminée (RGPD art. 5) : un
-- consentement général ne couvre pas automatiquement une adaptation aux
-- pathologies déclarées (donnée de catégorie particulière, art. 9) ni à
-- l'activité sportive déclarée — chacune a sa propre case, retirable
-- indépendamment.
--
-- consent_nutrition_advice (déjà ajoutée) reste la finalité "générale" :
-- analyse du journal pour des suggestions non liées aux pathologies
-- (sources de nutriments, alternatives aux aliments ultra-transformés).
--
-- Ce champ ne connecte rien : le moteur nutrition-*.js reste confiné à
-- nutrition-simulator-admin.html (profils fictifs uniquement). Voir
-- docs/GOVERNANCE_QUESTIONS.md.
--
-- Portée limitée : quatre colonnes, valeurs par défaut sûres
-- (false/null), aucune donnée existante modifiée, aucune nouvelle policy
-- RLS nécessaire.
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
    where table_schema = 'public' and table_name = 'profiles' and column_name = 'consent_nutrition_advice_pathology'
  ) then
    raise exception 'add_profile_nutrition_advice_consent_purposes: la colonne profiles.consent_nutrition_advice_pathology existe déjà. Cette migration ne doit pas être réexécutée.';
  end if;
end $$;

alter table profiles
  add column consent_nutrition_advice_pathology boolean not null default false,
  add column consent_nutrition_advice_pathology_at timestamptz null,
  add column consent_nutrition_advice_sport boolean not null default false,
  add column consent_nutrition_advice_sport_at timestamptz null;
