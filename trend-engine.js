/* ──────────────────────────────────────────────────────────────────────
   trend-engine.js — Moteur de calcul des tendances — Cap Santé

   Fonctions pures uniquement. Ce fichier :
   - ne fait jamais sb.from(...), ne charge aucun script Supabase ;
   - ne lit jamais de donnée réelle lui-même — il reçoit journalEntries
     déjà chargé par l'appelant, en paramètre ;
   - ne touche jamais au DOM, à trend-card-component.html ni à
     conseils.html ;
   - ne modifie jamais TREND_DEFINITION_REGISTRY (trend-definitions.js),
     il le lit seulement ;
   - ne contient aucun diagnostic, conseil ou recommandation — uniquement
     des comptages descriptifs et les textes déjà validés du registre.

   Entrée : computeTrendResult(definitionId, journalEntries, referenceDate)
   Sortie : un objet strictement conforme au contrat TrendCardResult déjà
   consommé par trend-card-component.html (voir son commentaire d'en-tête
   pour le détail des champs).

   Actuellement implémenté uniquement pour :
   - repeated_ultra_processed_foods
   Toute autre définition du registre (enabled: false aujourd'hui) est
   traitée par le chemin générique 'not_evaluated', sans calcul spécifique
   tant qu'aucune logique dédiée n'a été validée séparément pour elle.
   ────────────────────────────────────────────────────────────────────── */

/* -----------------------------------------------------------------------
   Seuils de confiance — propres à ce moteur, définis ici et nulle part
   ailleurs (aucune dépendance vers un registre de motifs distinct).
   ----------------------------------------------------------------------- */
var TREND_ENGINE_CONFIDENCE_THRESHOLDS = {
  minEvaluatedDaysForKnownConfidence: 2,
  minAnalyzableDaysForHigh: 6,
  minRateForModerate: 0.5,
  minRateForHigh: 0.8
};

function isValidIsoDate(value) {
  return typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value);
}

function addDaysIso(isoDate, deltaDays) {
  var parts = isoDate.split('-').map(Number);
  var d = new Date(Date.UTC(parts[0], parts[1] - 1, parts[2]));
  d.setUTCDate(d.getUTCDate() + deltaDays);
  var y = d.getUTCFullYear();
  var m = String(d.getUTCMonth() + 1).padStart(2, '0');
  var day = String(d.getUTCDate()).padStart(2, '0');
  return y + '-' + m + '-' + day;
}

/* -----------------------------------------------------------------------
   Fenêtre glissante de calendarDays jours, se terminant à referenceDate
   inclus. windowStart et windowEnd sont tous deux inclus dans la fenêtre.
   ----------------------------------------------------------------------- */
function buildDateWindow(referenceDate, calendarDays) {
  var windowEnd = referenceDate;
  var windowStart = addDaysIso(referenceDate, -(calendarDays - 1));
  var dates = [];
  for (var i = 0; i < calendarDays; i++) {
    dates.push(addDaysIso(windowStart, i));
  }
  return { windowStart: windowStart, windowEnd: windowEnd, dates: dates };
}

/* -----------------------------------------------------------------------
   Classification d'un jour pour repeated_ultra_processed_foods.
   'insufficient' dès qu'au moins une prise reconnue du jour a
   is_ultra_processed différent de true et de false — jamais déduit du
   nom de l'aliment. Sinon 'present' si au moins une prise est true,
   'absent' sinon.
   ----------------------------------------------------------------------- */
function classifyDayForRepeatedUltraProcessedFoods(dayEntries) {
  dayEntries = dayEntries || [];
  var hasUnknown = dayEntries.some(function (e) {
    return e.is_ultra_processed !== true && e.is_ultra_processed !== false;
  });
  if (hasUnknown) return 'insufficient';
  var hasTrue = dayEntries.some(function (e) { return e.is_ultra_processed === true; });
  return hasTrue ? 'present' : 'absent';
}

/* -----------------------------------------------------------------------
   Résultat d'erreur minimal — utilisé uniquement pour un appel invalide
   (definitionId inconnu, journalEntries pas un tableau, referenceDate mal
   formée). Jamais utilisé pour une erreur réseau : ce moteur n'accède à
   aucun réseau.
   ----------------------------------------------------------------------- */
function buildErrorResult(definitionId, label) {
  return {
    patternId: definitionId || null,
    label: label || '',
    state: 'error',
    referenceDate: null,
    windowStart: null,
    windowEnd: null,
    calendarDays: 0,
    analyzableDays: 0,
    coverageRate: 0,
    occurrenceDays: 0,
    evaluatedDays: 0,
    occurrenceRate: 0,
    confidence: 'unknown',
    insufficientDays: [],
    isConfirmed: false,
    observationMessage: null,
    insufficientDataMessage: null
  };
}

/* -----------------------------------------------------------------------
   Résultat 'not_evaluated' — définition désactivée dans le registre, ou
   pas encore implémentée dans ce moteur.
   ----------------------------------------------------------------------- */
