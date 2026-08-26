/* ──────────────────────────────────────────────────────────────────────
   nutrition-signal-engine.js — Moteur de signaux DESCRIPTIFS additionnels
   (nutriments, alcool) — Cap Santé

   ⚠️ ÉTAPE ARCHITECTURALE CONFINÉE — voir avertissement complet en tête
   de nutrition-rule-engine.js. S'applique intégralement ici.

   Pourquoi un fichier séparé plutôt qu'une extension de trend-engine.js :
   trend-engine.js n'implémente le calcul QUE pour 'repeated_ultra_
   processed_foods' (toute autre définition retourne 'not_evaluated', par
   contrainte documentée dans son propre en-tête), et trend-engine.js /
   trend-definitions.js restent explicitement non modifiés dans ce
   chantier. Ce module reproduit les mêmes conventions statistiques
   (analyzableDays, evaluatedDays, occurrenceRate, coverageRate,
   confidence) pour rester un remplacement compatible du contrat consommé
   par nutrition-rule-engine.js, sans toucher aux deux fichiers cités.

   Fonctions pures uniquement. Ne fait jamais sb.from(...), aucun accès
   réseau, aucun accès DOM. Ne lit jamais de donnée réelle — reçoit
   journalEntries déjà chargé par l'appelant.

   ⚠️ Champs consommés ici (`is_alcohol`, `nutrient_sources`) N'EXISTENT
   PAS dans la table `journal` réelle (vérifié : seuls date, repas,
   aliment, quantite, kcal, is_ultra_processed y sont enregistrés). Ce
   module ne fonctionne donc, à ce stade, que sur des données fictives où
   ces champs sont injectés manuellement pour la simulation — jamais sur
   un vrai journal tant qu'aucune classification fiable de ces champs
   n'existe (décision produit séparée, non prise ici).
   ────────────────────────────────────────────────────────────────────── */

var NUTRITION_SIGNAL_CONFIDENCE_THRESHOLDS = {
  minEvaluatedDaysForKnownConfidence: 2,
  minAnalyzableDaysForHigh: 6,
  minRateForModerate: 0.5,
  minRateForHigh: 0.8
};

function nutritionSignalConfidence(evaluatedDays, effectiveRate) {
  var t = NUTRITION_SIGNAL_CONFIDENCE_THRESHOLDS;
  if (evaluatedDays < t.minEvaluatedDaysForKnownConfidence) return 'unknown';
  if (effectiveRate >= t.minRateForHigh && evaluatedDays >= t.minAnalyzableDaysForHigh) return 'high';
  if (effectiveRate >= t.minRateForModerate) return 'moderate';
  return 'low';
}

function isValidIsoDateSignal(value) {
  return typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value);
}

function addDaysIsoSignal(isoDate, deltaDays) {
  var parts = isoDate.split('-').map(Number);
  var d = new Date(Date.UTC(parts[0], parts[1] - 1, parts[2]));
  d.setUTCDate(d.getUTCDate() + deltaDays);
  var y = d.getUTCFullYear();
  var m = String(d.getUTCMonth() + 1).padStart(2, '0');
  var day = String(d.getUTCDate()).padStart(2, '0');
  return y + '-' + m + '-' + day;
}

function buildDateWindowSignal(referenceDate, calendarDays) {
  var windowEnd = referenceDate;
  var windowStart = addDaysIsoSignal(referenceDate, -(calendarDays - 1));
  var dates = [];
  for (var i = 0; i < calendarDays; i++) dates.push(addDaysIsoSignal(windowStart, i));
  return { windowStart: windowStart, windowEnd: windowEnd, dates: dates };
}

function buildSignalErrorResult(patternId, label) {
  return {
    patternId: patternId || null, label: label || '', state: 'error',
    referenceDate: null, windowStart: null, windowEnd: null, calendarDays: 0,
    analyzableDays: 0, coverageRate: 0, occurrenceDays: 0, evaluatedDays: 0,
    occurrenceRate: 0, confidence: 'unknown', insufficientDays: [], isConfirmed: false,
    observationMessage: null, insufficientDataMessage: null
  };
}

