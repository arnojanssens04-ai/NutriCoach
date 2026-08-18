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
  },

  // Règles ajoutées pour les signaux nutriment/alcool — mêmes conventions
  // et mêmes garde-fous que la règle de démonstration ci-dessus. Toutes
  // en 'shadow_active', jamais 'active'.
  increase_iron_sources_v1: {
    id: 'increase_iron_sources_v1',
    version: 1,
    status: 'shadow_active',
    triggerPatternId: 'low_source_presence_iron',
    requiredState: 'present',
    minConfidence: 'moderate',
    minCoverageRate: 0.7,
    eligibleFoodListId: 'iron_rich_foods_v1',
    maxSelectedFoods: 3,
    templateId: 'increase_iron_sources_v1',
    allowedDietTags: ['omnivore', 'vegetarian', 'vegan', 'gluten_free'],
    conflictingClinicalCodes: [],
    authoredBy: 'demo-spec',
    createdAt: '2026-08-17'
  },
  increase_calcium_sources_v1: {
    id: 'increase_calcium_sources_v1',
    version: 1,
    status: 'shadow_active',
    triggerPatternId: 'low_source_presence_calcium',
    requiredState: 'present',
    minConfidence: 'moderate',
    minCoverageRate: 0.7,
    eligibleFoodListId: 'calcium_rich_foods_v1',
    maxSelectedFoods: 3,
    templateId: 'increase_calcium_sources_v1',
    allowedDietTags: ['omnivore', 'vegetarian', 'vegan', 'gluten_free'],
    conflictingClinicalCodes: [],
    authoredBy: 'demo-spec',
    createdAt: '2026-08-17'
  },
  increase_fiber_sources_v1: {
    id: 'increase_fiber_sources_v1',
    version: 1,
    status: 'shadow_active',
    triggerPatternId: 'low_source_presence_fiber',
    requiredState: 'present',
    minConfidence: 'moderate',
    minCoverageRate: 0.7,
    eligibleFoodListId: 'fiber_rich_foods_v1',
    maxSelectedFoods: 3,
    templateId: 'increase_fiber_sources_v1',
    allowedDietTags: ['omnivore', 'vegetarian', 'vegan', 'gluten_free'],
    conflictingClinicalCodes: [],
    authoredBy: 'demo-spec',
    createdAt: '2026-08-17'
  },
  increase_omega3_sources_v1: {
    id: 'increase_omega3_sources_v1',
    version: 1,
    status: 'shadow_active',
    triggerPatternId: 'low_source_presence_omega3',
    requiredState: 'present',
    minConfidence: 'moderate',
    minCoverageRate: 0.7,
    eligibleFoodListId: 'omega3_rich_foods_v1',
    maxSelectedFoods: 3,
    templateId: 'increase_omega3_sources_v1',
    allowedDietTags: ['omnivore', 'vegetarian', 'vegan', 'gluten_free'],
    conflictingClinicalCodes: [],
    authoredBy: 'demo-spec',
    createdAt: '2026-08-17'
  },
  increase_magnesium_sources_v1: {
    id: 'increase_magnesium_sources_v1',
    version: 1,
    status: 'shadow_active',
    triggerPatternId: 'low_source_presence_magnesium',
    requiredState: 'present',
    minConfidence: 'moderate',
    minCoverageRate: 0.7,
    eligibleFoodListId: 'magnesium_rich_foods_v1',
    maxSelectedFoods: 3,
    templateId: 'increase_magnesium_sources_v1',
    allowedDietTags: ['omnivore', 'vegetarian', 'vegan', 'gluten_free'],
    conflictingClinicalCodes: [],
    authoredBy: 'demo-spec',
    createdAt: '2026-08-18'
  },
  increase_zinc_sources_v1: {
    id: 'increase_zinc_sources_v1',
    version: 1,
    status: 'shadow_active',
    triggerPatternId: 'low_source_presence_zinc',
    requiredState: 'present',
    minConfidence: 'moderate',
    minCoverageRate: 0.7,
    eligibleFoodListId: 'zinc_rich_foods_v1',
    maxSelectedFoods: 3,
    templateId: 'increase_zinc_sources_v1',
    allowedDietTags: ['omnivore', 'vegetarian', 'vegan', 'gluten_free'],
    conflictingClinicalCodes: [],
    authoredBy: 'demo-spec',
    createdAt: '2026-08-18'
  },
  increase_vitamin_c_sources_v1: {
    id: 'increase_vitamin_c_sources_v1',
    version: 1,
    status: 'shadow_active',
    triggerPatternId: 'low_source_presence_vitamin_c',
    requiredState: 'present',
    minConfidence: 'moderate',
    minCoverageRate: 0.7,
    eligibleFoodListId: 'vitamin_c_rich_foods_v1',
    maxSelectedFoods: 3,
    templateId: 'increase_vitamin_c_sources_v1',
    allowedDietTags: ['omnivore', 'vegetarian', 'vegan', 'gluten_free'],
    conflictingClinicalCodes: [],
    authoredBy: 'demo-spec',
    createdAt: '2026-08-18'
  },
  increase_vitamin_d_sources_v1: {
    id: 'increase_vitamin_d_sources_v1',
    version: 1,
    status: 'shadow_active',
    triggerPatternId: 'low_source_presence_vitamin_d',
    requiredState: 'present',
    minConfidence: 'moderate',
    minCoverageRate: 0.7,
    eligibleFoodListId: 'vitamin_d_rich_foods_v1',
    maxSelectedFoods: 3,
    templateId: 'increase_vitamin_d_sources_v1',
    allowedDietTags: ['omnivore', 'vegetarian', 'vegan', 'gluten_free'],
    conflictingClinicalCodes: [],
    authoredBy: 'demo-spec',
    createdAt: '2026-08-18'
  },
  increase_potassium_sources_v1: {
    id: 'increase_potassium_sources_v1',
    version: 1,
    status: 'shadow_active',
    triggerPatternId: 'low_source_presence_potassium',
    requiredState: 'present',
    minConfidence: 'moderate',
    minCoverageRate: 0.7,
    eligibleFoodListId: 'potassium_rich_foods_v1',
    maxSelectedFoods: 3,
    templateId: 'increase_potassium_sources_v1',
    allowedDietTags: ['omnivore', 'vegetarian', 'vegan', 'gluten_free'],
    conflictingClinicalCodes: [],
    authoredBy: 'demo-spec',
    createdAt: '2026-08-18'
  },
  increase_vitamin_b12_sources_v1: {
    id: 'increase_vitamin_b12_sources_v1',
    version: 1,
    status: 'shadow_active',
    triggerPatternId: 'low_source_presence_vitamin_b12',
    requiredState: 'present',
    minConfidence: 'moderate',
    minCoverageRate: 0.7,
    eligibleFoodListId: 'vitamin_b12_rich_foods_v1',
    maxSelectedFoods: 3,
    templateId: 'increase_vitamin_b12_sources_v1',
    allowedDietTags: ['omnivore', 'vegetarian', 'vegan', 'gluten_free'],
    conflictingClinicalCodes: [],
    authoredBy: 'demo-spec',
    createdAt: '2026-08-18'
  },
  reduce_added_sugar_v1: {
    id: 'reduce_added_sugar_v1',
    version: 1,
    status: 'shadow_active',
    triggerPatternId: 'repeated_added_sugar_presence',
    requiredState: 'present',
    minConfidence: 'moderate',
    minCoverageRate: 0.7,
    eligibleFoodListId: 'reduced_sugar_alternatives_v1',
    maxSelectedFoods: 3,
    templateId: 'reduce_added_sugar_v1',
    allowedDietTags: ['omnivore', 'vegetarian', 'vegan', 'gluten_free'],
    conflictingClinicalCodes: [],
    authoredBy: 'demo-spec',
    createdAt: '2026-08-18'
  },
  reduce_alcohol_v1: {
    id: 'reduce_alcohol_v1',
    version: 1,
    status: 'shadow_active',
    triggerPatternId: 'repeated_alcohol_presence',
    requiredState: 'present',
    minConfidence: 'moderate',
    minCoverageRate: 0.7,
    eligibleFoodListId: 'alcohol_free_alternatives_v1',
    maxSelectedFoods: 3,
    templateId: 'reduce_alcohol_v1',
    allowedDietTags: ['omnivore', 'vegetarian', 'vegan', 'gluten_free'],
    // Aucune contre-indication cartographiée pour cette règle de
    // démonstration — structure prête pour une future revue clinique
    // (ex. grossesse déjà exclue en amont par isProfileEligibleForAutomatedAdvice).
    conflictingClinicalCodes: [],
    authoredBy: 'demo-spec',
    createdAt: '2026-08-17'
  }
};
