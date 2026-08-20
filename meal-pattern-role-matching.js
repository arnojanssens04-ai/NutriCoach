/* ──────────────────────────────────────────────────────────────────────
   meal-pattern-role-matching.js — Comparaison déterministe d'aliments par
   famille, rôle nutritionnel et fonction de repas — Cap Santé

   Chantier SÉPARÉ du moteur confiné nutrition-*.js (jamais chargé,
   jamais référencé, jamais modifié par ce fichier). Module pur : pas de
   réseau, pas de DOM/window, pas de mutation des entrées, pas d'IA, pas
   de génération de texte destiné à un patient. Réutilise, s'ils sont
   chargés, normalizeMealFoodName()/matchMealFoodRole() de
   meal-food-roles.js (jamais modifié) ; sinon retombe sur un
   équivalent local pour rester utilisable de façon autonome.

   Ne conclut JAMAIS qu'un apport est suffisant ou insuffisant à partir
   d'une famille, d'un rôle ou d'une fonction — ce module répond
   uniquement à une question de RESSEMBLANCE entre deux aliments,
   jamais à une question nutritionnelle.
   ────────────────────────────────────────────────────────────────────── */

// Normalisation locale de repli — utilisée seulement si
// normalizeMealFoodName (meal-food-roles.js) n'est pas chargée, pour que
// ce fichier reste testable de façon autonome. Gère minuscules, accents,
// apostrophes (converties en espace), ponctuation, espaces multiples, et
// les fragments d'élision française isolés par la conversion de
// l'apostrophe (ex. "d'avoine" → "d avoine" → "avoine"), pour que
// "flocons d'avoine" et "flocons avoine" soient reconnus identiques.
// Aucun fuzzy matching probabiliste, aucune recherche externe.
var ROLE_MATCH_ELISION_FRAGMENTS = ['d', 'l', 'j', 'n', 'm', 'c', 's', 't', 'qu'];

// Étape 1 (accents/casse) : réutilise normalizeMealFoodName() si chargée
// (meal-food-roles.js) — elle ne fait que lowercase + retrait des
// accents, jamais l'apostrophe/ponctuation. Sinon, équivalent local.
function normalizeAccentsAndCase(name) {
  if (typeof normalizeMealFoodName === 'function') return normalizeMealFoodName(name);
  if (!name) return '';
  return String(name).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
}

