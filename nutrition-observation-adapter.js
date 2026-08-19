/* ──────────────────────────────────────────────────────────────────────
   nutrition-observation-adapter.js — Adaptateur PUR vers trend-engine.js —
   Cap Santé

   ⚠️ Prototype admin confiné (nutrition-observation-admin-prototype).
   Aucune décision réglementaire n'a été tranchée pour une évolution vers
   un conseil généré — ce fichier reste strictement descriptif.

   Ce fichier :
   - appelle computeTrendResult() (trend-engine.js) SANS le modifier ni
     le dupliquer, sans jamais recalculer une observation lui-même ;
   - ne mute jamais les entrées reçues ;
   - ne fait aucun accès réseau, aucun sb.from(...), aucun accès DOM ;
   - ne produit aucun champ recommendation/advice/suggestion.
   ────────────────────────────────────────────────────────────────────── */

/* -----------------------------------------------------------------------
   adaptTrendObservation(patternId, journalEntries, referenceDate)

   Retourne { error: null, patternId, state, period, occurrenceRate,
              analyzableDays, coverage, confidence, evidence, limitations }
   ou { error: '<code>' } si l'observation existante ne peut pas être
   adaptée — jamais d'exception levée, jamais de valeur inventée.
   ----------------------------------------------------------------------- */
function adaptTrendObservation(patternId, journalEntries, referenceDate) {
  if (typeof computeTrendResult !== 'function') {
    return { error: 'trend_engine_unavailable' };
  }

  var result;
  try {
    result = computeTrendResult(patternId, journalEntries, referenceDate);
  } catch (e) {
    return { error: 'adapter_failed' };
  }

  if (!result || typeof result !== 'object' || typeof result.state !== 'string') {
    return { error: 'observation_not_adaptable' };
  }

  return {
    error: null,
    patternId: result.patternId,
    state: result.state,
    period: {
      start: result.windowStart,
      end: result.windowEnd,
      calendarDays: result.calendarDays
    },
    occurrenceRate: result.occurrenceRate,
    analyzableDays: result.analyzableDays,
    coverage: result.coverageRate,
    confidence: result.confidence,
    evidence: {
      occurrenceDays: result.occurrenceDays,
      evaluatedDays: result.evaluatedDays,
      insufficientDays: result.insufficientDays
    },
    limitations: (result.state === 'insufficient' && result.insufficientDataMessage)
      ? [result.insufficientDataMessage]
      : []
  };
}