/* -----------------------------------------------------------------------
   computeBooleanFlagSignal(patternId, label, flagField, observationWindowDays,
                             minimumAnalyzableDays, neutralMessage,
                             insufficientDataMessage, journalEntries, referenceDate)

   Généralise la logique déjà validée pour repeated_ultra_processed_foods
   à n'importe quel champ booléen du journal (ici : is_alcohol). 'present'
   = le champ vaut true au moins une fois sur au moins un jour analysable.
   ----------------------------------------------------------------------- */
function computeBooleanFlagSignal(params) {
  var journalEntries = params.journalEntries;
  var referenceDate = params.referenceDate;

  if (!Array.isArray(journalEntries) || !isValidIsoDateSignal(referenceDate)) {
    return buildSignalErrorResult(params.patternId, params.label);
  }

  var dateWindow = buildDateWindowSignal(referenceDate, params.observationWindowDays);
  var byDate = {};
  journalEntries.forEach(function (e) {
    if (!byDate[e.date]) byDate[e.date] = [];
    byDate[e.date].push(e);
  });

  var analyzableDays = 0, insufficientDays = [], occurrenceDays = 0, evaluatedDays = 0;

  dateWindow.dates.forEach(function (date) {
    var dayEntries = byDate[date];
    if (!dayEntries || dayEntries.length === 0) return;
    analyzableDays++;
    var hasUnknown = dayEntries.some(function (e) { return e[params.flagField] !== true && e[params.flagField] !== false; });
    if (hasUnknown) {
      insufficientDays.push({ date: date, reason: 'Classification inconnue pour une prise alimentaire de ce jour.' });
      return;
    }
    evaluatedDays++;
    if (dayEntries.some(function (e) { return e[params.flagField] === true; })) occurrenceDays++;
  });

  var coverageRate = params.observationWindowDays > 0 ? analyzableDays / params.observationWindowDays : 0;
  var occurrenceRate = evaluatedDays > 0 ? occurrenceDays / evaluatedDays : 0;

  var state;
  if (evaluatedDays === 0) state = 'insufficient';
  else if (occurrenceDays === 0) state = 'absent';
  else state = 'present';

  var effectiveRate = state === 'absent' ? 1 : occurrenceRate;
  var confidence = nutritionSignalConfidence(evaluatedDays, effectiveRate);

  return {
    patternId: params.patternId, label: params.label, state: state,
    referenceDate: referenceDate, windowStart: dateWindow.windowStart, windowEnd: dateWindow.windowEnd,
    calendarDays: params.observationWindowDays, analyzableDays: analyzableDays, coverageRate: coverageRate,
    occurrenceDays: occurrenceDays, evaluatedDays: evaluatedDays, occurrenceRate: occurrenceRate,
    confidence: confidence, insufficientDays: insufficientDays, isConfirmed: false,
    observationMessage: state === 'insufficient' ? null : params.neutralMessage,
    insufficientDataMessage: state === 'insufficient' ? params.insufficientDataMessage : null
  };
}

/* -----------------------------------------------------------------------
   computeNutrientSourceRarity(...)

   Signal INVERSÉ par rapport à computeBooleanFlagSignal : 'present' ici
   signifie que les sources du nutriment concerné apparaissent RAREMENT
   (occurrenceRate < rarityThreshold), jamais qu'une carence est établie —
   uniquement une rareté des SOURCES déclarées dans le journal.
   ----------------------------------------------------------------------- */
