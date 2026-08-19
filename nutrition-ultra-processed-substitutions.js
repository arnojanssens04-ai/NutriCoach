/* ──────────────────────────────────────────────────────────────────────
   nutrition-ultra-processed-substitutions.js — Correspondance
   aliment ultra-transformé repéré → alternatives ciblées — Cap Santé

   ⚠️ ÉTAPE ARCHITECTURALE CONFINÉE — voir avertissement complet en tête
   de nutrition-rule-engine.js.

   Même principe que GLUTEN_ALTERNATIVES / containsGluten() dans
   regles-pathologies.js : détection déterministe par mot-clé (indexOf,
   pas de regex complexe), jamais d'IA, jamais de génération de texte
   libre. Si aucun mot-clé ne correspond au nom de l'aliment repéré, on
   ne devine rien — l'appelant retombe alors sur la liste générique
   existante (staple_whole_foods_v1), jamais un résultat inventé.
   ────────────────────────────────────────────────────────────────────── */

function normalizeUltraProcessedFoodName(name) {
  if (!name) return '';
  return String(name).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
}

// Catégories par mot-clé — ordre de vérification important : les motifs
// les plus spécifiques d'abord pour éviter qu'un mot générique ('chips')
// n'écrase une catégorie plus précise détectée par un autre mot-clé du
// même aliment.
var ULTRA_PROCESSED_KEYWORD_CATEGORIES = [
  { category: 'fried_potato', keywords: ['frite', 'frites'] },
  { category: 'sugary_drink', keywords: ['soda', 'cola', 'boisson sucree', 'limonade', 'sirop'] },
  { category: 'sugary_dessert', keywords: ['mousse au chocolat', 'chocolat industriel', 'patisserie industrielle', 'gateau industriel', 'confiserie', 'bonbon', 'barre chocolatee'] },
  { category: 'fast_food_meal', keywords: ['pizza industrielle', 'burger', 'plat prepare', 'nugget', 'kebab industriel'] },
  { category: 'processed_snack', keywords: ['chips', 'biscuit industriel', 'snack industriel'] },
  { category: 'processed_meat', keywords: ['charcuterie industrielle', 'saucisse industrielle', 'jambon industriel'] }
];

// Un mot-clé d'un seul mot doit correspondre à un TOKEN entier du nom
// (jamais une sous-chaîne) — évite par exemple que 'cola' ne corresponde
// à l'intérieur de 'chocolat'. Un mot-clé à plusieurs mots ('boisson
// sucree') reste vérifié par sous-chaîne sur le nom normalisé.
function isUltraProcessedKeywordMatch(normalizedName, keyword) {
  if (keyword.indexOf(' ') !== -1) return normalizedName.indexOf(keyword) !== -1;
  var tokens = normalizedName.split(/[^a-z0-9]+/).filter(Boolean);
  return tokens.indexOf(keyword) !== -1;
}

// Retourne la première catégorie dont un mot-clé correspond au nom de
// l'aliment, ou null si aucune ne correspond (jamais une catégorie par
// défaut arbitraire).
function matchUltraProcessedCategory(foodName) {
  var n = normalizeUltraProcessedFoodName(foodName);
  if (!n) return null;
  for (var i = 0; i < ULTRA_PROCESSED_KEYWORD_CATEGORIES.length; i++) {
    var entry = ULTRA_PROCESSED_KEYWORD_CATEGORIES[i];
    for (var j = 0; j < entry.keywords.length; j++) {
      if (isUltraProcessedKeywordMatch(n, entry.keywords[j])) return entry.category;
    }
  }
  return null;
}

// Alternatives ciblées par catégorie — mêmes conventions que les listes
// de nutrition-food-definitions.js (code, label, allergenTags, dietTags)
// pour rester filtrables par isFoodSafeForProfile()/dietCompatible().
var ULTRA_PROCESSED_CATEGORY_ALTERNATIVES = {
  fried_potato: [
    { code: 'baked_potato', label: 'Pommes de terre cuites au four', allergenTags: [], dietTags: ['vegetarian', 'vegan', 'gluten_free'] },
    { code: 'baked_sweet_potato', label: 'Patates douces cuites au four', allergenTags: [], dietTags: ['vegetarian', 'vegan', 'gluten_free'] }
  ],
  sugary_drink: [
    { code: 'still_or_sparkling_water', label: 'Eau plate ou pétillante', allergenTags: [], dietTags: ['vegetarian', 'vegan', 'gluten_free'] },
    { code: 'unsweetened_herbal_infusion', label: 'Infusion non sucrée', allergenTags: [], dietTags: ['vegetarian', 'vegan', 'gluten_free'] }
  ],
  sugary_dessert: [
    { code: 'fresh_fruit', label: 'Fruit frais', allergenTags: [], dietTags: ['vegetarian', 'vegan', 'gluten_free'] },
    { code: 'dark_chocolate_85', label: 'Carré de chocolat noir (85% ou plus)', allergenTags: [], dietTags: ['vegetarian', 'vegan', 'gluten_free'] }
  ],
  fast_food_meal: [
    { code: 'homemade_lean_protein_veg', label: 'Viande maigre ou légumineuses grillées avec légumes, fait maison', allergenTags: [], dietTags: ['gluten_free'] },
    { code: 'homemade_wrap', label: 'Wrap fait maison (pain complet, protéine, légumes)', allergenTags: ['gluten'], dietTags: [] }
  ],
  processed_snack: [
    { code: 'unsalted_nuts', label: 'Noix ou amandes non salées', allergenTags: ['nuts'], dietTags: ['vegetarian', 'vegan', 'gluten_free'] },
    { code: 'raw_vegetable_sticks', label: 'Bâtonnets de légumes crus', allergenTags: [], dietTags: ['vegetarian', 'vegan', 'gluten_free'] }
  ],
  processed_meat: [
    { code: 'lean_unprocessed_poultry', label: 'Viande blanche non transformée', allergenTags: [], dietTags: ['gluten_free'] }
  ]
};

/* -----------------------------------------------------------------------
   selectUltraProcessedKeywordAlternatives(flaggedFoodNames, profile)

   Pour chaque aliment repéré, tente une correspondance par mot-clé et
   collecte les alternatives associées (dédoublonnées par code, filtrées
   par sécurité/régime — mêmes garde-fous que selectCompatibleFoods()).
   Retourne un tableau vide si aucun mot-clé ne correspond à aucun
   aliment repéré : l'appelant doit alors retomber sur la liste
   générique, jamais halluciner une correspondance.
   ----------------------------------------------------------------------- */
function selectUltraProcessedKeywordAlternatives(flaggedFoodNames, profile) {
  var matched = [];
  var seenCodes = {};

  (flaggedFoodNames || []).forEach(function (name) {
    var category = matchUltraProcessedCategory(name);
    if (!category) return;
    var items = ULTRA_PROCESSED_CATEGORY_ALTERNATIVES[category];
    if (!Array.isArray(items)) return;

    items.forEach(function (item) {
      if (seenCodes[item.code]) return;
      if (typeof isFoodSafeForProfile === 'function' && !isFoodSafeForProfile(profile, item)) return;
      if (typeof dietCompatible === 'function' && !dietCompatible(profile && profile.diet, item)) return;
      seenCodes[item.code] = true;
      matched.push(item);
    });
  });

  return matched;
}
