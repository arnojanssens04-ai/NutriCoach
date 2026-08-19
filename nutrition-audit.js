/* ──────────────────────────────────────────────────────────────────────
   nutrition-audit.js — Trace d'audit EN MÉMOIRE — Cap Santé

   ⚠️ ÉTAPE ARCHITECTURALE CONFINÉE — voir avertissement complet en tête
   de nutrition-rule-engine.js.

   Ce module ne persiste RIEN : aucune table Supabase n'existe pour ce
   moteur à ce stade (aucune migration créée, par contrainte explicite).
   Il ne fait que construire un objet de trace structuré, retourné à
   l'appelant (nutrition-simulator.js) — la persistance éventuelle est
   une décision future séparée, non prise ici.
   ────────────────────────────────────────────────────────────────────── */

/* -----------------------------------------------------------------------
   buildAuditRecord(...) — construit un enregistrement d'audit unique et
   complet pour UNE exécution de simulation, qu'elle soit bloquée ou
   qu'elle ait produit un conseil. now est injecté (jamais new Date()
   interne), pour rester déterministe et testable.
   ----------------------------------------------------------------------- */
function buildAuditRecord(params) {
  params = params || {};
  return {
    mode: params.mode || null, // 'simulation' | 'shadow' — jamais 'production' à ce stade
    ruleId: params.ruleId || null,
    ruleVersion: params.ruleVersion != null ? params.ruleVersion : null,
    patternId: params.patternId || null,
    observationSnapshot: params.observationSnapshot || null,
    profileId: params.profileId || null,
    eligible: !!params.eligible,
    blockReason: params.blockReason || null,
    selectedFoodCodes: Array.isArray(params.selectedFoodCodes) ? params.selectedFoodCodes : [],
    generatedBody: params.generatedBody || null,
    visibility: 'admin_simulator_only', // valeur fixe — aucun autre chemin de visibilité n'existe dans ce module
    occurredAt: params.now || null
  };
}