function computeNutrientSourceRarity(params) {
  var journalEntries = params.journalEntries;
  var referenceDate = params.referenceDate;
  var rarityThreshold = typeof params.rarityThreshold === 'number' ? params.rarityThreshold : 0.3;

  if (!Array.isArray(journalEntries) || !isValidIsoDateSignal(referenceDate)) {
    return buildSignalErrorResult(params.patternId, params.label);
  }

  var dateWindow = buildDateWindowSignal(referenceDate, params.observationWindowDays);
  var byDate = {};
  journalEntries.forEach(function (e) {
    if (!byDate[e.date]) byDate[e.date] = [];
    byDate[e.date].push(e);
  });

  var analyzableDays = 0, insufficientDays = [], occurrenceDays = 0, evaluatedDays = 0;

  dateWindow.dates.forEach(function (date) {
    var dayEntries = byDate[date];
    if (!dayEntries || dayEntries.length === 0) return;
    analyzableDays++;
    var hasUnknown = dayEntries.some(function (e) { return !Array.isArray(e.nutrient_sources); });
    if (hasUnknown) {
      insufficientDays.push({ date: date, reason: 'Classification des sources nutritionnelles inconnue pour ce jour.' });
      return;
    }
    evaluatedDays++;
    var hasSource = dayEntries.some(function (e) { return e.nutrient_sources.indexOf(params.nutrientCode) !== -1; });
    if (hasSource) occurrenceDays++;
  });

  var coverageRate = params.observationWindowDays > 0 ? analyzableDays / params.observationWindowDays : 0;
  var occurrenceRate = evaluatedDays > 0 ? occurrenceDays / evaluatedDays : 0;

  var state;
  if (evaluatedDays === 0) state = 'insufficient';
  else if (occurrenceRate < rarityThreshold) state = 'present'; // rareté confirmée = état déclencheur
  else state = 'absent'; // sources présentes assez souvent = pas de signal de rareté

  var effectiveRate = state === 'present' ? (1 - occurrenceRate) : occurrenceRate;
  var confidence = nutritionSignalConfidence(evaluatedDays, effectiveRate);

  return {
    patternId: params.patternId, label: params.label, state: state,
    referenceDate: referenceDate, windowStart: dateWindow.windowStart, windowEnd: dateWindow.windowEnd,
    calendarDays: params.observationWindowDays, analyzableDays: analyzableDays, coverageRate: coverageRate,
    occurrenceDays: occurrenceDays, evaluatedDays: evaluatedDays, occurrenceRate: occurrenceRate,
    confidence: confidence, insufficientDays: insufficientDays, isConfirmed: false,
    observationMessage: state === 'insufficient' ? null : params.neutralMessage,
    insufficientDataMessage: state === 'insufficient' ? params.insufficientDataMessage : null
  };
}

/* -----------------------------------------------------------------------
   NUTRIENT_DAILY_TARGETS_REFERENCE

   Repères journaliers de référence, réutilisés TELS QUELS depuis
   calcTargets() (dashboard.html, branche de repli "plan fixe" — valeurs
   génériques non personnalisées : o3:2.0, fer:14, cal:900, pot:3500,
   mg:300, zn:10, fibres:27), jamais inventés ici. dashboard.html n'est
   pas modifié — ces valeurs sont dupliquées à l'identique, à titre de
   référence générique pour la simulation.

   `protein_g` est une exception : dashboard.html ne calcule qu'un
   objectif protéiné personnalisé (poids × g/kg selon activité), sans
   valeur générique isolée. La valeur ci-dessous (56 g) correspond à un
   repère nutritionnel générique courant pour un adulte sédentaire
   (≈0,8 g/kg pour 70 kg) — pas une valeur applicative dupliquée, à
   traiter avec plus de prudence que les autres.

   Aucune cible n'existe dans le code applicatif pour la vitamine C, la
   vitamine D, la vitamine B12 ou l'hydratation — ces signaux restent
   sur le mécanisme de RARETÉ DES SOURCES (computeNutrientSourceRarity),
   pas de quantité vs référence, pour ne jamais inventer une valeur de
   repère non sourcée.
   ----------------------------------------------------------------------- */
var NUTRIENT_DAILY_TARGETS_REFERENCE = {
  iron_mg: 14,
  calcium_mg: 900,
  potassium_mg: 3500,
  magnesium_mg: 300,
  zinc_mg: 10,
  fiber_g: 27,
  omega3_g: 2.0,
  protein_g: 56
};

