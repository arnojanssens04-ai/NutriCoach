/* ──────────────────────────────────────────────────────────────────────
   meal-pattern-detector.js — Détection des repas récurrents (aliments
   associés dans un même créneau) — Cap Santé

   Chantier SÉPARÉ du moteur confiné nutrition-*.js (jamais chargé,
   jamais référencé, jamais modifié par ce fichier). Ne fait ni réseau,
   ni DOM, ni IA, ni persistance — fonctions pures sur un tableau
   `journalEntries` déjà chargé par l'appelant.

   Ne conclut JAMAIS qu'un apport est suffisant ou insuffisant — ce
   module décrit uniquement CE QUI EST OBSERVÉ (quels aliments reviennent
   ensemble, à quelle fréquence), jamais un jugement nutritionnel.
   ────────────────────────────────────────────────────────────────────── */

function isValidIsoDateMealPattern(value) {
  return typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value);
}

function addDaysIsoMealPattern(isoDate, deltaDays) {
  var parts = isoDate.split('-').map(Number);
  var d = new Date(Date.UTC(parts[0], parts[1] - 1, parts[2]));
  d.setUTCDate(d.getUTCDate() + deltaDays);
  var y = d.getUTCFullYear();
  var m = String(d.getUTCMonth() + 1).padStart(2, '0');
  var day = String(d.getUTCDate()).padStart(2, '0');
  return y + '-' + m + '-' + day;
}

function buildDateWindowMealPattern(referenceDate, calendarDays) {
  var windowEnd = referenceDate;
  var windowStart = addDaysIsoMealPattern(referenceDate, -(calendarDays - 1));
  var dates = [];
  for (var i = 0; i < calendarDays; i++) dates.push(addDaysIsoMealPattern(windowStart, i));
  return { windowStart: windowStart, windowEnd: windowEnd, dates: dates };
}

// Confiance descriptive — mêmes seuils conceptuels que le reste du
// projet (jamais une confiance clinique), dupliqués ici volontairement
// pour rester un chantier isolé, sans dépendance au moteur confiné.
var MEAL_PATTERN_CONFIDENCE_THRESHOLDS = {
  minAnalyzableDaysForKnown: 2,
  minAnalyzableDaysForHigh: 5,
  minRateForModerate: 0.5,
  minRateForHigh: 0.75
};

function mealPatternConfidence(analyzableDays, occurrenceRate) {
  var t = MEAL_PATTERN_CONFIDENCE_THRESHOLDS;
  if (analyzableDays < t.minAnalyzableDaysForKnown) return 'unknown';
  if (occurrenceRate >= t.minRateForHigh && analyzableDays >= t.minAnalyzableDaysForHigh) return 'high';
  if (occurrenceRate >= t.minRateForModerate) return 'moderate';
  return 'low';
}

/* -----------------------------------------------------------------------
   detectMealPatterns(params)

   params: { journalEntries, referenceDate, observationWindowDays (déf. 7),
             minFoodFrequency (déf. 3, nombre de jours minimum pour
             qu'un aliment soit considéré comme faisant partie de la
             composition habituelle d'un créneau) }

   Retourne un tableau de meal_pattern, un par mealType (`repas`) ayant
   au moins un aliment récurrent — jamais un mealType sans aliment
   récurrent (pas de pattern "vide").

   Contrat de chaque meal_pattern :
   { mealPatternId, mealType, sourceWindow: {start, end}, occurrenceCount,
     analyzableDays, confidence, foods: [{name, frequency, role,
     averageQuantity}], roleCodes, evidence: [{date, foods}] }
   ----------------------------------------------------------------------- */
