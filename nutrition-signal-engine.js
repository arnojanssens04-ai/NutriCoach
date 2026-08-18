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
    return computeNutrientSourceRarity({
      patternId: 'low_source_presence_iron',
      label: 'Sources alimentaires de fer peu présentes',
      nutrientCode: 'iron',
      observationWindowDays: 7,
      neutralMessage: 'Les sources alimentaires de fer apparaissent peu souvent dans les repas enregistrés sur la période analysée.',
      insufficientDataMessage: 'Les données disponibles ne permettent pas d\'évaluer ce signal pour la période analysée.',
      journalEntries: journalEntries, referenceDate: referenceDate
    });
  },
  low_source_presence_calcium: function (journalEntries, referenceDate) {
    return computeNutrientSourceRarity({
      patternId: 'low_source_presence_calcium',
      label: 'Sources alimentaires de calcium peu présentes',
      nutrientCode: 'calcium',
      observationWindowDays: 7,
      neutralMessage: 'Les sources alimentaires de calcium apparaissent peu souvent dans les repas enregistrés sur la période analysée.',
      insufficientDataMessage: 'Les données disponibles ne permettent pas d\'évaluer ce signal pour la période analysée.',
      journalEntries: journalEntries, referenceDate: referenceDate
    });
  },
  low_source_presence_fiber: function (journalEntries, referenceDate) {
    return computeNutrientSourceRarity({
      patternId: 'low_source_presence_fiber',
      label: 'Sources alimentaires de fibres peu présentes',
      nutrientCode: 'fiber',
      observationWindowDays: 7,
      neutralMessage: 'Les sources alimentaires de fibres apparaissent peu souvent dans les repas enregistrés sur la période analysée.',
      insufficientDataMessage: 'Les données disponibles ne permettent pas d\'évaluer ce signal pour la période analysée.',
      journalEntries: journalEntries, referenceDate: referenceDate
    });
  },
  low_source_presence_omega3: function (journalEntries, referenceDate) {
    return computeNutrientSourceRarity({
      patternId: 'low_source_presence_omega3',
      label: 'Sources alimentaires d\'oméga-3 peu présentes',
      nutrientCode: 'omega3',
      observationWindowDays: 7,
      neutralMessage: 'Les sources alimentaires d\'oméga-3 apparaissent peu souvent dans les repas enregistrés sur la période analysée.',
      insufficientDataMessage: 'Les données disponibles ne permettent pas d\'évaluer ce signal pour la période analysée.',
      journalEntries: journalEntries, referenceDate: referenceDate
    });
  },
  low_source_presence_magnesium: function (journalEntries, referenceDate) {
    return computeNutrientSourceRarity({
      patternId: 'low_source_presence_magnesium',
      label: 'Sources alimentaires de magnésium peu présentes',
      nutrientCode: 'magnesium',
      observationWindowDays: 7,
      neutralMessage: 'Les sources alimentaires de magnésium apparaissent peu souvent dans les repas enregistrés sur la période analysée.',
      insufficientDataMessage: 'Les données disponibles ne permettent pas d\'évaluer ce signal pour la période analysée.',
      journalEntries: journalEntries, referenceDate: referenceDate
    });
  },
  low_source_presence_zinc: function (journalEntries, referenceDate) {
    return computeNutrientSourceRarity({
      patternId: 'low_source_presence_zinc',
      label: 'Sources alimentaires de zinc peu présentes',
      nutrientCode: 'zinc',
      observationWindowDays: 7,
      neutralMessage: 'Les sources alimentaires de zinc apparaissent peu souvent dans les repas enregistrés sur la période analysée.',
      insufficientDataMessage: 'Les données disponibles ne permettent pas d\'évaluer ce signal pour la période analysée.',
      journalEntries: journalEntries, referenceDate: referenceDate
    });
  }
};
