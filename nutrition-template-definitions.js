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
  increase_iron_sources_v1: {
    id: 'increase_iron_sources_v1',
    status: 'active',
    bodyTemplate: 'Apport en fer nettement sous la référence sur la période analysée (observation du journal, pas un diagnostic). '
      + 'Aliments à ajouter : {{foods}}. À discuter avec un professionnel.',
    allowedVariables: ['foods']
  },
  increase_calcium_sources_v1: {
    id: 'increase_calcium_sources_v1',
    status: 'active',
    bodyTemplate: 'Apport en calcium nettement sous la référence sur la période analysée (observation du journal, pas un diagnostic). '
      + 'Aliments à ajouter : {{foods}}. À discuter avec un professionnel.',
    allowedVariables: ['foods']
  },
  increase_fiber_sources_v1: {
    id: 'increase_fiber_sources_v1',
    status: 'active',
    bodyTemplate: 'Apport en fibres nettement sous la référence sur la période analysée (observation du journal, pas un diagnostic). '
      + 'Aliments à ajouter : {{foods}}. À discuter avec un professionnel.',
    allowedVariables: ['foods']
  },
  increase_omega3_sources_v1: {
    id: 'increase_omega3_sources_v1',
    status: 'active',
    bodyTemplate: 'Apport en oméga-3 nettement sous la référence sur la période analysée (observation du journal, pas un diagnostic). '
      + 'Aliments à ajouter : {{foods}}. À discuter avec un professionnel.',
    allowedVariables: ['foods']
  },
  increase_magnesium_sources_v1: {
    id: 'increase_magnesium_sources_v1',
    status: 'active',
    bodyTemplate: 'Apport en magnésium nettement sous la référence sur la période analysée (observation du journal, pas un diagnostic). '
      + 'Aliments à ajouter : {{foods}}. À discuter avec un professionnel.',
    allowedVariables: ['foods']
  },
  increase_zinc_sources_v1: {
    id: 'increase_zinc_sources_v1',
    status: 'active',
    bodyTemplate: 'Apport en zinc nettement sous la référence sur la période analysée (observation du journal, pas un diagnostic). '
      + 'Aliments à ajouter : {{foods}}. À discuter avec un professionnel.',
    allowedVariables: ['foods']
  },
  increase_vitamin_c_sources_v1: {
    id: 'increase_vitamin_c_sources_v1',
    status: 'active',
    bodyTemplate: 'Sources de vitamine C peu présentes dans le journal sur la période analysée (observation du journal, pas un diagnostic). '
      + 'Aliments à ajouter : {{foods}}. À discuter avec un professionnel.',
    allowedVariables: ['foods']
  },
  increase_vitamin_d_sources_v1: {
    id: 'increase_vitamin_d_sources_v1',
    status: 'active',
    bodyTemplate: 'Sources de vitamine D peu présentes dans le journal sur la période analysée (observation du journal, pas un diagnostic). '
      + 'Aliments à ajouter : {{foods}}. À discuter avec un professionnel.',
    allowedVariables: ['foods']
  },
  increase_potassium_sources_v1: {
    id: 'increase_potassium_sources_v1',
    status: 'active',
    bodyTemplate: 'Apport en potassium nettement sous la référence sur la période analysée (observation du journal, pas un diagnostic). '
      + 'Aliments à ajouter : {{foods}}. À discuter avec un professionnel.',
    allowedVariables: ['foods']
  },
  increase_vitamin_b12_sources_v1: {
    id: 'increase_vitamin_b12_sources_v1',
    status: 'active',
    bodyTemplate: 'Sources de vitamine B12 peu présentes dans le journal sur la période analysée (observation du journal, pas un diagnostic). '
      + 'Aliments à ajouter : {{foods}}. À discuter avec un professionnel.',
    allowedVariables: ['foods']
  },
  increase_protein_sources_v1: {
    id: 'increase_protein_sources_v1',
    status: 'active',
    bodyTemplate: 'Apport en protéines nettement sous la référence sur la période analysée (observation du journal, pas un diagnostic). '
      + 'Aliments à ajouter : {{foods}}. À discuter avec un professionnel.',
    allowedVariables: ['foods']
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
