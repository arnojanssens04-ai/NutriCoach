# Accès aux données de contexte clinique

Document de référence pour le modèle de sécurité des tables cliniques
(`clinical_professionals`, `clinical_patient_assignments`, `clinical_consents`,
`clinical_context_entries`, `clinical_symptoms`, `clinical_lab_result_requests`,
`clinical_lab_results`). Schéma appliqué le 2026-08-14, référencé dans
`supabase/migrations/20260814000000_clinical_context_reference.sql`, testé par
`supabase/tests/clinical_context_rls_test.sql`.

Ce document ne contient aucune clé, aucun token, aucun mot de passe, aucun
email réel, aucune donnée personnelle réelle.

## Modèle d'accès

**Utilisateur (patient)**
- Peut déclarer une pathologie, allergie, intolérance, traitement,
  complément ou symptôme le concernant.
- Toute déclaration est enregistrée avec `source = patient_report` et
  `status = to_verify`, imposés par les policies RLS — l'utilisateur ne peut
  jamais fournir lui-même `status = confirmed`, `source = professional_entry`,
  `verified_by`/`reviewed_by`, ou `reviewed_at`.
- Peut modifier sa déclaration tant qu'elle reste `to_verify`. Une fois
  validée par un professionnel, elle n'est plus modifiable par l'utilisateur.
- Peut uniquement signaler une demande de résultat biologique
  (`clinical_lab_result_requests`) — ne peut jamais créer directement un
  résultat validé dans `clinical_lab_results`.

**Professionnel assigné**
- Doit être actif dans `clinical_professionals` (`is_active = true`) et avoir
  une assignation non révoquée vers le patient concerné
  (`clinical_patient_assignments`, `revoked_at is null`).
- Peut lire les déclarations et symptômes des patients qui lui sont assignés.
- Peut valider une déclaration (changer `status`, renseigner `reviewed_at`/
  `reviewed_by`), et créer des résultats biologiques validés.

**Professionnel non assigné**
- Aucun accès en lecture ou écriture aux données d'un patient qui ne lui est
  pas assigné, même s'il est actif dans `clinical_professionals`.

**Administrateur technique**
- N'a **aucun accès clinique automatique**. Le rôle `admin` de `profiles` ne
  donne aucun droit sur les tables cliniques : l'accès professionnel exige
  une entrée explicite dans `clinical_professionals` avec assignation active,
  jamais `is_admin()` seul.

**Résultats biologiques**
- Créés uniquement par un professionnel assigné ou par un import documenté
  (hors périmètre actuel). Le patient peut seulement signaler qu'il souhaite
  un résultat, via `clinical_lab_result_requests`.

## Suppression

Aucun `DELETE` physique n'est autorisé sur aucune des 7 tables (aucune
policy DELETE définie). Une correction se ferait par une nouvelle ligne et
le changement de statut de l'ancienne, jamais par suppression.

## Consentement

Toute nouvelle écriture dans `clinical_context_entries`,
`clinical_symptoms` ou `clinical_lab_result_requests` exige un consentement
actif dans `clinical_consents` (`purpose = 'clinical_context'`,
`withdrawn_at is null`), vérifié par un trigger avant insertion. Le retrait
du consentement (`withdrawn_at` renseigné) bloque toute nouvelle écriture
mais ne supprime pas l'historique déjà enregistré.

## Validation

Les policies RLS ont été testées par un script isolé au niveau PostgreSQL
(`supabase/tests/clinical_context_rls_test.sql`, transaction `BEGIN`/
`ROLLBACK`, comptes de test simulés via JWT, aucun compte Auth persistant) :
**24 assertions, 24 réussites, 0 échec**, couvrant le professionnel assigné,
le professionnel non assigné, l'administrateur technique et le patient.

## Limites actuelles

- Aucune interface applicative n'existe encore pour ces tables : ni
  formulaire utilisateur, ni page dédiée, ni route.
- `clinical-context.js` (modèles de données neutres, aucun appel Supabase)
  existe mais n'est chargé par aucune page.
- Aucun signal clinique n'est activé (`CLINICAL_SIGNAL_REGISTRY` :
  `enabled: false` sur toutes les entrées).
- Aucun diagnostic ni recommandation automatique n'est produit par ce
  modèle de données à ce stade.