/* -----------------------------------------------------------------------
   computeNutrientIntakeVsTarget(params)

   Signal QUANTITATIF : somme la quantité de nutriment déclarée par jour
   (champ numérique du journal, ex. `iron_mg`), moyenne sur les jours
   évalués, et compare à une référence journalière générique. 'present'
   (état déclencheur) = apport moyen nettement inférieur à la référence
   (< insufficiencyRatio), de façon SOUTENUE sur la période — jamais un
   seul jour bas isolé, jamais une affirmation de carence : uniquement
   un écart par rapport à un repère générique non personnalisé.
   ----------------------------------------------------------------------- */
function computeNutrientIntakeVsTarget(params) {
  var journalEntries = params.journalEntries;
  var referenceDate = params.referenceDate;
  var insufficiencyRatio = typeof params.insufficiencyRatio === 'number' ? params.insufficiencyRatio : 0.6;

  if (!Array.isArray(journalEntries) || !isValidIsoDateSignal(referenceDate) || typeof params.dailyTarget !== 'number' || params.dailyTarget <= 0) {
    return buildSignalErrorResult(params.patternId, params.label);
  }

  var dateWindow = buildDateWindowSignal(referenceDate, params.observationWindowDays);
  var byDate = {};
  journalEntries.forEach(function (e) {
    if (!byDate[e.date]) byDate[e.date] = [];
    byDate[e.date].push(e);
  });

  var analyzableDays = 0, insufficientDays = [], evaluatedDays = 0, totalIntake = 0;

  dateWindow.dates.forEach(function (date) {
    var dayEntries = byDate[date];
    if (!dayEntries || dayEntries.length === 0) return;
    analyzableDays++;
    var hasUnknown = dayEntries.some(function (e) { return typeof e[params.nutrientField] !== 'number'; });
    if (hasUnknown) {
      insufficientDays.push({ date: date, reason: 'Quantité de nutriment inconnue pour une prise alimentaire de ce jour.' });
      return;
    }
    evaluatedDays++;
    var dayTotal = dayEntries.reduce(function (sum, e) { return sum + e[params.nutrientField]; }, 0);
    totalIntake += dayTotal;
  });

  var coverageRate = params.observationWindowDays > 0 ? analyzableDays / params.observationWindowDays : 0;
  var avgIntake = evaluatedDays > 0 ? totalIntake / evaluatedDays : 0;
  var ratioToTarget = avgIntake / params.dailyTarget;

  var state;
  if (evaluatedDays === 0) state = 'insufficient';
  else if (ratioToTarget < insufficiencyRatio) state = 'present'; // écart soutenu confirmé = état déclencheur
  else state = 'absent';

  var effectiveRate = state === 'present'
    ? Math.max(0, Math.min(1, 1 - ratioToTarget))
    : Math.max(0, Math.min(1, ratioToTarget));
  var confidence = nutritionSignalConfidence(evaluatedDays, effectiveRate);

  return {
    patternId: params.patternId, label: params.label, state: state,
    referenceDate: referenceDate, windowStart: dateWindow.windowStart, windowEnd: dateWindow.windowEnd,
    calendarDays: params.observationWindowDays, analyzableDays: analyzableDays, coverageRate: coverageRate,
    occurrenceDays: 0, evaluatedDays: evaluatedDays, occurrenceRate: ratioToTarget,
    confidence: confidence, insufficientDays: insufficientDays, isConfirmed: false,
    observationMessage: state === 'insufficient' ? null : params.neutralMessage,
    insufficientDataMessage: state === 'insufficient' ? params.insufficientDataMessage : null,
    // Champs additionnels, propres à ce type de signal quantitatif —
    // n'existent pas sur les signaux de rareté ; utiles pour l'affichage
    // et les tests, jamais utilisés pour une décision de sécurité.
    avgIntake: avgIntake,
    dailyTarget: params.dailyTarget,
    unit: params.unit || null
  };
}