// Étape 2 (toujours appliquée ici, que normalizeMealFoodName soit
// chargée ou non, pour un comportement identique dans les deux cas) :
// apostrophes/ponctuation → espace, tokenisation, retrait des fragments
// d'élision isolés (ex. "d'avoine" → "d avoine" → "avoine").
function normalizeForRoleMatch(name) {
  var base = normalizeAccentsAndCase(name);
  if (!base) return '';
  var cleaned = base.replace(/['’]/g, ' ').replace(/[^a-z0-9\s]/g, ' ');
  var tokens = cleaned.split(/\s+/).filter(Boolean).filter(function (tok) {
    return ROLE_MATCH_ELISION_FRAGMENTS.indexOf(tok) === -1;
  });
  return tokens.join(' ');
}

function roleForFood(name) {
  if (typeof matchMealFoodRole === 'function') return matchMealFoodRole(name);
  return null; // pas de duplication de la table de rôles ici (voir meal-food-roles.js)
}

/* -----------------------------------------------------------------------
   FOOD_FAMILY_DEFINITIONS

   Familles plus fines que les rôles de meal-food-roles.js — purement
   descriptif (regroupement de produits similaires), jamais un
   référentiel médical, jamais une déduction de composition
   nutritionnelle complète.
   ----------------------------------------------------------------------- */
var FOOD_FAMILY_DEFINITIONS = {
  yogurt_family: ['yaourt', 'yaourts', 'yogourt', 'yoghourt', 'skyr', 'fromage blanc'],
  milk_family: ['lait', 'boisson vegetale enrichie'],
  banana_family: ['banane', 'bananes'],
  citrus_family: ['orange', 'oranges', 'mandarine', 'clementine', 'pamplemousse', 'citron'],
  pome_family: ['pomme', 'pommes', 'poire', 'poires'],
  cereal_family: ['muesli', 'granola', 'flocon avoine', 'flocons avoine', 'avoine', 'cereale', 'cereales', 'cornflakes', 'corn flakes'],
  bread_family: ['pain', 'tartine', 'bagel', 'toast']
};

// Même garde que meal-food-roles.js / nutrition-ultra-processed-
// substitutions.js : un mot-clé d'un seul mot exige un TOKEN entier
// (jamais une sous-chaîne — évite ex. "ble" dans un autre mot), un
// mot-clé à plusieurs mots reste vérifié par sous-chaîne.
function isRoleMatchKeywordMatch(normalizedName, keyword) {
  var normalizedKeyword = normalizeForRoleMatch(keyword);
  if (normalizedKeyword.indexOf(' ') !== -1) return normalizedName.indexOf(normalizedKeyword) !== -1;
  var tokens = normalizedName.split(/\s+/).filter(Boolean);
  return tokens.indexOf(normalizedKeyword) !== -1;
}

/* -----------------------------------------------------------------------
   matchFoodFamily(foodName)

   Retourne la première famille dont un mot-clé correspond au nom de
   l'aliment, ou null si aucune ne correspond — jamais une famille par
   défaut arbitraire.
   ----------------------------------------------------------------------- */
function matchFoodFamily(foodName) {
  var n = normalizeForRoleMatch(foodName);
  if (!n) return null;
  var familyNames = Object.keys(FOOD_FAMILY_DEFINITIONS);
  for (var i = 0; i < familyNames.length; i++) {
    var keywords = FOOD_FAMILY_DEFINITIONS[familyNames[i]];
    for (var j = 0; j < keywords.length; j++) {
      if (isRoleMatchKeywordMatch(n, keywords[j])) return familyNames[i];
    }
  }
  return null;
}

/* -----------------------------------------------------------------------
   mealFunctionForRole(role)

   Regroupement fonctionnel plus large que le rôle — seulement pour les
   rôles explicitement mappés ci-dessous. Ne déduit jamais une fonction
   pour un rôle non listé : retourne 'unknown'.
   ----------------------------------------------------------------------- */
var MEAL_FUNCTION_BY_ROLE = {
  cereal_base: 'carbohydrate_base',
  cereal: 'carbohydrate_base',
  bread: 'carbohydrate_base',
  dairy: 'protein_or_dairy_source',
  protein: 'protein_or_dairy_source',
  fruit: 'fresh_produce',
  vegetable: 'fresh_produce'
};

function mealFunctionForRole(role) {
  if (!role) return 'unknown';
  return MEAL_FUNCTION_BY_ROLE[role] || 'unknown';
}

// Ordre de spécificité obligatoire — index le plus bas = relation la
// plus restrictive, utilisé à la fois pour la classification pairwise
// et pour retenir la relation la plus restrictive sur plusieurs
// aliments d'un même repas.
var FOOD_RELATION_PRIORITY = [
  'exact_same_food',
  'same_food_family',
  'same_nutrition_role',
  'same_meal_function',
  'unrelated',
  'unknown'
];

/* -----------------------------------------------------------------------
   classifyFoodRelation(candidateName, referenceName)

   Comparaison PURE entre deux aliments — jamais un accès à un repas,
   jamais un effet de bord. Retourne exactement une des 6 valeurs de
   FOOD_RELATION_PRIORITY, dans cet ordre de spécificité.
   ----------------------------------------------------------------------- */
function classifyFoodRelation(candidateName, referenceName) {
  if (!candidateName || !referenceName) return 'unknown';

  var normA = normalizeForRoleMatch(candidateName);
  var normB = normalizeForRoleMatch(referenceName);
  if (!normA || !normB) return 'unknown';
  if (normA === normB) return 'exact_same_food';

  var familyA = matchFoodFamily(candidateName);
  var familyB = matchFoodFamily(referenceName);
  if (familyA && familyB && familyA === familyB) return 'same_food_family';

  var roleA = roleForFood(candidateName);
  var roleB = roleForFood(referenceName);
  if (roleA && roleB && roleA === roleB) return 'same_nutrition_role';

  var functionA = mealFunctionForRole(roleA);
  var functionB = mealFunctionForRole(roleB);
  if (functionA !== 'unknown' && functionA === functionB) return 'same_meal_function';

  // "Connu" = classifiable par au moins une des dimensions ci-dessus
  // (famille ou rôle) — sinon on ne peut pas conclure à "unrelated" de
  // façon fiable, jamais transformé en unrelated par défaut.
  var knownA = !!familyA || !!roleA;
  var knownB = !!familyB || !!roleB;
  if (knownA && knownB) return 'unrelated';

  return 'unknown';
}

/* -----------------------------------------------------------------------
   foodRelationExclusionAdvice(relation)

   Traduit une relation en action INTERNE au moteur — jamais une
   conclusion nutritionnelle, jamais une phrase destinée à un patient.
   ----------------------------------------------------------------------- */
var FOOD_RELATION_ACTIONS = {
  exact_same_food: 'exclude',
  same_food_family: 'deprioritize',
  same_nutrition_role: 'deprioritize',
  same_meal_function: 'allow_as_variation',
  unrelated: 'eligible',
  unknown: 'unknown'
};

function foodRelationExclusionAdvice(relation) {
  return FOOD_RELATION_ACTIONS[relation] || 'unknown';
}

/* -----------------------------------------------------------------------
   classifyFoodAgainstMealPattern(candidateName, mealType, mealPatterns)

   mealPatterns : tableau déjà produit par detectMealPatterns() (jamais
   recalculé ici, jamais muté). Compare le candidat à chaque aliment du
   repas récurrent correspondant au créneau visé, retient la relation la
   plus restrictive (voir FOOD_RELATION_PRIORITY), conserve les aliments
   à l'origine de cette relation, et retourne une décision descriptive.

   Retourne toujours :
   { candidateName, mealType, relation, matchedFoods, action, evidence }
   ----------------------------------------------------------------------- */
function classifyFoodAgainstMealPattern(candidateName, mealType, mealPatterns) {
  var pattern = Array.isArray(mealPatterns) ? mealPatterns.filter(function (p) { return p && p.mealType === mealType; })[0] : null;

  if (!pattern || !Array.isArray(pattern.foods) || pattern.foods.length === 0) {
    return {
      candidateName: candidateName || null,
      mealType: mealType || null,
      relation: 'unknown',
      matchedFoods: [],
      action: foodRelationExclusionAdvice('unknown'),
      evidence: null
    };
  }

  var bestRank = FOOD_RELATION_PRIORITY.length; // pire rang possible + 1
  var bestRelation = 'unknown';
  var matchedFoods = [];

  pattern.foods.forEach(function (food) {
    var relation = classifyFoodRelation(candidateName, food.name);
    var rank = FOOD_RELATION_PRIORITY.indexOf(relation);
    if (rank < bestRank) {
      bestRank = rank;
      bestRelation = relation;
      matchedFoods = [food.name];
    } else if (rank === bestRank && matchedFoods.indexOf(food.name) === -1) {
      matchedFoods.push(food.name);
    }
  });

  // Une relation 'unrelated' ou 'unknown' ne désigne pas un aliment
  // "correspondant" à proprement parler — matchedFoods reste vide dans
  // ce cas, jamais une liste de tous les aliments du repas par défaut.
  if (bestRelation === 'unrelated' || bestRelation === 'unknown') {
    matchedFoods = [];
  }

  return {
    candidateName: candidateName || null,
    mealType: mealType || null,
    relation: bestRelation,
    matchedFoods: matchedFoods,
    action: foodRelationExclusionAdvice(bestRelation),
    evidence: { mealPatternId: pattern.mealPatternId, occurrenceCount: pattern.occurrenceCount }
  };
}
