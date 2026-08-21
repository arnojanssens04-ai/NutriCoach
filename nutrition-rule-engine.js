/* ──────────────────────────────────────────────────────────────────────
   nutrition-rule-engine.js — Évaluation d'une règle nutritionnelle —
   Cap Santé

   ══════════════════════════════════════════════════════════════════════
   ⚠️ AVERTISSEMENT ARCHITECTURAL — LIRE AVANT TOUTE ÉVOLUTION

   Ce module fait partie d'une architecture CONFINÉE, construite en mode
   admin uniquement (simulation / shadow), suite à une décision explicite
   de reporter — PAS de trancher — les questions réglementaires et
   produit suivantes, documentées en détail dans la spécification validée
   du 2026-08-17 :
   - qualification possible en dispositif médical (MDR 2017/745, UE) ;
   - application de l'article 22 RGPD (décision individuelle automatisée
     produisant des effets significatifs sur la personne) ;
   - chaîne de responsabilité professionnelle en cas de préjudice ;
   - politique de rétention des données d'audit.

   TANT QUE CES POINTS NE SONT PAS TRANCHÉS EXPLICITEMENT PAR UNE
   DÉCISION PRODUIT ET, le cas échéant, UN AVIS JURIDIQUE :
   - aucun conseil généré ici n'est jamais montré à un patient (seule
     exception sanctionnée le 2026-08-21 : une modale bêta admin-only
     dans dashboard.html, visible uniquement par profiles.role==='admin'
     sur son propre journal — voir checkAdminNutritionBetaAlert()) ;
   - aucune table Supabase n'existe pour ce moteur (rien n'est persisté
     au-delà de la mémoire du processus qui exécute une simulation) ;
   - aucun statut de règle 'active' (production) n'est reconnu par ce
     moteur — voir le refus explicite ci-dessous.
   ══════════════════════════════════════════════════════════════════════

   Ce fichier ne fait jamais sb.from(...), ne charge aucun script
   Supabase, ne touche jamais au DOM. Il ne recalcule jamais une
   observation lui-même — il reçoit un TrendCardResult déjà produit par
   trend-engine.js (adaptateur, jamais dupliqué).
   ────────────────────────────────────────────────────────────────────── */

var NUTRITION_CONFIDENCE_ORDER = { unknown: 0, low: 1, moderate: 2, high: 3 };

function confidenceMeetsThreshold(actual, minimum) {
  var a = NUTRITION_CONFIDENCE_ORDER[actual];
  var m = NUTRITION_CONFIDENCE_ORDER[minimum];
  if (a === undefined || m === undefined) return false;
  return a >= m;
}

/* -----------------------------------------------------------------------
   evaluateNutritionRule(rule, trendResult, profile)

   Retourne toujours { eligible: boolean, blockReason: string|null }.
   Ne lève jamais d'exception sur une entrée malformée — un profil ou un
   résultat invalide produit un blocage explicite ('technical_failure'),
   jamais un passage silencieux (échec fail-safe, section 20 de la spec).
   ----------------------------------------------------------------------- */
function evaluateNutritionRule(rule, trendResult, profile) {
  try {
    if (!rule || typeof rule !== 'object') {
      return { eligible: false, blockReason: 'rule_missing' };
    }

    // Refus explicite et permanent de tout statut 'active' à cette étape
    // — voir avertissement ci-dessus. Ce n'est pas un oubli : c'est
    // volontaire, pour que l'architecture ne puisse pas "glisser" vers la
    // production sans un changement de code délibéré et revu.
    if (rule.status === 'active') {
      return { eligible: false, blockReason: 'production_status_not_supported_at_this_stage' };
    }
    if (rule.status !== 'shadow_active') {
      return { eligible: false, blockReason: 'rule_not_active' };
    }

    if (!trendResult || typeof trendResult !== 'object') {
      return { eligible: false, blockReason: 'technical_failure' };
    }

    // Observation insuffisante ou non exploitable : blocage systématique,
    // jamais de génération sur une base incertaine (contrainte absolue).
    if (trendResult.state === 'insufficient' || trendResult.state === 'not_evaluated' || trendResult.state === 'error') {
      return { eligible: false, blockReason: 'observation_insufficient' };
    }

    if (trendResult.patternId !== rule.triggerPatternId || trendResult.state !== rule.requiredState) {
      return { eligible: false, blockReason: 'trigger_not_met' };
    }

    if (!confidenceMeetsThreshold(trendResult.confidence, rule.minConfidence)) {
      return { eligible: false, blockReason: 'confidence_below_threshold' };
    }

    if (typeof trendResult.coverageRate !== 'number' || trendResult.coverageRate < rule.minCoverageRate) {
      return { eligible: false, blockReason: 'coverage_below_threshold' };
    }

    var eligibility = isProfileEligibleForAutomatedAdvice(profile);
    if (!eligibility.eligible) {
      return { eligible: false, blockReason: 'profile_out_of_scope:' + eligibility.reason };
    }

    if (hasConflictingClinicalContext(profile, rule)) {
      return { eligible: false, blockReason: 'clinical_conflict' };
    }

    if (hasRelevantDeclaredSymptom(profile, rule)) {
      return { eligible: false, blockReason: 'relevant_symptom_declared' };
    }

    if (profile && profile.diet && rule.allowedDietTags && rule.allowedDietTags.indexOf(profile.diet) === -1) {
      return { eligible: false, blockReason: 'diet_not_supported_by_rule' };
    }

    return { eligible: true, blockReason: null };
  } catch (e) {
    // Fail-safe : toute erreur technique inattendue bloque, ne génère
    // jamais par défaut.
    return { eligible: false, blockReason: 'technical_failure' };
  }
}
