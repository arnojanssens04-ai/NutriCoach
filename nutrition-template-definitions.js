/* ──────────────────────────────────────────────────────────────────────
   nutrition-template-definitions.js — Gabarits de formulation VALIDÉS —
   Cap Santé

   ⚠️ ÉTAPE ARCHITECTURALE CONFINÉE — voir avertissement en tête de
   nutrition-rule-engine.js.

   Chaque gabarit est un texte figé avec UN SEUL emplacement autorisé
   ({{foods}}), jamais d'interpolation libre de champ non contrôlé.
   Formulation conditionnelle, non prescriptive, jamais de diagnostic de
   carence, jamais d'impératif — cohérent avec forbiddenMessages de
   trend-definitions.js.
   ────────────────────────────────────────────────────────────────────── */

var NUTRITION_ADVICE_TEMPLATES = {
  reduce_ultra_processed_v1: {
    id: 'reduce_ultra_processed_v1',
    status: 'active',
    // Placeholder unique : {{foods}}. Aucun autre champ interpolé.
    bodyTemplate: 'Une présence répétée d\'aliments ultra-transformés a été observée sur la période analysée. '
      + 'Parmi les aliments habituellement disponibles, {{foods}} pourraient être proposés en échange, '
      + 'à discuter avec un professionnel avant toute mise en œuvre.',
    allowedVariables: ['foods']
  }
};
