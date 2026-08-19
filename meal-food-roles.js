/* ──────────────────────────────────────────────────────────────────────
   meal-food-roles.js — Rôles alimentaires descriptifs par mot-clé —
   Cap Santé

   Chantier SÉPARÉ du moteur confiné nutrition-*.js (jamais chargé,
   jamais référencé, jamais modifié par ce fichier). Aucun réseau, aucune
   persistance, aucune IA. Même principe que GLUTEN_ALTERNATIVES /
   containsGluten() dans regles-pathologies.js (jamais modifié non plus,
   seulement le même patron reproduit) : détection déterministe par
   mot-clé, jamais de génération de texte, jamais de conclusion
   nutritionnelle. Un rôle est purement DESCRIPTIF (ex. "cette entrée
   ressemble à une base céréalière") — jamais une affirmation sur
   l'adéquation ou la suffisance d'un apport.
   ────────────────────────────────────────────────────────────────────── */

function normalizeMealFoodName(name) {
  if (!name) return '';
  return String(name).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
}

// Mot-clé à un seul mot => correspondance par TOKEN entier (jamais une
// sous-chaîne, même garde que nutrition-ultra-processed-substitutions.js
// pour éviter un faux positif type "cola" dans "chocolat"). Mot-clé à
// plusieurs mots => sous-chaîne sur le nom normalisé.
function isMealFoodKeywordMatch(normalizedName, keyword) {
  if (keyword.indexOf(' ') !== -1) return normalizedName.indexOf(keyword) !== -1;
  var tokens = normalizedName.split(/[^a-z0-9]+/).filter(Boolean);
  return tokens.indexOf(keyword) !== -1;
}

// Rôles descriptifs — volontairement limités aux catégories utiles pour
// distinguer une composition de repas (pas une classification
// nutritionnelle complète). Ordre de vérification : motifs les plus
// spécifiques d'abord.
var MEAL_FOOD_ROLE_DEFINITIONS = [
  { role: 'cereal_base', keywords: ['muesli', 'granola', 'cereales', 'cornflakes', 'corn flakes'] },
  { role: 'cereal', keywords: ['avoine', 'porridge', 'ble complet', 'orge'] },
  { role: 'dairy', keywords: ['yaourt', 'yogourt', 'skyr', 'fromage blanc', 'lait'] },
  { role: 'fruit', keywords: ['banane', 'pomme', 'poire', 'orange', 'fraise', 'kiwi', 'raisin', 'peche', 'abricot', 'mangue', 'ananas', 'clementine', 'pamplemousse'] },
  { role: 'protein', keywords: ['oeuf', 'jambon', 'poulet', 'thon', 'saumon', 'dinde'] },
  { role: 'bread', keywords: ['pain', 'tartine', 'toast'] },
  { role: 'spread', keywords: ['confiture', 'miel', 'pate a tartiner', 'beurre'] }
];

/* -----------------------------------------------------------------------
   matchMealFoodRole(foodName)

   Retourne le premier rôle descriptif dont un mot-clé correspond au nom
   de l'aliment, ou null si aucun ne correspond (jamais un rôle par
   défaut arbitraire — "rôle inconnu" reste une absence d'information,
   jamais une supposition).
   ----------------------------------------------------------------------- */
function matchMealFoodRole(foodName) {
  var n = normalizeMealFoodName(foodName);
  if (!n) return null;
  for (var i = 0; i < MEAL_FOOD_ROLE_DEFINITIONS.length; i++) {
    var entry = MEAL_FOOD_ROLE_DEFINITIONS[i];
    for (var j = 0; j < entry.keywords.length; j++) {
      if (isMealFoodKeywordMatch(n, entry.keywords[j])) return entry.role;
    }
  }
  return null;
}
