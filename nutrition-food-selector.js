/* ──────────────────────────────────────────────────────────────────────
   nutrition-food-selector.js — Sélection d'aliments compatibles —
   Cap Santé

   ⚠️ ÉTAPE ARCHITECTURALE CONFINÉE — voir avertissement complet en tête
   de nutrition-rule-engine.js.

   Ne sélectionne JAMAIS un aliment hors de la liste pré-validée
   référencée par la règle (nutrition-food-definitions.js). Aucune
   suggestion improvisée, aucun calcul de similarité automatique.
   ────────────────────────────────────────────────────────────────────── */

function dietCompatible(profileDiet, foodItem) {
  if (!profileDiet) return true; // aucun régime déclaré = aucune restriction de ce type
  var tags = (foodItem && foodItem.dietTags) || [];
  return tags.indexOf(profileDiet) !== -1;
}

/* -----------------------------------------------------------------------
   selectCompatibleFoods(rule, profile, foodLists)

   foodLists = NUTRITION_FOOD_LISTS (injecté, jamais lu depuis une
   variable globale implicite — testable en isolation).

   Retourne { selected: FoodItem[], blockReason: string|null }. Bloque
   explicitement (jamais un résultat vide silencieux) si aucun aliment
   compatible ne reste après filtrage sécurité + régime.
   ----------------------------------------------------------------------- */
function selectCompatibleFoods(rule, profile, foodLists) {
  var list = foodLists && rule ? foodLists[rule.eligibleFoodListId] : null;
  if (!list || !Array.isArray(list.items)) {
    return { selected: [], blockReason: 'food_list_missing' };
  }

  var compatible = list.items.filter(function (item) {
    return isFoodSafeForProfile(profile, item) && dietCompatible(profile && profile.diet, item);
  });

  if (compatible.length === 0) {
    return { selected: [], blockReason: 'no_compatible_food' };
  }

  var max = (rule && typeof rule.maxSelectedFoods === 'number') ? rule.maxSelectedFoods : compatible.length;
  return { selected: compatible.slice(0, max), blockReason: null };
}

/* -----------------------------------------------------------------------
   selectFoodsForRule(rule, profile, foodLists, flaggedFoodNames)

   Point d'entrée unique utilisé par nutrition-simulator.js. Pour les
   règles marquées useKeywordSubstitution (voir
   nutrition-ultra-processed-substitutions.js), tente d'abord une
   correspondance ciblée par mot-clé sur les aliments réellement repérés
   dans le journal ; si aucune correspondance n'a été trouvée pour aucun
   d'entre eux, retombe sur selectCompatibleFoods() (liste générique) —
   jamais un résultat vide silencieux là où le mécanisme générique aurait
   pu en fournir un. Pour toute autre règle, appelle directement
   selectCompatibleFoods() sans changement de comportement.
   ----------------------------------------------------------------------- */
function selectFoodsForRule(rule, profile, foodLists, flaggedFoodNames) {
  if (rule && rule.useKeywordSubstitution && typeof selectUltraProcessedKeywordAlternatives === 'function') {
    var keywordMatches = selectUltraProcessedKeywordAlternatives(flaggedFoodNames, profile);
    if (keywordMatches.length > 0) {
      var max = (rule && typeof rule.maxSelectedFoods === 'number') ? rule.maxSelectedFoods : keywordMatches.length;
      return { selected: keywordMatches.slice(0, max), blockReason: null, matchedByKeyword: true };
    }
  }
  var fallback = selectCompatibleFoods(rule, profile, foodLists);
  fallback.matchedByKeyword = false;
  return fallback;
}
