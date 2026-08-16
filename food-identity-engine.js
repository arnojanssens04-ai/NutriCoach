/* ──────────────────────────────────────────────────────────────────────
   food-identity-engine.js — Identité alimentaire DESCRIPTIVE — Cap Santé

   ⚠️ Prototype admin confiné (nutrition-observation-admin-prototype).
   Ce fichier ne fait jamais sb.from(...), aucun accès réseau, aucun accès
   DOM. Il ne produit jamais de préférence psychologique déduite, jamais
   de suggestion, jamais de conseil — uniquement des constats de
   récurrence, avec leurs preuves.

   Limite documentée : ce module ne doit pas être réutilisé comme entrée
   directe d'un moteur de conseil sans nouvelle revue explicite — il a
   été conçu uniquement pour l'affichage administratif descriptif.
   ────────────────────────────────────────────────────────────────────── */

var FOOD_IDENTITY_CONFIDENCE_THRESHOLDS = {
  minEvidenceForModerate: 2,
  minEvidenceForHigh: 4,
  minRateForHigh: 0.5
};

// Jamais 'high' avec moins de 2 occurrences — vérifié structurellement :
// 'high' exige evidenceCount >= minEvidenceForHigh (4), largement au-dessus
// du minimum de 2 occurrences déjà requis pour sortir de 'low'.
function confidenceForEvidence(evidenceCount, analyzableDays) {
  if (evidenceCount < FOOD_IDENTITY_CONFIDENCE_THRESHOLDS.minEvidenceForModerate) return 'low';
  var rate = analyzableDays > 0 ? evidenceCount / analyzableDays : 0;
  if (evidenceCount >= FOOD_IDENTITY_CONFIDENCE_THRESHOLDS.minEvidenceForHigh
    && rate >= FOOD_IDENTITY_CONFIDENCE_THRESHOLDS.minRateForHigh) {
    return 'high';
  }
  return 'moderate';
}

/* -----------------------------------------------------------------------
   buildFoodIdentity(journalEntries)

   Regroupe les entrées par couple (aliment, repas) et construit un habit
   descriptif par groupe, avec ses preuves (supportingEvents). Ne mute
   jamais journalEntries. Signale explicitement les données insuffisantes
   (moins de 4 jours analysables, seuil repris de la convention déjà
   utilisée ailleurs dans le projet — BASELINE_MIN_ANALYZABLE_DAYS).
   ----------------------------------------------------------------------- */
function buildFoodIdentity(journalEntries) {
  var entries = Array.isArray(journalEntries) ? journalEntries : [];

  var datesSeen = {};
  var groups = {};
  entries.forEach(function (e) {
    if (!e || typeof e.date !== 'string') return;
    datesSeen[e.date] = true;
    var key = String(e.aliment || '') + '|' + String(e.repas || '');
    if (!groups[key]) groups[key] = [];
    groups[key].push(e);
  });

  var analyzableDays = Object.keys(datesSeen).length;

  var habits = Object.keys(groups).map(function (key) {
    var events = groups[key];
    var parts = key.split('|');
    var dates = events.map(function (e) { return e.date; }).slice().sort();
    return {
      key: 'recurring_food_meal',
      value: { aliment: parts[0], repas: parts[1] },
      confidence: confidenceForEvidence(events.length, analyzableDays),
      evidenceCount: events.length,
      source: 'journal',
      firstObservedAt: dates[0],
      lastObservedAt: dates[dates.length - 1],
      supportingEvents: events.map(function (e) {
        return { date: e.date, repas: e.repas, aliment: e.aliment };
      })
    };
  });

  // Ordre stable : preuves les plus fortes d'abord, purement pour la
  // lisibilité de l'affichage admin — ne modifie aucune donnée.
  habits.sort(function (a, b) { return b.evidenceCount - a.evidenceCount; });

  return {
    habits: habits,
    period: {
      analyzableDays: analyzableDays,
      totalEntries: entries.length
    },
    insufficientData: analyzableDays < 4
  };
}
