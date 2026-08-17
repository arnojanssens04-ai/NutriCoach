/* ──────────────────────────────────────────────────────────────────────
   nutrition-rule-definitions.js — Registre de RÈGLES nutritionnelles
   déclaratives — Cap Santé

   ⚠️ ÉTAPE ARCHITECTURALE CONFINÉE — voir avertissement complet en tête
   de nutrition-rule-engine.js. Ce registre reste en mode simulation/shadow
   admin uniquement ; aucun statut 'active' de production n'existe à ce
   stade (voir NUTRITION_RULE_STATUSES ci-dessous).

   Une règle n'est JAMAIS du code exécuté dynamiquement — uniquement une
   structure de données déclarative, comparée par nutrition-rule-engine.js
   via des opérateurs prédéfinis (égalité, seuil numérique, appartenance).
   Aucun eval(), aucun new Function(), aucune expression libre.

   Toute activation/désactivation est un changement de `status` fait
   manuellement dans ce fichier (donc tracé par l'historique Git), jamais
   une bascule silencieuse en base de données à ce stade (aucune table
   Supabase créée pour ce moteur).
   ────────────────────────────────────────────────────────────────────── */

// Statuts valides. 'active' (production, patient) n'existe pas encore
// comme valeur utilisable par le moteur à cette étape — voir
// nutrition-rule-engine.js, qui refuse explicitement toute règle dont le
// statut serait 'active'.
var NUTRITION_RULE_STATUSES = ['draft', 'shadow_active', 'deactivated', 'retired'];

var NUTRITION_RULE_REGISTRY = {
  reduce_ultra_processed_foods_v1: {
    id: 'reduce_ultra_processed_foods_v1',
    version: 1,
    status: 'shadow_active',

    // Déclencheur — référence une observation déjà calculée par
    // trend-engine.js, jamais recalculée ici.
    triggerPatternId: 'repeated_ultra_processed_foods',
    requiredState: 'present',

    // Seuils obligatoires (section 5 de la spécification validée).
    minConfidence: 'moderate', // 'unknown' < 'low' < 'moderate' < 'high'
    minCoverageRate: 0.7,

    // Sélection alimentaire — jamais improvisée.
    eligibleFoodListId: 'staple_whole_foods_v1',
    maxSelectedFoods: 3,

    // Gabarit de formulation validé.
    templateId: 'reduce_ultra_processed_v1',

    // Compatibilités de régime pour lesquelles cette règle peut
    // s'appliquer (le filtrage aliment par aliment reste dans
    // nutrition-food-selector.js — ceci ne fait qu'autoriser la règle
    // elle-même pour ces régimes).
    allowedDietTags: ['omnivore', 'vegetarian', 'vegan', 'gluten_free'],

    // Codes de contexte clinique confirmé connus comme incompatibles
    // avec cette règle précise — vide ici (aucune contre-indication
    // connue documentée pour cette règle de démonstration), mais la
    // structure existe et DOIT être remplie pour toute règle future
    // touchant un domaine à risque clinique documenté.
    conflictingClinicalCodes: [],

    authoredBy: 'demo-spec',
    createdAt: '2026-08-17'
  }
};
