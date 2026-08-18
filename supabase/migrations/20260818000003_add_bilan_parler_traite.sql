-- ============================================================================
-- 20260818000003_add_bilan_parler_traite.sql
--
-- Ajoute une colonne `parler_traite` à `bilans`, pour que l'admin puisse
-- marquer une demande "je souhaite en parler" comme traitée dès qu'il a
-- contacté la personne, plutôt que d'attendre que le patient soumette un
-- nouveau bilan (jusqu'à une semaine plus tard) pour que la demande
-- disparaisse automatiquement de bilan_recap.html.
--
-- Portée limitée : une colonne booléenne avec valeur par défaut, aucune
-- donnée existante modifiée, aucune nouvelle policy RLS nécessaire (les
-- policies UPDATE existantes sur `bilans`, déjà vérifiées, couvrent cette
-- colonne comme les autres).
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
    where table_schema = 'public' and table_name = 'bilans' and column_name = 'parler_traite'
  ) then
    raise exception 'add_bilan_parler_traite: la colonne bilans.parler_traite existe déjà. Cette migration ne doit pas être réexécutée.';
  end if;
end $$;

alter table bilans
  add column parler_traite boolean not null default false;