function detectMealPatterns(params) {
  params = params || {};
  var journalEntries = params.journalEntries;
  var referenceDate = params.referenceDate;
  var observationWindowDays = typeof params.observationWindowDays === 'number' ? params.observationWindowDays : 7;
  var minFoodFrequency = typeof params.minFoodFrequency === 'number' ? params.minFoodFrequency : 3;

  if (!Array.isArray(journalEntries) || !isValidIsoDateMealPattern(referenceDate)) return [];

  var dateWindow = buildDateWindowMealPattern(referenceDate, observationWindowDays);
  var windowSet = {};
  dateWindow.dates.forEach(function (d) { windowSet[d] = true; });

  // Regroupement par mealType, puis par date — jamais deux fois la même
  // entrée, jamais une date hors fenêtre.
  var byMealType = {};
  journalEntries.forEach(function (e) {
    if (!e || !e.repas || !windowSet[e.date] || !e.aliment) return;
    if (!byMealType[e.repas]) byMealType[e.repas] = {};
    if (!byMealType[e.repas][e.date]) byMealType[e.repas][e.date] = [];
    byMealType[e.repas][e.date].push(e);
  });

  var patterns = [];

  Object.keys(byMealType).forEach(function (mealType) {
    var byDate = byMealType[mealType];
    var analyzableDays = Object.keys(byDate).length;

    // Fréquence par aliment normalisé — un aliment compte une fois par
    // jour où il apparaît dans ce créneau, jamais une fois par entrée
    // (évite de gonfler artificiellement la fréquence si un aliment est
    // scindé en plusieurs lignes le même jour).
    var foodDays = {}; // normalizedName -> Set(dates) simulé par objet
    var foodLabel = {}; // normalizedName -> dernier nom original vu
    var foodQuantities = {}; // normalizedName -> [quantite,...] (valeurs numériques connues uniquement)

    Object.keys(byDate).forEach(function (date) {
      var seenToday = {};
      byDate[date].forEach(function (e) {
        var norm = normalizeMealFoodName(e.aliment);
        if (!norm) return;
        if (!seenToday[norm]) {
          seenToday[norm] = true;
          if (!foodDays[norm]) foodDays[norm] = {};
          foodDays[norm][date] = true;
        }
        foodLabel[norm] = e.aliment;
        if (typeof e.quantite === 'number') {
          if (!foodQuantities[norm]) foodQuantities[norm] = [];
          foodQuantities[norm].push(e.quantite);
        }
      });
    });

    var foods = Object.keys(foodDays)
      .map(function (norm) {
        var frequency = Object.keys(foodDays[norm]).length;
        var qty = foodQuantities[norm];
        var averageQuantity = qty && qty.length ? (qty.reduce(function (a, b) { return a + b; }, 0) / qty.length) : null;
        return {
          name: foodLabel[norm],
          normalizedName: norm,
          frequency: frequency,
          role: matchMealFoodRole(foodLabel[norm]),
          averageQuantity: averageQuantity
        };
      })
      .filter(function (f) { return f.frequency >= minFoodFrequency; })
      .sort(function (a, b) { return b.frequency - a.frequency; });

    if (foods.length === 0) return; // pas de composition récurrente pour ce créneau — aucun pattern émis

    var occurrenceCount = Math.max.apply(null, foods.map(function (f) { return f.frequency; }));
    var occurrenceRate = analyzableDays > 0 ? occurrenceCount / analyzableDays : 0;
    var confidence = mealPatternConfidence(analyzableDays, occurrenceRate);

    var roleCodes = [];
    foods.forEach(function (f) {
      if (f.role && roleCodes.indexOf(f.role) === -1) roleCodes.push(f.role);
    });

    // Preuve : une entrée par jour où AU MOINS UN des aliments récurrents
    // a été observé dans ce créneau — traçabilité, jamais une inférence.
    var recurringNormNames = foods.map(function (f) { return f.normalizedName; });
    var evidence = Object.keys(byDate)
      .filter(function (date) {
        return recurringNormNames.some(function (n) { return foodDays[n] && foodDays[n][date]; });
      })
      .sort()
      .map(function (date) {
        var foodsThatDay = recurringNormNames.filter(function (n) { return foodDays[n] && foodDays[n][date]; })
          .map(function (n) { return foodLabel[n]; });
        return { date: date, foods: foodsThatDay };
      });

    patterns.push({
      mealPatternId: mealType + '_' + dateWindow.windowStart,
      mealType: mealType,
      sourceWindow: { start: dateWindow.windowStart, end: dateWindow.windowEnd },
      occurrenceCount: occurrenceCount,
      analyzableDays: analyzableDays,
      confidence: confidence,
      foods: foods.map(function (f) {
        return { name: f.name, frequency: f.frequency, role: f.role, averageQuantity: f.averageQuantity };
      }),
      roleCodes: roleCodes,
      evidence: evidence
    });
  });

  // Ordre déterministe (mealType alphabétique) — jamais un ordre dépendant
  // de l'itération d'objet, qui n'est garanti que pour les clés dans
  // l'ordre d'insertion mais reste fragile à documenter explicitement.
  patterns.sort(function (a, b) { return a.mealType < b.mealType ? -1 : a.mealType > b.mealType ? 1 : 0; });

  return patterns;
}
