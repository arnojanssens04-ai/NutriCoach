/* ──────────────────────────────────────────────────────────────────────
   nutrition-template-definitions.js — Gabarits de formulation VALIDÉS —
   Cap Santé

   ⚠️ ÉTAPE ARCHITECTURALE CONFINÉE — voir avertissement en tête de
   nutrition-rule-engine.js.

   Chaque gabarit est un texte figé avec UN SEUL emplacement autorisé
   ({{foods}}), jamais d'interpolation libre de champ non contrôlé.
   Formulation conditionnelle, non prescriptive, jamais de diagnostic de
   carence, jamais d'impératif — cohérent avec forbiddenMessages de
   trend-definitions.js.
   ────────────────────────────────────────────────────────────────────── */

var NUTRITION_ADVICE_TEMPLATES = {
  reduce_ultra_processed_v1: {
    id: 'reduce_ultra_processed_v1',
    status: 'active',
    // Placeholders : {{flagged_foods}} (aliments réellement repérés dans
    // le journal, substitué seulement si des noms ont été relevés) et
    // {{foods}}. Aucun autre champ interpolé.
    bodyTemplate: 'Une présence répétée d\'aliments ultra-transformés a été observée sur la période analysée, '
      + 'notamment : {{flagged_foods}}. Parmi les aliments habituellement disponibles, {{foods}} pourraient être '
      + 'proposés en échange, à discuter avec un professionnel avant toute mise en œuvre.',
    allowedVariables: ['flagged_foods', 'foods']
  },

  // Gabarits ajoutés pour les signaux nutriment/alcool — même contrainte :
  // un seul placeholder {{foods}}, formulation conditionnelle et non
  // prescriptive, jamais de diagnostic de carence, jamais d'impératif,
  // jamais d'affirmation de cause à effet sur la santé.
  // ── Gabarits à VARIANTES (variants[]) ──────────────────────────────────
  // Toujours des textes FIXES et pré-validés (aucune génération libre) —
  // seule la SÉLECTION entre plusieurs formulations déjà écrites dépend
  // du contexte objectif (occurrenceRate du signal, complément déjà
  // signalé par la personne). "when" ne référence QUE des clés fixes
  // reconnues par nutrition-advice-renderer.js (jamais de code exécuté) :
  // 'hasSupplement' (profiles.supplements contient ce nutrientCode),
  // 'veryLow' (observation nettement plus basse que le seuil de
  // déclenchement), 'default' (catch-all, toujours en dernier). Les
  // nutriments à cible en GRAMMES/MG (fer, calcium, fibres...) peuvent
  // en plus interpoler {{avg_intake}}/{{daily_target}}/{{unit}} — valeurs
  // NUMÉRIQUES déjà calculées par computeNutrientIntakeVsTarget
  // (nutrition-signal-engine.js), jamais une quantité inventée. Les
  // nutriments à détection par PRÉSENCE DE SOURCES (B12/C/D) n'ont pas de
  // quantité mesurable — le texte l'explicite au lieu de laisser un vide.
  increase_iron_sources_v1: {
    id: 'increase_iron_sources_v1',
    status: 'active',
    variants: [
      { when: 'hasSupplement', bodyTemplate: 'Un complément en fer a été indiqué dans votre profil. Cette observation du journal (apport moyen estimé à {{avg_intake}}{{unit}}/jour, référence générique {{daily_target}}{{unit}}/jour) reste affichée à titre informatif et ne porte pas d\'appréciation sur le complément lui-même. À discuter avec un professionnel.' },
      { when: 'veryLow', bodyTemplate: 'Apport en fer estimé à {{avg_intake}}{{unit}}/jour en moyenne sur la période analysée, très en dessous de la référence générique de {{daily_target}}{{unit}}/jour (observation du journal, pas un diagnostic). Aliments à ajouter : {{foods}}. À discuter avec un professionnel.' },
      { when: 'default', bodyTemplate: 'Apport en fer estimé à {{avg_intake}}{{unit}}/jour en moyenne sur la période analysée, nettement sous la référence générique de {{daily_target}}{{unit}}/jour (observation du journal, pas un diagnostic). Aliments à ajouter : {{foods}}. À discuter avec un professionnel.' }
    ],
    allowedVariables: ['foods', 'avg_intake', 'daily_target', 'unit']
  },
  increase_calcium_sources_v1: {
    id: 'increase_calcium_sources_v1',
    status: 'active',
    variants: [
      { when: 'hasSupplement', bodyTemplate: 'Un complément en calcium a été indiqué dans votre profil. Cette observation du journal (apport moyen estimé à {{avg_intake}}{{unit}}/jour, référence générique {{daily_target}}{{unit}}/jour) reste affichée à titre informatif et ne porte pas d\'appréciation sur le complément lui-même. À discuter avec un professionnel.' },
      { when: 'veryLow', bodyTemplate: 'Apport en calcium estimé à {{avg_intake}}{{unit}}/jour en moyenne sur la période analysée, très en dessous de la référence générique de {{daily_target}}{{unit}}/jour (observation du journal, pas un diagnostic). Aliments à ajouter : {{foods}}. À discuter avec un professionnel.' },
      { when: 'default', bodyTemplate: 'Apport en calcium estimé à {{avg_intake}}{{unit}}/jour en moyenne sur la période analysée, nettement sous la référence générique de {{daily_target}}{{unit}}/jour (observation du journal, pas un diagnostic). Aliments à ajouter : {{foods}}. À discuter avec un professionnel.' }
    ],
    allowedVariables: ['foods', 'avg_intake', 'daily_target', 'unit']
  },
  increase_fiber_sources_v1: {
    id: 'increase_fiber_sources_v1',
    status: 'active',
    variants: [
      { when: 'hasSupplement', bodyTemplate: 'Un complément en fibres a été indiqué dans votre profil. Cette observation du journal (apport moyen estimé à {{avg_intake}}{{unit}}/jour, référence générique {{daily_target}}{{unit}}/jour) reste affichée à titre informatif et ne porte pas d\'appréciation sur le complément lui-même. À discuter avec un professionnel.' },
      { when: 'veryLow', bodyTemplate: 'Apport en fibres estimé à {{avg_intake}}{{unit}}/jour en moyenne sur la période analysée, très en dessous de la référence générique de {{daily_target}}{{unit}}/jour (observation du journal, pas un diagnostic). Aliments à ajouter : {{foods}}. À discuter avec un professionnel.' },
      { when: 'default', bodyTemplate: 'Apport en fibres estimé à {{avg_intake}}{{unit}}/jour en moyenne sur la période analysée, nettement sous la référence générique de {{daily_target}}{{unit}}/jour (observation du journal, pas un diagnostic). Aliments à ajouter : {{foods}}. À discuter avec un professionnel.' }
    ],
    allowedVariables: ['foods', 'avg_intake', 'daily_target', 'unit']
  },
  increase_omega3_sources_v1: {
    id: 'increase_omega3_sources_v1',
    status: 'active',
    variants: [
      { when: 'hasSupplement', bodyTemplate: 'Un complément en oméga-3 a été indiqué dans votre profil. Cette observation du journal (apport moyen estimé à {{avg_intake}}{{unit}}/jour, référence générique {{daily_target}}{{unit}}/jour) reste affichée à titre informatif et ne porte pas d\'appréciation sur le complément lui-même. À discuter avec un professionnel.' },
      { when: 'veryLow', bodyTemplate: 'Apport en oméga-3 estimé à {{avg_intake}}{{unit}}/jour en moyenne sur la période analysée, très en dessous de la référence générique de {{daily_target}}{{unit}}/jour (observation du journal, pas un diagnostic). Aliments à ajouter : {{foods}}. À discuter avec un professionnel.' },
      { when: 'default', bodyTemplate: 'Apport en oméga-3 estimé à {{avg_intake}}{{unit}}/jour en moyenne sur la période analysée, nettement sous la référence générique de {{daily_target}}{{unit}}/jour (observation du journal, pas un diagnostic). Aliments à ajouter : {{foods}}. À discuter avec un professionnel.' }
    ],
    allowedVariables: ['foods', 'avg_intake', 'daily_target', 'unit']
  },
  increase_magnesium_sources_v1: {
    id: 'increase_magnesium_sources_v1',
    status: 'active',
    variants: [
      { when: 'hasSupplement', bodyTemplate: 'Un complément en magnésium a été indiqué dans votre profil. Cette observation du journal (apport moyen estimé à {{avg_intake}}{{unit}}/jour, référence générique {{daily_target}}{{unit}}/jour) reste affichée à titre informatif et ne porte pas d\'appréciation sur le complément lui-même. À discuter avec un professionnel.' },
      { when: 'veryLow', bodyTemplate: 'Apport en magnésium estimé à {{avg_intake}}{{unit}}/jour en moyenne sur la période analysée, très en dessous de la référence générique de {{daily_target}}{{unit}}/jour (observation du journal, pas un diagnostic). Aliments à ajouter : {{foods}}. À discuter avec un professionnel.' },
      { when: 'default', bodyTemplate: 'Apport en magnésium estimé à {{avg_intake}}{{unit}}/jour en moyenne sur la période analysée, nettement sous la référence générique de {{daily_target}}{{unit}}/jour (observation du journal, pas un diagnostic). Aliments à ajouter : {{foods}}. À discuter avec un professionnel.' }
    ],
    allowedVariables: ['foods', 'avg_intake', 'daily_target', 'unit']
  },
  increase_zinc_sources_v1: {
    id: 'increase_zinc_sources_v1',
    status: 'active',
    variants: [
      { when: 'hasSupplement', bodyTemplate: 'Un complément en zinc a été indiqué dans votre profil. Cette observation du journal (apport moyen estimé à {{avg_intake}}{{unit}}/jour, référence générique {{daily_target}}{{unit}}/jour) reste affichée à titre informatif et ne porte pas d\'appréciation sur le complément lui-même. À discuter avec un professionnel.' },
      { when: 'veryLow', bodyTemplate: 'Apport en zinc estimé à {{avg_intake}}{{unit}}/jour en moyenne sur la période analysée, très en dessous de la référence générique de {{daily_target}}{{unit}}/jour (observation du journal, pas un diagnostic). Aliments à ajouter : {{foods}}. À discuter avec un professionnel.' },
      { when: 'default', bodyTemplate: 'Apport en zinc estimé à {{avg_intake}}{{unit}}/jour en moyenne sur la période analysée, nettement sous la référence générique de {{daily_target}}{{unit}}/jour (observation du journal, pas un diagnostic). Aliments à ajouter : {{foods}}. À discuter avec un professionnel.' }
    ],
    allowedVariables: ['foods', 'avg_intake', 'daily_target', 'unit']
  },
  increase_vitamin_c_sources_v1: {
    id: 'increase_vitamin_c_sources_v1',
    status: 'active',
    variants: [
      { when: 'hasSupplement', bodyTemplate: 'Un complément en vitamine C a été indiqué dans votre profil. Aliments sources repérés {{occurrence_days}} jour(s) sur {{evaluated_days}} analysé(s) (aucune quantité en mg n\'est mesurée, seule la présence de ces aliments est observée). Cette observation reste affichée à titre informatif et ne porte pas d\'appréciation sur le complément lui-même. À discuter avec un professionnel.' },
      { when: 'veryLow', bodyTemplate: 'Aucun aliment habituellement source de vitamine C repéré dans le journal ({{occurrence_days}} jour(s) sur {{evaluated_days}} analysé(s) — observation du journal, pas un diagnostic, aucune quantité en mg n\'est mesurée). Aliments à ajouter : {{foods}}. À discuter avec un professionnel.' },
      { when: 'default', bodyTemplate: 'Sources de vitamine C repérées seulement {{occurrence_days}} jour(s) sur {{evaluated_days}} analysé(s) (observation du journal, pas un diagnostic — aucune quantité en mg n\'est mesurée, seule la présence de ces aliments est observée). Aliments à ajouter : {{foods}}. À discuter avec un professionnel.' }
    ],
    allowedVariables: ['foods', 'occurrence_days', 'evaluated_days']
  },
  increase_vitamin_d_sources_v1: {
    id: 'increase_vitamin_d_sources_v1',
    status: 'active',
    variants: [
      { when: 'hasSupplement', bodyTemplate: 'Un complément en vitamine D a été indiqué dans votre profil. Aliments sources repérés {{occurrence_days}} jour(s) sur {{evaluated_days}} analysé(s) (aucune quantité en µg n\'est mesurée, seule la présence de ces aliments est observée). Cette observation reste affichée à titre informatif et ne porte pas d\'appréciation sur le complément lui-même. À discuter avec un professionnel.' },
      { when: 'veryLow', bodyTemplate: 'Aucun aliment habituellement source de vitamine D repéré dans le journal ({{occurrence_days}} jour(s) sur {{evaluated_days}} analysé(s) — observation du journal, pas un diagnostic, aucune quantité en µg n\'est mesurée). Aliments à ajouter : {{foods}}. À discuter avec un professionnel.' },
      { when: 'default', bodyTemplate: 'Sources de vitamine D repérées seulement {{occurrence_days}} jour(s) sur {{evaluated_days}} analysé(s) (observation du journal, pas un diagnostic — aucune quantité en µg n\'est mesurée, seule la présence de ces aliments est observée). Aliments à ajouter : {{foods}}. À discuter avec un professionnel.' }
    ],
    allowedVariables: ['foods', 'occurrence_days', 'evaluated_days']
  },
  increase_potassium_sources_v1: {
    id: 'increase_potassium_sources_v1',
    status: 'active',
    variants: [
      { when: 'hasSupplement', bodyTemplate: 'Un complément en potassium a été indiqué dans votre profil. Cette observation du journal (apport moyen estimé à {{avg_intake}}{{unit}}/jour, référence générique {{daily_target}}{{unit}}/jour) reste affichée à titre informatif et ne porte pas d\'appréciation sur le complément lui-même. À discuter avec un professionnel.' },
      { when: 'veryLow', bodyTemplate: 'Apport en potassium estimé à {{avg_intake}}{{unit}}/jour en moyenne sur la période analysée, très en dessous de la référence générique de {{daily_target}}{{unit}}/jour (observation du journal, pas un diagnostic). Aliments à ajouter : {{foods}}. À discuter avec un professionnel.' },
      { when: 'default', bodyTemplate: 'Apport en potassium estimé à {{avg_intake}}{{unit}}/jour en moyenne sur la période analysée, nettement sous la référence générique de {{daily_target}}{{unit}}/jour (observation du journal, pas un diagnostic). Aliments à ajouter : {{foods}}. À discuter avec un professionnel.' }
    ],
    allowedVariables: ['foods', 'avg_intake', 'daily_target', 'unit']
  },
  increase_vitamin_b12_sources_v1: {
    id: 'increase_vitamin_b12_sources_v1',
    status: 'active',
    variants: [
      { when: 'hasSupplement', bodyTemplate: 'Un complément en vitamine B12 a été indiqué dans votre profil. Aliments sources repérés {{occurrence_days}} jour(s) sur {{evaluated_days}} analysé(s) (aucune quantité en µg n\'est mesurée, seule la présence de ces aliments est observée). Cette observation reste affichée à titre informatif et ne porte pas d\'appréciation sur le complément lui-même. À discuter avec un professionnel.' },
      { when: 'veryLow', bodyTemplate: 'Aucun aliment habituellement source de vitamine B12 repéré dans le journal ({{occurrence_days}} jour(s) sur {{evaluated_days}} analysé(s) — observation du journal, pas un diagnostic, aucune quantité en µg n\'est mesurée). Aliments à ajouter : {{foods}}. À discuter avec un professionnel.' },
      { when: 'default', bodyTemplate: 'Sources de vitamine B12 repérées seulement {{occurrence_days}} jour(s) sur {{evaluated_days}} analysé(s) (observation du journal, pas un diagnostic — aucune quantité en µg n\'est mesurée, seule la présence de ces aliments est observée). Aliments à ajouter : {{foods}}. À discuter avec un professionnel.' }
    ],
    allowedVariables: ['foods', 'occurrence_days', 'evaluated_days']
  },
  increase_protein_sources_v1: {
    id: 'increase_protein_sources_v1',
    status: 'active',
    variants: [
      { when: 'hasSupplement', bodyTemplate: 'Un complément protéiné a été indiqué dans votre profil. Cette observation du journal (apport moyen estimé à {{avg_intake}}{{unit}}/jour, référence générique {{daily_target}}{{unit}}/jour) reste affichée à titre informatif et ne porte pas d\'appréciation sur le complément lui-même. À discuter avec un professionnel.' },
      { when: 'veryLow', bodyTemplate: 'Apport en protéines estimé à {{avg_intake}}{{unit}}/jour en moyenne sur la période analysée, très en dessous de la référence générique de {{daily_target}}{{unit}}/jour (observation du journal, pas un diagnostic). Aliments à ajouter : {{foods}}. À discuter avec un professionnel.' },
      { when: 'default', bodyTemplate: 'Apport en protéines estimé à {{avg_intake}}{{unit}}/jour en moyenne sur la période analysée, nettement sous la référence générique de {{daily_target}}{{unit}}/jour (observation du journal, pas un diagnostic). Aliments à ajouter : {{foods}}. À discuter avec un professionnel.' }
    ],
    allowedVariables: ['foods', 'avg_intake', 'daily_target', 'unit']
  },
  increase_hydration_v1: {
    id: 'increase_hydration_v1',
    status: 'active',
    bodyTemplate: 'Les prises hydratantes déclarées apparaissent peu souvent dans le journal enregistré sur la période analysée. '
      + 'Cette observation décrit le journal enregistré et ne permet pas de conclure à un état de déshydratation. '
      + 'Parmi les options habituellement disponibles, {{foods}} pourraient être ajoutées au fil de la journée, '
      + 'à discuter avec un professionnel avant toute mise en œuvre.',
    allowedVariables: ['foods']
  },
  increase_food_variety_v1: {
    id: 'increase_food_variety_v1',
    status: 'active',
    bodyTemplate: 'Peu de variété observée dans les repas sur la période analysée (observation du journal, pas un diagnostic). '
      + 'Aliments à essayer : {{foods}}. À discuter avec un professionnel.',
    allowedVariables: ['foods']
  },
  reduce_added_sugar_v1: {
    id: 'reduce_added_sugar_v1',
    status: 'active',
    // Même contrainte que reduce_alcohol_v1 : observation neutre, jamais
    // d'affirmation de conséquence de santé, jamais d'impératif.
    bodyTemplate: 'Une présence répétée d\'aliments riches en sucre ajouté a été observée sur la période analysée. Cette observation '
      + 'décrit le journal enregistré, sans évaluer de quantité ni de conséquence sur la santé. Parmi les aliments habituellement '
      + 'disponibles, {{foods}} pourraient être proposés en échange à certains repas, à discuter avec un professionnel avant toute '
      + 'mise en œuvre.',
    allowedVariables: ['foods']
  },
  reduce_alcohol_v1: {
    id: 'reduce_alcohol_v1',
    status: 'active',
    // Volontairement SANS affirmation de conséquence de santé (aucun
    // "cela provoque...") — observation neutre, alternatives et
    // orientation professionnelle uniquement, cohérent avec
    // forbiddenMessages et la section 3.5/8.3 de la spécification
    // validée (l'IA/le moteur ne diagnostique jamais, n'interprète
    // jamais seul un effet de santé).
    bodyTemplate: 'Une présence répétée d\'alcool a été observée sur la période analysée. Cette observation décrit le journal '
      + 'enregistré, sans évaluer de quantité ni de conséquence sur la santé. Parmi les alternatives sans alcool habituellement '
      + 'disponibles, {{foods}} pourraient être proposées les jours concernés, si cela correspond à ce que vous souhaitez. '
      + 'Un échange avec un professionnel de santé peut être utile pour en discuter plus précisément.',
    allowedVariables: ['foods']
  }
};
