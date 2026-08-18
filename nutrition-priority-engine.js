/* ──────────────────────────────────────────────────────────────────────
   nutrition-priority-engine.js — Pertinence nutriment × régime et
   priorité d'affichage entre plusieurs signaux déclenchés — Cap Santé

   ⚠️ ÉTAPE ARCHITECTURALE CONFINÉE — voir avertissement complet en tête
   de nutrition-rule-engine.js.

   Objectif : quand plusieurs signaux se déclenchent en même temps pour
   un même profil, décider dans quel ordre les présenter, SANS écrire une
   règle par combinaison nutriment × régime × contexte (ce qui produirait
   un fichier ingérable et resterait toujours incomplet). À la place :
   une petite table de données déclarative, une ligne par nutriment,
   maintenue et revue humainement — jamais une logique inventée à la
   volée pour un profil particulier.

   Ce fichier ne fait jamais sb.from(...), aucun accès réseau, aucun
   accès DOM. Fonctions pures uniquement. Ne modifie jamais les résultats
   reçus.
   ────────────────────────────────────────────────────────────────────── */

/* -----------------------------------------------------------------------
   NUTRIENT_DIET_RELEVANCE — pour quels régimes déclarés un nutriment est
   PARTICULIÈREMENT pertinent (sources quasi exclusivement animales, donc
   structurellement plus rares pour ces régimes). Table de données
   saisie et validée humainement, jamais déduite automatiquement.
   ----------------------------------------------------------------------- */
var NUTRIENT_DIET_RELEVANCE = {
  vitamin_b12: ['vegan', 'vegetarian'],
  iron: ['vegan', 'vegetarian'],
  omega3: ['vegan', 'vegetarian'],
  calcium: ['vegan'],
  zinc: ['vegan', 'vegetarian']
};

/* -----------------------------------------------------------------------
   NUTRIENT_CODE_BY_RULE_ID — associe chaque règle de type "sources rares"
   à son code nutriment, pour pouvoir consulter NUTRIENT_DIET_RELEVANCE
   sans reparser triggerPatternId. Les règles hors périmètre nutriment
   (ultra-transformés, alcool, sucre ajouté) n'apparaissent pas ici —
   elles n'ont pas de pertinence renforcée par régime.
   ----------------------------------------------------------------------- */
var NUTRIENT_CODE_BY_RULE_ID = {
  increase_iron_sources_v1: 'iron',
  increase_calcium_sources_v1: 'calcium',
  increase_fiber_sources_v1: 'fiber',
  increase_omega3_sources_v1: 'omega3',
  increase_magnesium_sources_v1: 'magnesium',
  increase_zinc_sources_v1: 'zinc',
  increase_vitamin_c_sources_v1: 'vitamin_c',
  increase_vitamin_d_sources_v1: 'vitamin_d',
  increase_potassium_sources_v1: 'potassium',
  increase_vitamin_b12_sources_v1: 'vitamin_b12'
};

/* -----------------------------------------------------------------------
   computeRulePriority(ruleId, profile)

   Retourne un score numérique — plus haut = affiché en premier. Jamais
   une affirmation de gravité clinique : uniquement une priorité
   d'affichage entre plusieurs constats déjà validés indépendamment par
   le moteur de règles.
   ----------------------------------------------------------------------- */
function computeRulePriority(ruleId, profile) {
  var basePriority = 1;
  var nutrientCode = NUTRIENT_CODE_BY_RULE_ID[ruleId];
  if (!nutrientCode) return basePriority;

  var relevantDiets = NUTRIENT_DIET_RELEVANCE[nutrientCode];
  if (!relevantDiets) return basePriority;

  var declaredDiet = profile && profile.diet;
  if (declaredDiet && relevantDiets.indexOf(declaredDiet) !== -1) {
    return basePriority + 1;
  }
  return basePriority;
}

/* -----------------------------------------------------------------------
   sortEligibleResultsByPriority(results, profile)

   results : tableau de { ruleId, result } où result vient de
   runNutritionSimulation() et result.eligible === true pour chaque
   entrée (les entrées non éligibles ne sont pas triées ici — filtrage
   à faire par l'appelant). Tri stable : priorité décroissante, puis
   ruleId alphabétique pour un ordre déterministe et testable.
   ----------------------------------------------------------------------- */
function sortEligibleResultsByPriority(results, profile) {
  var list = Array.isArray(results) ? results.slice() : [];
  return list
    .map(function (entry, index) {
      return {
        entry: entry,
        priority: computeRulePriority(entry.ruleId, profile),
        index: index
      };
    })
    .sort(function (a, b) {
      if (b.priority !== a.priority) return b.priority - a.priority;
      if (a.entry.ruleId !== b.entry.ruleId) return a.entry.ruleId < b.entry.ruleId ? -1 : 1;
      return a.index - b.index;
    })
    .map(function (wrapped) { return wrapped.entry; });
}