/* -----------------------------------------------------------------------
   computeFoodVarietyRarity(journalEntries, referenceDate)

   Signal DESCRIPTIF distinct des nutriments : mesure la variété des
   ALIMENTS déclarés (pas leur teneur en nutriments), à partir du seul
   champ `aliment` déjà présent dans le vrai journal (aucun champ fictif
   supplémentaire nécessaire ici, contrairement aux autres signaux de ce
   fichier). 'present' = variété faible (peu d'aliments différents sur
   la période), jamais une affirmation de déséquilibre nutritionnel.
   ----------------------------------------------------------------------- */
function computeFoodVarietyRarity(journalEntries, referenceDate) {
  var entries = journalEntries;
  var varietyThreshold = 0.5;

  if (!Array.isArray(entries) || !isValidIsoDateSignal(referenceDate)) {
    return buildSignalErrorResult('low_food_variety', 'Variété alimentaire faible');
  }

  var dateWindow = buildDateWindowSignal(referenceDate, 7);
  var byDate = {};
  entries.forEach(function (e) {
    if (!byDate[e.date]) byDate[e.date] = [];
    byDate[e.date].push(e);
  });

  var analyzableDays = 0, evaluatedDays = 0, occurrenceDays = 0;
  var alimentsSeen = {};
  var totalEntriesInWindow = 0;

  dateWindow.dates.forEach(function (date) {
    var dayEntries = byDate[date];
    if (!dayEntries || dayEntries.length === 0) return;
    analyzableDays++;
    var hasUnknown = dayEntries.some(function (e) { return typeof e.aliment !== 'string' || !e.aliment; });
    if (hasUnknown) return; // jour non exploitable, ni compté evaluatedDays ni occurrenceDays
    evaluatedDays++;
    dayEntries.forEach(function (e) {
      alimentsSeen[e.aliment] = true;
      totalEntriesInWindow++;
    });
  });

  var uniqueCount = Object.keys(alimentsSeen).length;
  var varietyRate = totalEntriesInWindow > 0 ? uniqueCount / totalEntriesInWindow : 0;

  var state;
  if (evaluatedDays === 0) state = 'insufficient';
  else if (varietyRate < varietyThreshold) state = 'present'; // variété faible confirmée = état déclencheur
  else state = 'absent';

  var effectiveRate = state === 'present' ? (1 - varietyRate) : varietyRate;
  var confidence = nutritionSignalConfidence(evaluatedDays, effectiveRate);
  var coverageRate = 7 > 0 ? analyzableDays / 7 : 0;

  return {
    patternId: 'low_food_variety', label: 'Variété alimentaire faible', state: state,
    referenceDate: referenceDate, windowStart: dateWindow.windowStart, windowEnd: dateWindow.windowEnd,
    calendarDays: 7, analyzableDays: analyzableDays, coverageRate: coverageRate,
    occurrenceDays: occurrenceDays, evaluatedDays: evaluatedDays, occurrenceRate: varietyRate,
    confidence: confidence, insufficientDays: [], isConfirmed: false,
    observationMessage: state === 'insufficient' ? null : 'Un nombre restreint d\'aliments différents a été observé sur la période analysée, par rapport au nombre total d\'entrées enregistrées.',
    insufficientDataMessage: state === 'insufficient' ? 'Les données disponibles ne permettent pas d\'évaluer ce signal pour la période analysée.' : null
  };
}

/* -----------------------------------------------------------------------
   NUTRITION_SIGNAL_RESOLVERS — table de résolution patternId -> fonction
   (journalEntries, referenceDate) -> TrendCardResult-like. Consommée par
   nutrition-simulator.js, jamais par trend-engine.js.
   ----------------------------------------------------------------------- */
