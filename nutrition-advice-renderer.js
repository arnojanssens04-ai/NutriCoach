/* ──────────────────────────────────────────────────────────────────────
   nutrition-advice-renderer.js — Assemblage du texte de conseil —
   Cap Santé

   ⚠️ ÉTAPE ARCHITECTURALE CONFINÉE — voir avertissement complet en tête
   de nutrition-rule-engine.js.

   Aucun code exécuté dynamiquement : une seule substitution de chaîne
   littérale ({{foods}}), jamais d'interpolation de champ arbitraire,
   jamais de eval()/new Function(). Le gabarit et son unique variable
   autorisée proviennent exclusivement de nutrition-template-definitions.js.
   ────────────────────────────────────────────────────────────────────── */

function renderNutritionAdvice(template, selectedFoods) {
  if (!template || typeof template.bodyTemplate !== 'string') {
    return { body: null, blockReason: 'template_missing' };
  }
  if (!Array.isArray(selectedFoods) || selectedFoods.length === 0) {
    return { body: null, blockReason: 'no_food_to_render' };
  }

  var foodsText = selectedFoods.map(function (f) { return f.label; }).join(', ');
  // Remplacement littéral du seul placeholder autorisé — pas de moteur de
  // gabarit générique, pas d'accès à d'autres champs que 'foods'.
  var body = template.bodyTemplate.split('{{foods}}').join(foodsText);

  return { body: body, blockReason: null };
}
