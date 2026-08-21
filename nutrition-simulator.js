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
   nutrition-audit.js) — ce fichier lui-même ne fait toujours rien
   d'autre que chaîner les modules sur des données déjà chargées.

   EXCEPTION SANCTIONNÉE le 2026-08-21 : dashboard.html charge désormais
   ce fichier (et le reste du moteur) pour afficher, UNIQUEMENT si
   profiles.role==='admin' et sur le propre journal de l'admin connecté,
   une modale bêta identique au style existant (showMilestoneCelebration).
   Voir checkAdminNutritionBetaAlert() dans dashboard.html. Ce n'est
   toujours PAS un déploiement patient — aucune règle n'atteint le statut
   "active", aucune écriture Supabase, le blocage MDR/RGPD documenté
   dans docs/GOVERNANCE_QUESTIONS.md reste entier.
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

  // Aliments réellement repérés dans le journal (jamais recalculé par
  // trend-engine.js — extraction indépendante, voir nutrition-signal-
  // engine.js). Uniquement utilisé par les règles useKeywordSubstitution.
  var flaggedFoodNames = [];
  if (rule.useKeywordSubstitution && typeof extractFlaggedFoodNames === 'function') {
    flaggedFoodNames = extractFlaggedFoodNames({
      journalEntries: params.journalEntries,
      referenceDate: params.referenceDate,
      flagField: rule.flaggedFoodField,
      observationWindowDays: rule.flaggedFoodWindowDays
    });
  }

  var selection = (typeof selectFoodsForRule === 'function')
    ? selectFoodsForRule(rule, params.profile, foodLists, flaggedFoodNames)
    : selectCompatibleFoods(rule, params.profile, foodLists);

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
  var rendered = renderNutritionAdvice(template, selection.selected, flaggedFoodNames);

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
      flaggedFoodNames: flaggedFoodNames, matchedByKeyword: !!selection.matchedByKeyword,
      generatedBody: rendered.body, now: now
    })
  };
}

/* -----------------------------------------------------------------------
   runNutritionSimulationForAllRules({ journalEntries, referenceDate,
                                        profile, mode, now })

   Évalue TOUTES les règles de NUTRITION_RULE_REGISTRY pour un même
   profil/journal, ne garde que les résultats éligibles, et les trie par
   priorité d'affichage via nutrition-priority-engine.js (jamais une
   priorité clinique — uniquement un ordre d'affichage entre plusieurs
   constats déjà validés indépendamment).

   Ne remplace pas runNutritionSimulation() : chaque règle est toujours
   évaluée séparément, jamais fusionnée (section "Conflit de règles"
   déjà couverte par les tests existants).
   ----------------------------------------------------------------------- */
function runNutritionSimulationForAllRules(params) {
  params = params || {};
  var registry = (typeof NUTRITION_RULE_REGISTRY !== 'undefined') ? NUTRITION_RULE_REGISTRY : {};

  var eligibleResults = Object.keys(registry).reduce(function (acc, ruleId) {
    var result = runNutritionSimulation({
      ruleId: ruleId,
      journalEntries: params.journalEntries,
      referenceDate: params.referenceDate,
      profile: params.profile,
      mode: params.mode,
      now: params.now
    });
    if (result.eligible) {
      acc.push({ ruleId: ruleId, result: result });
    }
    return acc;
  }, []);

  if (typeof sortEligibleResultsByPriority === 'function') {
    return sortEligibleResultsByPriority(eligibleResults, params.profile);
  }
  return eligibleResults;
}