var NUTRITION_SIGNAL_RESOLVERS = {
  repeated_alcohol_presence: function (journalEntries, referenceDate) {
    return computeBooleanFlagSignal({
      patternId: 'repeated_alcohol_presence',
      label: 'Présence répétée d\'alcool',
      flagField: 'is_alcohol',
      observationWindowDays: 7,
      neutralMessage: 'Une présence répétée d\'alcool a été observée sur plusieurs journées de la période analysée.',
      insufficientDataMessage: 'Les données disponibles ne permettent pas d\'évaluer ce signal pour la période analysée.',
      journalEntries: journalEntries, referenceDate: referenceDate
    });
  },
  low_source_presence_iron: function (journalEntries, referenceDate) {
    return computeNutrientIntakeVsTarget({
      patternId: 'low_source_presence_iron',
      label: 'Apport en fer nettement inférieur à la référence',
      nutrientField: 'iron_mg',
      dailyTarget: NUTRIENT_DAILY_TARGETS_REFERENCE.iron_mg,
      unit: 'mg',
      observationWindowDays: 14,
      insufficiencyRatio: 0.5,
      neutralMessage: 'L\'apport moyen en fer sur la période analysée est nettement inférieur à une référence journalière générique.',
      insufficientDataMessage: 'Les données disponibles ne permettent pas d\'évaluer ce signal pour la période analysée.',
      journalEntries: journalEntries, referenceDate: referenceDate
    });
  },
  low_source_presence_calcium: function (journalEntries, referenceDate) {
    return computeNutrientIntakeVsTarget({
      patternId: 'low_source_presence_calcium',
      label: 'Apport en calcium nettement inférieur à la référence',
      nutrientField: 'calcium_mg',
      dailyTarget: NUTRIENT_DAILY_TARGETS_REFERENCE.calcium_mg,
      unit: 'mg',
      observationWindowDays: 14,
      insufficiencyRatio: 0.5,
      neutralMessage: 'L\'apport moyen en calcium sur la période analysée est nettement inférieur à une référence journalière générique.',
      insufficientDataMessage: 'Les données disponibles ne permettent pas d\'évaluer ce signal pour la période analysée.',
      journalEntries: journalEntries, referenceDate: referenceDate
    });
  },
  low_source_presence_fiber: function (journalEntries, referenceDate) {
    return computeNutrientIntakeVsTarget({
      patternId: 'low_source_presence_fiber',
      label: 'Apport en fibres nettement inférieur à la référence',
      nutrientField: 'fiber_g',
      dailyTarget: NUTRIENT_DAILY_TARGETS_REFERENCE.fiber_g,
      unit: 'g',
      observationWindowDays: 14,
      insufficiencyRatio: 0.5,
      neutralMessage: 'L\'apport moyen en fibres sur la période analysée est nettement inférieur à une référence journalière générique.',
      insufficientDataMessage: 'Les données disponibles ne permettent pas d\'évaluer ce signal pour la période analysée.',
      journalEntries: journalEntries, referenceDate: referenceDate
    });
  },
  low_source_presence_omega3: function (journalEntries, referenceDate) {
    return computeNutrientIntakeVsTarget({
      patternId: 'low_source_presence_omega3',
      label: 'Apport en oméga-3 nettement inférieur à la référence',
      nutrientField: 'omega3_g',
      dailyTarget: NUTRIENT_DAILY_TARGETS_REFERENCE.omega3_g,
      unit: 'g',
      observationWindowDays: 14,
      insufficiencyRatio: 0.5,
      neutralMessage: 'L\'apport moyen en oméga-3 sur la période analysée est nettement inférieur à une référence journalière générique.',
      insufficientDataMessage: 'Les données disponibles ne permettent pas d\'évaluer ce signal pour la période analysée.',
      journalEntries: journalEntries, referenceDate: referenceDate
    });
  },
  low_source_presence_magnesium: function (journalEntries, referenceDate) {
    return computeNutrientIntakeVsTarget({
      patternId: 'low_source_presence_magnesium',
      label: 'Apport en magnésium nettement inférieur à la référence',
      nutrientField: 'magnesium_mg',
      dailyTarget: NUTRIENT_DAILY_TARGETS_REFERENCE.magnesium_mg,
      unit: 'mg',
      observationWindowDays: 14,
      insufficiencyRatio: 0.5,
      neutralMessage: 'L\'apport moyen en magnésium sur la période analysée est nettement inférieur à une référence journalière générique.',
      insufficientDataMessage: 'Les données disponibles ne permettent pas d\'évaluer ce signal pour la période analysée.',
      journalEntries: journalEntries, referenceDate: referenceDate
    });
  },
  low_source_presence_zinc: function (journalEntries, referenceDate) {
    return computeNutrientIntakeVsTarget({
      patternId: 'low_source_presence_zinc',
      label: 'Apport en zinc nettement inférieur à la référence',
      nutrientField: 'zinc_mg',
      dailyTarget: NUTRIENT_DAILY_TARGETS_REFERENCE.zinc_mg,
      unit: 'mg',
      observationWindowDays: 14,
      insufficiencyRatio: 0.5,
      neutralMessage: 'L\'apport moyen en zinc sur la période analysée est nettement inférieur à une référence journalière générique.',
      insufficientDataMessage: 'Les données disponibles ne permettent pas d\'évaluer ce signal pour la période analysée.',
      journalEntries: journalEntries, referenceDate: referenceDate
    });
  },
  low_source_presence_vitamin_c: function (journalEntries, referenceDate) {
    return computeNutrientSourceRarity({
      patternId: 'low_source_presence_vitamin_c',
      label: 'Sources alimentaires de vitamine C peu présentes',
      nutrientCode: 'vitamin_c',
      observationWindowDays: 14,
      neutralMessage: 'Les sources alimentaires de vitamine C apparaissent peu souvent dans les repas enregistrés sur la période analysée.',
      insufficientDataMessage: 'Les données disponibles ne permettent pas d\'évaluer ce signal pour la période analysée.',
      journalEntries: journalEntries, referenceDate: referenceDate
    });
  },
  low_source_presence_vitamin_d: function (journalEntries, referenceDate) {
    return computeNutrientSourceRarity({
      patternId: 'low_source_presence_vitamin_d',
      label: 'Sources alimentaires de vitamine D peu présentes',
      nutrientCode: 'vitamin_d',
      observationWindowDays: 14,
      neutralMessage: 'Les sources alimentaires de vitamine D apparaissent peu souvent dans les repas enregistrés sur la période analysée.',
      insufficientDataMessage: 'Les données disponibles ne permettent pas d\'évaluer ce signal pour la période analysée.',
      journalEntries: journalEntries, referenceDate: referenceDate
    });
  },
  low_source_presence_potassium: function (journalEntries, referenceDate) {
    return computeNutrientIntakeVsTarget({
      patternId: 'low_source_presence_potassium',
      label: 'Apport en potassium nettement inférieur à la référence',
      nutrientField: 'potassium_mg',
      dailyTarget: NUTRIENT_DAILY_TARGETS_REFERENCE.potassium_mg,
      unit: 'mg',
      observationWindowDays: 14,
      insufficiencyRatio: 0.5,
      neutralMessage: 'L\'apport moyen en potassium sur la période analysée est nettement inférieur à une référence journalière générique.',
      insufficientDataMessage: 'Les données disponibles ne permettent pas d\'évaluer ce signal pour la période analysée.',
      journalEntries: journalEntries, referenceDate: referenceDate
    });
  },
  low_source_presence_vitamin_b12: function (journalEntries, referenceDate) {
    return computeNutrientSourceRarity({
      patternId: 'low_source_presence_vitamin_b12',
      label: 'Sources alimentaires de vitamine B12 peu présentes',
      nutrientCode: 'vitamin_b12',
      observationWindowDays: 14,
      neutralMessage: 'Les sources alimentaires de vitamine B12 apparaissent peu souvent dans les repas enregistrés sur la période analysée.',
      insufficientDataMessage: 'Les données disponibles ne permettent pas d\'évaluer ce signal pour la période analysée.',
      journalEntries: journalEntries, referenceDate: referenceDate
    });
  },
  low_source_presence_protein: function (journalEntries, referenceDate) {
    return computeNutrientIntakeVsTarget({
      patternId: 'low_source_presence_protein',
      label: 'Apport en protéines nettement inférieur à la référence',
      nutrientField: 'protein_g',
      dailyTarget: NUTRIENT_DAILY_TARGETS_REFERENCE.protein_g,
      unit: 'g',
      observationWindowDays: 14,
      insufficiencyRatio: 0.5,
      neutralMessage: 'L\'apport moyen en protéines sur la période analysée est nettement inférieur à une référence journalière générique.',
      insufficientDataMessage: 'Les données disponibles ne permettent pas d\'évaluer ce signal pour la période analysée.',
      journalEntries: journalEntries, referenceDate: referenceDate
    });
  },
  low_hydration_presence: function (journalEntries, referenceDate) {
    return computeNutrientSourceRarity({
      patternId: 'low_hydration_presence',
      label: 'Prises hydratantes peu présentes',
      nutrientCode: 'hydration',
      observationWindowDays: 7,
      neutralMessage: 'Les prises hydratantes déclarées (eau, infusions, etc.) apparaissent peu souvent dans le journal enregistré sur la période analysée.',
      insufficientDataMessage: 'Les données disponibles ne permettent pas d\'évaluer ce signal pour la période analysée.',
      journalEntries: journalEntries, referenceDate: referenceDate
    });
  },
  low_food_variety: function (journalEntries, referenceDate) {
    return computeFoodVarietyRarity(journalEntries, referenceDate);
  },
  repeated_added_sugar_presence: function (journalEntries, referenceDate) {
    return computeBooleanFlagSignal({
      patternId: 'repeated_added_sugar_presence',
      label: 'Présence répétée de sucre ajouté',
      flagField: 'is_added_sugar_rich',
      observationWindowDays: 7,
      neutralMessage: 'Une présence répétée d\'aliments riches en sucre ajouté a été observée sur plusieurs journées de la période analysée.',
      insufficientDataMessage: 'Les données disponibles ne permettent pas d\'évaluer ce signal pour la période analysée.',
      journalEntries: journalEntries, referenceDate: referenceDate
    });
  }
};

