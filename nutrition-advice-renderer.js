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

function renderNutritionAdvice(template, selectedFoods, flaggedFoodNames) {
  if (!template || typeof template.bodyTemplate !== 'string') {
    return { body: null, blockReason: 'template_missing' };
  }
  if (!Array.isArray(selectedFoods) || selectedFoods.length === 0) {
    return { body: null, blockReason: 'no_food_to_render' };
  }

  var foodsText = selectedFoods.map(function (f) { return f.label; }).join(', ');
  // Remplacement littéral des seuls placeholders autorisés — pas de
  // moteur de gabarit générique, pas d'accès à un champ non listé dans
  // allowedVariables. {{flagged_foods}} n'est substitué que si le
  // gabarit l'autorise explicitement ET que des noms ont réellement été
  // relevés dans le journal (jamais un texte "aucun aliment" inventé) ;
  // sinon le placeholder resterait tel quel, donc on bloque proprement.
  var body = template.bodyTemplate;
  var allowed = template.allowedVariables || [];

  if (body.indexOf('{{flagged_foods}}') !== -1) {
    if (allowed.indexOf('flagged_foods') === -1 || !Array.isArray(flaggedFoodNames) || flaggedFoodNames.length === 0) {
      return { body: null, blockReason: 'flagged_foods_unavailable' };
    }
    body = body.split('{{flagged_foods}}').join(flaggedFoodNames.join(', '));
  }

  body = body.split('{{foods}}').join(foodsText);

  return { body: body, blockReason: null };
}
