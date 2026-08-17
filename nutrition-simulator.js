/* ──────────────────────────────────────────────────────────────────────
   nutrition-simulator.js — Orchestrateur de simulation admin uniquement —
   Cap Santé

   ⚠️ ÉTAPE ARCHITECTURALE CONFINÉE — voir avertissement complet en tête
   de nutrition-rule-engine.js.

   Ce fichier chaîne les modules du moteur (règle → sécurité → sélection
   → rendu → audit) sur des données déjà chargées, fournies par
   l'appelant. Il ne fait JAMAIS sb.from(...) lui-même, ne recalcule
   jamais une observation (délègue à computeTrendResult, trend-engine.js,
   inchangé), et ne construit AUCUNE page HTML — l'intégration à une
   interface admin (nouvelle page ou section) est une étape ultérieure
   séparée, non commencée ici.

   Résultat toujours annoté visibility: 'admin_simulator_only' (via
   nutrition-audit.js) — il n'existe aucun chemin de code dans ce fichier
   qui achemine un résultat vers dashboard.html ou vers un patient.
   ────────────────────────────────────────────────────────────────────── */

/* -----------------------------------------------------------------------
   runNutritionSimulation({ ruleId, journalEntries, referenceDate,
                             profile, mode, now })

   mode: 'simulation' (profil fictif ou explicitement sélectionné par un
   admin) ou 'shadow' (données autorisées, jamais affichées) — les deux
   seuls modes reconnus à ce stade ; toute autre valeur bloque.

   Retourne toujours un objet { eligible, blockReason, advice, audit } —
   ne lève jamais d'exception (fail-safe : erreur technique => blocage).
   ----------------------------------------------------------------------- */
function runNutritionSimulation(params) {
  params = params || {};
  var mode = params.mode;
  var now = params.now || null;

  if (mode !== 'simulation' && mode !== 'shadow') {
    return {
      eligible: false,
      blockReason: 'invalid_mode',
      advice: null,
      audit: buildAuditRecord({ mode: mode, ruleId: params.ruleId, eligible: false, blockReason: 'invalid_mode', now: now })
    };
  }

  var rule = (typeof NUTRITION_RULE_REGISTRY !== 'undefined') ? NUTRITION_RULE_REGISTRY[params.ruleId] : undefined;
  if (!rule) {
    return {
      eligible: false,
      blockReason: 'rule_missing',
      advice: null,
      audit: buildAuditRecord({ mode: mode, ruleId: params.ruleId, eligible: false, blockReason: 'rule_missing', now: now })
    };
  }

  // Adaptateur — réutilise trend-engine.js tel quel pour les motifs qu'il
  // sait calculer, jamais dupliqué ni remplacé. Pour les signaux
  // nutriment/alcool ajoutés séparément (nutrition-signal-engine.js, non
  // connus de trend-engine.js/trend-definitions.js, non modifiés), on
  // délègue à NUTRITION_SIGNAL_RESOLVERS — même contrat de sortie, jamais
  // de fusion des deux sources. Toute erreur de calcul d'observation est
  // traitée comme un résultat 'error', donc gérée naturellement par
  // evaluateNutritionRule.
  var trendResult;
  try {
    if (typeof NUTRITION_SIGNAL_RESOLVERS !== 'undefined' && NUTRITION_SIGNAL_RESOLVERS[rule.triggerPatternId]) {
      trendResult = NUTRITION_SIGNAL_RESOLVERS[rule.triggerPatternId](params.journalEntries, params.referenceDate);
    } else {
      trendResult = computeTrendResult(rule.triggerPatternId, params.journalEntries, params.referenceDate);
    }
  } catch (e) {
    trendResult = null;
  }

  var evaluation = evaluateNutritionRule(rule, trendResult, params.profile);

  if (!evaluation.eligible) {
    return {
      eligible: false,
      blockReason: evaluation.blockReason,
      advice: null,
      audit: buildAuditRecord({
        mode: mode, ruleId: rule.id, ruleVersion: rule.version, patternId: rule.triggerPatternId,
        observationSnapshot: trendResult, profileId: params.profile && params.profile.patientId,
        eligible: false, blockReason: evaluation.blockReason, now: now
      })
    };
  }

  var foodLists = (typeof NUTRITION_FOOD_LISTS !== 'undefined') ? NUTRITION_FOOD_LISTS : {};
  var selection = selectCompatibleFoods(rule, params.profile, foodLists);

  if (selection.blockReason) {
    return {
      eligible: false,
      blockReason: selection.blockReason,
      advice: null,
      audit: buildAuditRecord({
        mode: mode, ruleId: rule.id, ruleVersion: rule.version, patternId: rule.triggerPatternId,
        observationSnapshot: trendResult, profileId: params.profile && params.profile.patientId,
        eligible: false, blockReason: selection.blockReason, now: now
      })
    };
  }

  var templates = (typeof NUTRITION_ADVICE_TEMPLATES !== 'undefined') ? NUTRITION_ADVICE_TEMPLATES : {};
  var template = templates[rule.templateId];
  var rendered = renderNutritionAdvice(template, selection.selected);

  if (rendered.blockReason) {
    return {
      eligible: false,
      blockReason: rendered.blockReason,
      advice: null,
      audit: buildAuditRecord({
        mode: mode, ruleId: rule.id, ruleVersion: rule.version, patternId: rule.triggerPatternId,
        observationSnapshot: trendResult, profileId: params.profile && params.profile.patientId,
        eligible: false, blockReason: rendered.blockReason, now: now
      })
    };
  }

  var selectedFoodCodes = selection.selected.map(function (f) { return f.code; });

  return {
    eligible: true,
    blockReason: null,
    advice: {
      body: rendered.body,
      visibility: 'admin_simulator_only',
      ruleId: rule.id,
      ruleVersion: rule.version
    },
    audit: buildAuditRecord({
      mode: mode, ruleId: rule.id, ruleVersion: rule.version, patternId: rule.triggerPatternId,
      observationSnapshot: trendResult, profileId: params.profile && params.profile.patientId,
      eligible: true, blockReason: null, selectedFoodCodes: selectedFoodCodes,
      generatedBody: rendered.body, now: now
    })
  };
}