/* -----------------------------------------------------------------------
   extractFlaggedFoodNames(params)

   Fonction PURE, indépendante de trend-engine.js : relève les noms
   d'aliments (champ `aliment`, déjà présent dans le journal réel — voir
   dashboard.html, is_ultra_processed posé par le score NOVA au moment du
   scan) associés à un flag booléen vrai (ex. is_ultra_processed) sur la
   fenêtre d'observation. Ne déduit, n'invente ni ne complète aucun nom —
   ne restitue que ce qui est littéralement présent dans journalEntries.
   Dédoublonne par nom exact ; l'ordre de première apparition est
   conservé (déterministe, non trié par fréquence).
   ----------------------------------------------------------------------- */
function extractFlaggedFoodNames(params) {
  params = params || {};
  var journalEntries = params.journalEntries;
  var referenceDate = params.referenceDate;
  var flagField = params.flagField;
  var observationWindowDays = params.observationWindowDays;

  if (!Array.isArray(journalEntries) || !isValidIsoDateSignal(referenceDate) || !flagField || !observationWindowDays) {
    return [];
  }

  var dateWindow = buildDateWindowSignal(referenceDate, observationWindowDays);
  var windowSet = {};
  dateWindow.dates.forEach(function (d) { windowSet[d] = true; });

  var seen = {};
  var names = [];
  journalEntries.forEach(function (e) {
    if (!e || !windowSet[e.date]) return;
    if (e[flagField] !== true) return;
    if (!e.aliment) return;
    if (seen[e.aliment]) return;
    seen[e.aliment] = true;
    names.push(e.aliment);
  });
  return names;
}
