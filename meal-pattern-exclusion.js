/* ──────────────────────────────────────────────────────────────────────
   meal-pattern-exclusion.js — Exclusion des aliments déjà présents dans
   un repas récurrent — Cap Santé

   Chantier SÉPARÉ du moteur confiné nutrition-*.js (jamais chargé,
   jamais référencé, jamais modifié par ce fichier). Fonction pure,
   aucun réseau, aucune persistance, aucune IA.

   Objectif unique : avant qu'une future proposition n'envisage
   d'ajouter un aliment, vérifier s'il fait déjà partie de la
   composition habituelle du repas concerné — pour ne jamais reproposer
   ce qui est déjà là (ex. ne pas suggérer une banane si elle est déjà
   systématiquement présente au petit-déjeuner).

   Ne conclut JAMAIS qu'un apport est suffisant ou insuffisant à partir
   de la seule présence d'un aliment — ce module répond uniquement à une
   question de PRÉSENCE/ABSENCE dans les repas récurrents déjà détectés
   par meal-pattern-detector.js, jamais à une question nutritionnelle.
   ────────────────────────────────────────────────────────────────────── */

/* -----------------------------------------------------------------------
   evaluateFoodPresenceInMealPatterns(candidateFoodName, mealType, mealPatterns)

   mealPatterns : tableau de meal_pattern déjà produit par
   detectMealPatterns() (jamais recalculé ici).

   Retourne toujours :
   { excluded: boolean, reason: 'already_present_in_same_meal'|null,
     presence: 'same_meal'|'other_meal'|'absent'|'unknown_quantity',
     matchedFood: string|null }

   - 'same_meal'      : l'aliment (comparaison normalisée) fait déjà
                         partie de la composition récurrente du créneau
                         `mealType` visé par la proposition => excluded=true.
   - 'other_meal'      : l'aliment fait partie d'un autre créneau, mais
                         pas de celui visé => excluded=false (une même
                         alternative peut rester pertinente pour un
                         créneau différent).
   - 'unknown_quantity': l'aliment est présent dans le créneau visé, mais
                         sans quantité connue pour aucune occurrence
                         (averageQuantity === null) — présence confirmée,
                         quantité non exploitable ; reste exclu, jamais
                         un résultat "absent" par défaut.
   - 'absent'          : l'aliment n'apparaît dans aucun meal_pattern
                         fourni => excluded=false.
   ----------------------------------------------------------------------- */
function evaluateFoodPresenceInMealPatterns(candidateFoodName, mealType, mealPatterns) {
  var normCandidate = normalizeMealFoodName(candidateFoodName);
  if (!normCandidate || !Array.isArray(mealPatterns)) {
    return { excluded: false, reason: null, presence: 'absent', matchedFood: null };
  }

  var sameMealPattern = mealPatterns.filter(function (p) { return p.mealType === mealType; })[0];
  if (sameMealPattern) {
    var matchInSameMeal = sameMealPattern.foods.filter(function (f) {
      return normalizeMealFoodName(f.name) === normCandidate;
    })[0];
    if (matchInSameMeal) {
      if (matchInSameMeal.averageQuantity === null || matchInSameMeal.averageQuantity === undefined) {
        return { excluded: true, reason: 'already_present_in_same_meal', presence: 'unknown_quantity', matchedFood: matchInSameMeal.name };
      }
      return { excluded: true, reason: 'already_present_in_same_meal', presence: 'same_meal', matchedFood: matchInSameMeal.name };
    }
  }

  var otherMealPattern = mealPatterns.filter(function (p) { return p.mealType !== mealType; })
    .map(function (p) {
      return p.foods.filter(function (f) { return normalizeMealFoodName(f.name) === normCandidate; })[0];
    })
    .filter(Boolean)[0];
  if (otherMealPattern) {
    return { excluded: false, reason: null, presence: 'other_meal', matchedFood: otherMealPattern.name };
  }

  return { excluded: false, reason: null, presence: 'absent', matchedFood: null };
}
