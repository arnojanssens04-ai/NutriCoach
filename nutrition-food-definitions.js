/* ──────────────────────────────────────────────────────────────────────
   nutrition-food-definitions.js — Aliments PRÉ-VALIDÉS pour le moteur de
   conseils alimentaires personnalisés — Cap Santé

   ⚠️ ÉTAPE ARCHITECTURALE CONFINÉE. Voir l'avertissement complet en tête
   de nutrition-rule-engine.js — il s'applique à ce fichier également :
   aucune donnée ici n'est jamais visible par un patient, aucune décision
   réglementaire (DM/MDR, article 22 RGPD) n'a été tranchée.

   Ce fichier ne contient que des DONNÉES STATIQUES, jamais de logique.
   Chaque aliment porte des tags d'allergènes (pour le filtrage de
   sécurité, nutrition-safety.js) et de compatibilité de régime (pour
   nutrition-food-selector.js). Ces tags sont saisis et validés
   humainement — jamais déduits automatiquement d'une base externe.
   ────────────────────────────────────────────────────────────────────── */

var NUTRITION_FOOD_LISTS = {
  staple_whole_foods_v1: {
    id: 'staple_whole_foods_v1',
    label: 'Aliments bruts de référence (v1)',
    status: 'active',
    items: [
      { code: 'oats', label: 'Flocons d\'avoine', allergenTags: ['gluten'], dietTags: ['vegetarian', 'vegan'] },
      { code: 'lentils', label: 'Lentilles', allergenTags: [], dietTags: ['vegetarian', 'vegan', 'gluten_free'] },
      { code: 'plain_yogurt', label: 'Yaourt nature', allergenTags: ['milk'], dietTags: ['vegetarian', 'gluten_free'] },
      { code: 'almonds', label: 'Amandes', allergenTags: ['nuts'], dietTags: ['vegetarian', 'vegan', 'gluten_free'] },
      { code: 'chicken_breast', label: 'Blanc de poulet', allergenTags: [], dietTags: ['gluten_free'] },
      { code: 'apple', label: 'Pomme', allergenTags: [], dietTags: ['vegetarian', 'vegan', 'gluten_free'] },
      { code: 'chickpeas', label: 'Pois chiches', allergenTags: [], dietTags: ['vegetarian', 'vegan', 'gluten_free'] },
      { code: 'eggs', label: 'Œufs', allergenTags: ['egg'], dietTags: ['vegetarian', 'gluten_free'] }
    ]
  }
};
