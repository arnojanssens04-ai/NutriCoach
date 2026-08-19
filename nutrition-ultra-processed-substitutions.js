/* ──────────────────────────────────────────────────────────────────────
   nutrition-ultra-processed-substitutions.js — Correspondance
   aliment ultra-transformé repéré → alternatives ciblées, et détection
   par catégorie avec seuil propre — Cap Santé

   ⚠️ ÉTAPE ARCHITECTURALE CONFINÉE — voir avertissement complet en tête
   de nutrition-rule-engine.js.

   Même principe que GLUTEN_ALTERNATIVES / containsGluten() dans
   regles-pathologies.js : détection déterministe par mot-clé (indexOf,
   pas de regex complexe), jamais d'IA, jamais de génération de texte
   libre. Si aucun mot-clé ne correspond au nom de l'aliment repéré, on
   ne devine rien — l'appelant retombe alors sur la liste générique
   existante (staple_whole_foods_v1), jamais un résultat inventé.

   Ce fichier ne modifie jamais trend-engine.js/trend-definitions.js — le
   motif 'repeated_ultra_processed_foods' qui y est défini (fenêtre 7
   jours, ~50% des jours évalués) reste utilisé tel quel ailleurs
   (conseils.html). Le signal calculé ici est un motif SÉPARÉ,
   'repeated_ultra_processed_foods_by_category', ajouté à
   NUTRITION_SIGNAL_RESOLVERS (mécanisme déjà utilisé par les signaux
   alcool/sucre ajouté) — jamais une modification du fichier existant.

   Seuils par catégorie (nombre d'occurrences sur 7 jours) : décision
   produit du 2026-08-19, pas une valeur clinique établie — certaines
   catégories (frites, confiseries) sont volontairement plus sensibles
   que d'autres (pâtisserie industrielle) à la demande explicite de
   l'utilisateur. Ajustable, jamais présenté comme un seuil médical.
   ────────────────────────────────────────────────────────────────────── */

function normalizeUltraProcessedFoodName(name) {
  if (!name) return '';
  return String(name).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
}

// Catégories par mot-clé, chacune avec son propre seuil d'occurrences
// sur la fenêtre d'observation (7 jours). Ordre de vérification
// important : les motifs les plus spécifiques d'abord pour éviter qu'un
// mot générique n'écrase une catégorie plus précise détectée par un
// autre mot-clé du même aliment.
var ULTRA_PROCESSED_CATEGORY_DEFINITIONS = [
  { category: 'fried_potato', weeklyThreshold: 2,
    keywords: ['frite', 'frites'] },
  { category: 'candy_confectionery', weeklyThreshold: 2,
    keywords: ['bonbon', 'confiserie', 'sucrerie', 'chewing-gum', 'guimauve', 'reglisse'] },
  { category: 'sugary_dessert_pastry', weeklyThreshold: 4,
    keywords: ['mousse au chocolat', 'chocolat industriel', 'patisserie industrielle', 'gateau industriel', 'viennoiserie industrielle', 'biscuit industriel', 'barre chocolatee', 'glace industrielle', 'donut', 'beignet industriel'] },
  { category: 'sugary_drink', weeklyThreshold: 3,
    keywords: ['soda', 'cola', 'boisson sucree', 'boisson energisante', 'jus industriel', 'limonade', 'sirop'] },
  { category: 'fast_food_meal', weeklyThreshold: 2,
    keywords: ['pizza industrielle', 'burger', 'plat prepare', 'nugget', 'kebab industriel', 'sandwich industriel'] },
  { category: 'salty_snack', weeklyThreshold: 3,
    keywords: ['chips', 'snack industriel', 'cracker industriel', 'biscuit aperitif'] },
  { category: 'processed_meat', weeklyThreshold: 3,
    keywords: ['charcuterie industrielle', 'saucisse industrielle', 'jambon industriel', 'bacon industriel'] },
  { category: 'instant_meal', weeklyThreshold: 3,
    keywords: ['soupe instantanee', 'nouilles instantanees', 'puree instantanee', 'plat lyophilise'] }
];

// Seuil de repli pour un aliment marqué ultra-transformé (is_ultra_processed
// === true) mais dont le nom ne correspond à AUCUN mot-clé connu — jamais
// ignoré silencieusement : compté sous une catégorie générique dédiée,
// avec son propre seuil, pour ne pas manquer une répétition simplement
// parce que le nom de l'aliment n'est pas encore reconnu par la liste de
// mots-clés (volontairement non exhaustive).
var UNCATEGORIZED_ULTRA_PROCESSED_WEEKLY_THRESHOLD = 3;

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
  for (var i = 0; i < ULTRA_PROCESSED_CATEGORY_DEFINITIONS.length; i++) {
    var entry = ULTRA_PROCESSED_CATEGORY_DEFINITIONS[i];
    for (var j = 0; j < entry.keywords.length; j++) {
      if (isUltraProcessedKeywordMatch(n, entry.keywords[j])) return entry.category;
    }
  }
  return null;
}