function buildNotEvaluatedResult(def, referenceDate, windowStart, windowEnd) {
  return {
    patternId: def.id,
    label: def.label,
    state: 'not_evaluated',
    referenceDate: referenceDate,
    windowStart: windowStart,
    windowEnd: windowEnd,
    calendarDays: def.observationWindowDays,
    analyzableDays: 0,
    coverageRate: 0,
    occurrenceDays: 0,
    evaluatedDays: 0,
    occurrenceRate: 0,
    confidence: 'unknown',
    insufficientDays: [],
    isConfirmed: false,
    observationMessage: null,
    insufficientDataMessage: null
  };
}

/* -----------------------------------------------------------------------
   La confiance mesure la fiabilité du résultat obtenu, pas uniquement la
   fréquence de présence. Pour un état 'absent' (occurrenceRate toujours
   égal à 0 par définition), c'est le TAUX DE NON-OCCURRENCE (1) qui doit
   être comparé aux seuils — sinon une absence totale et bien couverte
   (ex. 7/7 jours évalués, jamais présent) serait à tort classée en
   confiance basse.
   ----------------------------------------------------------------------- */
function computeConfidence(evaluatedDays, occurrenceRate, state) {
  var t = TREND_ENGINE_CONFIDENCE_THRESHOLDS;
  if (evaluatedDays < t.minEvaluatedDaysForKnownConfidence) return 'unknown';
  var effectiveRate = state === 'absent' ? 1 : occurrenceRate;
  if (effectiveRate >= t.minRateForHigh && evaluatedDays >= t.minAnalyzableDaysForHigh) return 'high';
  if (effectiveRate >= t.minRateForModerate) return 'moderate';
  return 'low';
}

/* -----------------------------------------------------------------------
   Point d'entrée. definitionId doit exister dans TREND_DEFINITION_REGISTRY
   (fourni par trend-definitions.js, non modifié ici, lu uniquement).
   ----------------------------------------------------------------------- */
function computeTrendResult(definitionId, journalEntries, referenceDate) {
  var def = (typeof TREND_DEFINITION_REGISTRY !== 'undefined') ? TREND_DEFINITION_REGISTRY[definitionId] : undefined;

  if (!def) {
    return buildErrorResult(definitionId, '');
  }
  if (!Array.isArray(journalEntries) || !isValidIsoDate(referenceDate)) {
    return buildErrorResult(definitionId, def.label);
  }

  var dateWindow = buildDateWindow(referenceDate, def.observationWindowDays);

  if (!def.enabled) {
    return buildNotEvaluatedResult(def, referenceDate, dateWindow.windowStart, dateWindow.windowEnd);
  }

  if (definitionId !== 'repeated_ultra_processed_foods') {
    // Aucune logique de calcul implémentée pour cette définition à ce
    // stade, même si elle est activée dans le registre — traité comme
    // non évalué plutôt que de fabriquer un résultat non validé.
    return buildNotEvaluatedResult(def, referenceDate, dateWindow.windowStart, dateWindow.windowEnd);
  }

  var byDate = {};
  journalEntries.forEach(function (e) {
    if (!byDate[e.date]) byDate[e.date] = [];
    byDate[e.date].push(e);
  });

  var analyzableDays = 0;
  var insufficientDays = [];
  var occurrenceDays = 0;
  var evaluatedDays = 0;

  dateWindow.dates.forEach(function (date) {
    var dayEntries = byDate[date];
    if (!dayEntries || dayEntries.length === 0) return; // jour sans donnée, non analysable
    analyzableDays++;
    var classification = classifyDayForRepeatedUltraProcessedFoods(dayEntries);
    if (classification === 'insufficient') {
      insufficientDays.push({ date: date, reason: 'Classification inconnue pour une prise alimentaire de ce jour.' });
      return;
    }
    evaluatedDays++;
    if (classification === 'present') occurrenceDays++;
  });

  var coverageRate = def.observationWindowDays > 0 ? analyzableDays / def.observationWindowDays : 0;
  var occurrenceRate = evaluatedDays > 0 ? occurrenceDays / evaluatedDays : 0;

  var state;
  if (evaluatedDays === 0) {
    state = 'insufficient';
  } else if (occurrenceDays === 0) {
    state = 'absent';
  } else {
    state = 'present';
  }

  var confidence = computeConfidence(evaluatedDays, occurrenceRate, state);

  return {
    patternId: def.id,
    label: def.label,
    state: state,
    referenceDate: referenceDate,
    windowStart: dateWindow.windowStart,
    windowEnd: dateWindow.windowEnd,
    calendarDays: def.observationWindowDays,
    analyzableDays: analyzableDays,
    coverageRate: coverageRate,
    occurrenceDays: occurrenceDays,
    evaluatedDays: evaluatedDays,
    occurrenceRate: occurrenceRate,
    confidence: confidence,
    insufficientDays: insufficientDays,
    isConfirmed: false,
    observationMessage: state === 'insufficient' ? null : def.neutralMessage,
    insufficientDataMessage: state === 'insufficient' ? def.insufficientDataMessage : null
  };
}
