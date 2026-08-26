/* ──────────────────────────────────────────────────────────────────────
   nutrition-advice-renderer.js — Assemblage du texte de conseil —
   Cap Santé

   ⚠️ ÉTAPE ARCHITECTURALE CONFINÉE — voir avertissement complet en tête
   de nutrition-rule-engine.js.

   Aucun code exécuté dynamiquement : une seule substitution de chaînes
   littérales ({{foods}}, {{flagged_foods}}, {{avg_intake}},
   {{daily_target}}, {{unit}}), jamais d'interpolation de champ
   arbitraire, jamais de eval()/new Function(). Les gabarits et leurs
   variables autorisées proviennent exclusivement de
   nutrition-template-definitions.js.

   VARIANTES (template.variants) — un template peut proposer PLUSIEURS
   textes fixes et déjà validés au lieu d'un seul, sélectionnés selon un
   contexte objectif et non un texte généré à la volée : la sélection
   passe par selectTemplateVariant(), qui ne connaît que 3 clés fixes
   ('hasSupplement', 'veryLow', 'default') — jamais de code arbitraire
   évalué depuis les données. Un template sans `variants` garde son
   ancien comportement (bodyTemplate unique), inchangé.
   ────────────────────────────────────────────────────────────────────── */

// Seuil sous lequel une observation est considérée "very low" plutôt que
// simplement "en dessous de la référence" -- même seuil pour les deux
// familles de signaux :
// - quantité (computeNutrientIntakeVsTarget) : occurrenceRate = ratio
//   apport moyen / cible du jour (déjà < insufficiencyRatio pour être
//   éligible ici, donc "very low" resserre encore ce sous-ensemble) ;
// - présence de sources (computeNutrientSourceRarity) : occurrenceRate =
//   fréquence de jours où une source a été repérée (0 = jamais).
var NUTRITION_VARIANT_VERY_LOW_RATIO = 0.3;

function selectTemplateVariant(template, observation, hasSupplement) {
  var variants = template.variants;
  if (!Array.isArray(variants) || !variants.length) return template;

  var occurrenceRate = (observation && typeof observation.occurrenceRate === 'number') ? observation.occurrenceRate : null;
  var flags = {
    hasSupplement: hasSupplement === true,
    veryLow: occurrenceRate !== null && occurrenceRate < NUTRITION_VARIANT_VERY_LOW_RATIO,
    default: true
  };

  for (var i = 0; i < variants.length; i++) {
    var key = variants[i].when;
    if (Object.prototype.hasOwnProperty.call(flags, key) && flags[key]) {
      return variants[i];
    }
  }
  return variants[variants.length - 1];
}

function renderNutritionAdvice(template, selectedFoods, flaggedFoodNames, observation, hasSupplement) {
  if (!template) {
    return { body: null, blockReason: 'template_missing' };
  }
  var picked = selectTemplateVariant(template, observation, hasSupplement);
  if (!picked || typeof picked.bodyTemplate !== 'string') {
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
  var body = picked.bodyTemplate;
  var allowed = template.allowedVariables || [];

  if (body.indexOf('{{flagged_foods}}') !== -1) {
    if (allowed.indexOf('flagged_foods') === -1 || !Array.isArray(flaggedFoodNames) || flaggedFoodNames.length === 0) {
      return { body: null, blockReason: 'flagged_foods_unavailable' };
    }
    body = body.split('{{flagged_foods}}').join(flaggedFoodNames.join(', '));
  }

  // {{avg_intake}} / {{daily_target}} / {{unit}} -- valeurs NUMÉRIQUES déjà
  // calculées par computeNutrientIntakeVsTarget (jamais recalculées ni
  // inventées ici). Uniquement substitués si le gabarit les autorise ET
  // que l'observation les fournit réellement -- sinon on bloque plutôt
  // que d'afficher un placeholder brut ou une valeur à 0 trompeuse.
  ['avg_intake', 'daily_target'].forEach(function (key) {
    var placeholder = '{{' + key + '}}';
    if (body.indexOf(placeholder) === -1) return;
    var field = key === 'avg_intake' ? 'avgIntake' : 'dailyTarget';
    if (allowed.indexOf(key) === -1 || !observation || typeof observation[field] !== 'number') {
      body = null;
      return;
    }
    body = body.split(placeholder).join(String(Math.round(observation[field] * 10) / 10));
  });
  if (body === null) return { body: null, blockReason: 'quantity_unavailable' };

  if (body.indexOf('{{unit}}') !== -1) {
    if (allowed.indexOf('unit') === -1 || !observation || typeof observation.unit !== 'string') {
      return { body: null, blockReason: 'quantity_unavailable' };
    }
    body = body.split('{{unit}}').join(observation.unit);
  }

  body = body.split('{{foods}}').join(foodsText);

  return { body: body, blockReason: null };
}
