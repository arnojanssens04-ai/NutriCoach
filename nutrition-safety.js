/* ──────────────────────────────────────────────────────────────────────
   nutrition-safety.js — Filtrage de SÉCURITÉ, bloquant et prioritaire —
   Cap Santé

   ⚠️ ÉTAPE ARCHITECTURALE CONFINÉE — voir avertissement complet en tête
   de nutrition-rule-engine.js.

   Ce module est volontairement ISOLÉ du reste du pipeline : il ne connaît
   ni le moteur de règles, ni le rendu, ni l'audit. Il reçoit un profil et
   répond à une question de sécurité, jamais plus. Aucun accès réseau,
   aucun accès DOM, aucune fonction impure.

   Règle non négociable : allergie/intolérance CONFIRMÉE OU NON VÉRIFIÉE
   bloquent toutes les deux — la prudence prime, jamais l'inverse (section
   7 et 10 de la spécification validée).
   ────────────────────────────────────────────────────────────────────── */

// Un profil est éligible au moteur automatisé seulement s'il l'indique
// explicitement (liste blanche, jamais une liste noire implicite) et
// s'il ne relève d'aucune catégorie exclue par défaut (grossesse/
// allaitement, mineur — section 13 de la spécification).
function isProfileEligibleForAutomatedAdvice(profile) {
  if (!profile) return { eligible: false, reason: 'profile_missing' };
  if (profile.eligibleForAutomatedAdvice !== true) return { eligible: false, reason: 'profile_not_whitelisted' };
  if (profile.isPregnantOrBreastfeeding === true) return { eligible: false, reason: 'pregnancy_or_breastfeeding' };
  if (typeof profile.age === 'number' && profile.age < 18) return { eligible: false, reason: 'minor' };
  return { eligible: true, reason: null };
}

// Un aliment est écarté dès qu'un de ses tags d'allergène correspond à
// une entrée d'allergie/intolérance du profil, CONFIRMÉE ou NON VÉRIFIÉE
// (status 'confirmed' ou 'to_verify') — seul 'denied' ne bloque pas.
function isFoodSafeForProfile(profile, foodItem) {
  var flagged = []
    .concat(profile && profile.allergies ? profile.allergies : [])
    .concat(profile && profile.intolerances ? profile.intolerances : [])
    .filter(function (entry) { return entry.status === 'confirmed' || entry.status === 'to_verify'; })
    .map(function (entry) { return entry.code; });

  var foodTags = (foodItem && foodItem.allergenTags) || [];
  return !foodTags.some(function (tag) { return flagged.indexOf(tag) !== -1; });
}

// Conflit clinique : bloque si un code de clinicalContext du profil
// (confirmé OU non vérifié) figure dans rule.conflictingClinicalCodes.
// Absence de cartographie explicite pour une règle => aucun blocage
// possible par cette fonction (mais la règle doit alors documenter
// pourquoi aucune contre-indication n'est connue, hors périmètre de ce
// fichier — c'est une responsabilité de rédaction de la règle).
function hasConflictingClinicalContext(profile, rule) {
  var codes = (rule && rule.conflictingClinicalCodes) || [];
  if (codes.length === 0) return false;
  var patientCodes = (profile && profile.clinicalContext ? profile.clinicalContext : [])
    .filter(function (entry) { return entry.status === 'confirmed' || entry.status === 'to_verify'; })
    .map(function (entry) { return entry.code; });
  return patientCodes.some(function (code) { return codes.indexOf(code) !== -1; });
}

// Symptôme déclaré dans la fenêtre d'observation sur un domaine
// potentiellement lié à la règle — ici, aucune cartographie symptôme
// n'existe pour la règle de démonstration (relatedSymptomCodes vide),
// donc cette fonction ne bloque jamais pour cette règle précise. La
// structure existe pour toute règle future qui en aurait besoin.
function hasRelevantDeclaredSymptom(profile, rule) {
  var codes = (rule && rule.relatedSymptomCodes) || [];
  if (codes.length === 0) return false;
  var patientSymptomCodes = (profile && profile.symptoms ? profile.symptoms : []).map(function (s) { return s.symptomType; });
  return patientSymptomCodes.some(function (code) { return codes.indexOf(code) !== -1; });
}