function ultraProcessedCategoryThreshold(category) {
  if (category === 'other_ultra_processed') return UNCATEGORIZED_ULTRA_PROCESSED_WEEKLY_THRESHOLD;
  var entry = ULTRA_PROCESSED_CATEGORY_DEFINITIONS.filter(function (e) { return e.category === category; })[0];
  return entry ? entry.weeklyThreshold : null;
}

// Alternatives ciblées par catégorie — mêmes conventions que les listes
// de nutrition-food-definitions.js (code, label, allergenTags, dietTags)
// pour rester filtrables par isFoodSafeForProfile()/dietCompatible().
var ULTRA_PROCESSED_CATEGORY_ALTERNATIVES = {
  fried_potato: [
    { code: 'baked_potato', label: 'Pommes de terre cuites au four', allergenTags: [], dietTags: ['vegetarian', 'vegan', 'gluten_free'] },
    { code: 'baked_sweet_potato', label: 'Patates douces cuites au four', allergenTags: [], dietTags: ['vegetarian', 'vegan', 'gluten_free'] }
  ],
  candy_confectionery: [
    { code: 'fresh_fruit', label: 'Fruit frais', allergenTags: [], dietTags: ['vegetarian', 'vegan', 'gluten_free'] },
    { code: 'dried_fruit_unsweetened', label: 'Fruits secs sans sucre ajouté', allergenTags: [], dietTags: ['vegetarian', 'vegan', 'gluten_free'] }
  ],
  sugary_dessert_pastry: [
    { code: 'fresh_fruit', label: 'Fruit frais', allergenTags: [], dietTags: ['vegetarian', 'vegan', 'gluten_free'] },
    { code: 'dark_chocolate_85', label: 'Carré de chocolat noir (85% ou plus)', allergenTags: [], dietTags: ['vegetarian', 'vegan', 'gluten_free'] },
    { code: 'homemade_fruit_compote', label: 'Compote de fruits maison, sans sucre ajouté', allergenTags: [], dietTags: ['vegetarian', 'vegan', 'gluten_free'] }
  ],
  sugary_drink: [
    { code: 'still_or_sparkling_water', label: 'Eau plate ou pétillante', allergenTags: [], dietTags: ['vegetarian', 'vegan', 'gluten_free'] },
    { code: 'unsweetened_herbal_infusion', label: 'Infusion non sucrée', allergenTags: [], dietTags: ['vegetarian', 'vegan', 'gluten_free'] }
  ],
  fast_food_meal: [
    { code: 'homemade_lean_protein_veg', label: 'Viande maigre ou légumineuses grillées avec légumes, fait maison', allergenTags: [], dietTags: ['gluten_free'] },
    { code: 'homemade_wrap', label: 'Wrap fait maison (pain complet, protéine, légumes)', allergenTags: ['gluten'], dietTags: [] }
  ],
  salty_snack: [
    { code: 'unsalted_nuts', label: 'Noix ou amandes non salées', allergenTags: ['nuts'], dietTags: ['vegetarian', 'vegan', 'gluten_free'] },
    { code: 'raw_vegetable_sticks', label: 'Bâtonnets de légumes crus', allergenTags: [], dietTags: ['vegetarian', 'vegan', 'gluten_free'] }
  ],
  processed_meat: [
    { code: 'lean_unprocessed_poultry', label: 'Viande blanche non transformée', allergenTags: [], dietTags: ['gluten_free'] }
  ],
  instant_meal: [
    { code: 'homemade_lean_protein_veg', label: 'Viande maigre ou légumineuses grillées avec légumes, fait maison', allergenTags: [], dietTags: ['gluten_free'] },
    { code: 'quick_homemade_soup', label: 'Soupe maison rapide (légumes + bouillon)', allergenTags: [], dietTags: ['vegetarian', 'vegan', 'gluten_free'] }
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

/* -----------------------------------------------------------------------
   computeUltraProcessedCategorySignal(journalEntries, referenceDate)

   Signal SÉPARÉ de trend-engine.js — jamais un remplacement, jamais une
   modification de 'repeated_ultra_processed_foods' (toujours utilisé tel
   quel ailleurs). Compte, sur une fenêtre de 7 jours, le nombre
   d'OCCURRENCES (pas de jours) d'aliments ultra-transformés appartenant
   à chaque catégorie connue (ULTRA_PROCESSED_CATEGORY_DEFINITIONS) ; état
   'present' dès qu'au moins une catégorie atteint son propre seuil
   hebdomadaire. Un aliment non catégorisé (aucun mot-clé ne correspond)
   n'est jamais compté ici — il reste néanmoins visible séparément via
   extractFlaggedFoodNames() pour ne rien cacher au conseil généré.
   ----------------------------------------------------------------------- */
function computeUltraProcessedCategorySignal(journalEntries, referenceDate) {
  var patternId = 'repeated_ultra_processed_foods_by_category';
  var label = 'Présence répétée d\'aliments ultra-transformés (par catégorie)';
  var observationWindowDays = 7;
  var minimumAnalyzableDays = 4;

  if (!Array.isArray(journalEntries) || typeof isValidIsoDateSignal !== 'function' || !isValidIsoDateSignal(referenceDate)) {
    return (typeof buildSignalErrorResult === 'function') ? buildSignalErrorResult(patternId, label) : { patternId: patternId, label: label, state: 'error' };
  }

  var dateWindow = buildDateWindowSignal(referenceDate, observationWindowDays);
  var windowSet = {};
  dateWindow.dates.forEach(function (d) { windowSet[d] = true; });

  var byDate = {};
  journalEntries.forEach(function (e) {
    if (!e || !windowSet[e.date]) return;
    if (!byDate[e.date]) byDate[e.date] = [];
    byDate[e.date].push(e);
  });

  var analyzableDays = 0;
  dateWindow.dates.forEach(function (d) { if (byDate[d] && byDate[d].length > 0) analyzableDays++; });
  var evaluatedDays = analyzableDays; // pas de notion "insuffisant" par jour ici, contrairement aux signaux quantitatifs
  var coverageRate = observationWindowDays > 0 ? analyzableDays / observationWindowDays : 0;

  if (evaluatedDays < minimumAnalyzableDays) {
    return {
      patternId: patternId, label: label, state: 'insufficient', referenceDate: referenceDate,
      windowStart: dateWindow.windowStart, windowEnd: dateWindow.windowEnd, calendarDays: observationWindowDays,
      analyzableDays: analyzableDays, coverageRate: coverageRate, occurrenceDays: 0, evaluatedDays: evaluatedDays,
      occurrenceRate: 0, confidence: 'unknown', insufficientDays: [], isConfirmed: false,
      observationMessage: null,
      insufficientDataMessage: 'Les données disponibles ne permettent pas d\'évaluer ce signal pour la période analysée.',
      categoryCounts: {}, triggeredCategories: []
    };
  }

  var categoryCounts = {};
  journalEntries.forEach(function (e) {
    if (!e || !windowSet[e.date]) return;
    if (e.is_ultra_processed !== true) return;
    var category = matchUltraProcessedCategory(e.aliment) || 'other_ultra_processed';
    categoryCounts[category] = (categoryCounts[category] || 0) + 1;
  });

  var triggeredCategories = Object.keys(categoryCounts).filter(function (cat) {
    var threshold = ultraProcessedCategoryThreshold(cat);
    return threshold != null && categoryCounts[cat] >= threshold;
  });

  var state = triggeredCategories.length > 0 ? 'present' : 'absent';

  var effectiveRate = 0;
  if (triggeredCategories.length > 0) {
    effectiveRate = Math.min(1, Math.max.apply(null, triggeredCategories.map(function (cat) {
      return categoryCounts[cat] / ultraProcessedCategoryThreshold(cat);
    })));
  }
  var confidence = (typeof nutritionSignalConfidence === 'function') ? nutritionSignalConfidence(evaluatedDays, effectiveRate) : 'unknown';

  return {
    patternId: patternId, label: label, state: state, referenceDate: referenceDate,
    windowStart: dateWindow.windowStart, windowEnd: dateWindow.windowEnd, calendarDays: observationWindowDays,
    analyzableDays: analyzableDays, coverageRate: coverageRate,
    occurrenceDays: triggeredCategories.length > 0 ? Math.max.apply(null, triggeredCategories.map(function (cat) { return categoryCounts[cat]; })) : 0,
    evaluatedDays: evaluatedDays, occurrenceRate: effectiveRate, confidence: confidence,
    insufficientDays: [], isConfirmed: false,
    observationMessage: state === 'present'
      ? 'Une présence répétée d\'un ou plusieurs types d\'aliments ultra-transformés a été observée sur la période analysée.'
      : null,
    insufficientDataMessage: null,
    categoryCounts: categoryCounts, triggeredCategories: triggeredCategories
  };
}

if (typeof NUTRITION_SIGNAL_RESOLVERS !== 'undefined') {
  NUTRITION_SIGNAL_RESOLVERS.repeated_ultra_processed_foods_by_category = function (journalEntries, referenceDate) {
    return computeUltraProcessedCategorySignal(journalEntries, referenceDate);
  };
}
