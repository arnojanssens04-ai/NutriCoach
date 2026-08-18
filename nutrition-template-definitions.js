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
    // Placeholder unique : {{foods}}. Aucun autre champ interpolé.
    bodyTemplate: 'Une présence répétée d\'aliments ultra-transformés a été observée sur la période analysée. '
      + 'Parmi les aliments habituellement disponibles, {{foods}} pourraient être proposés en échange, '
      + 'à discuter avec un professionnel avant toute mise en œuvre.',
    allowedVariables: ['foods']
  },

  // Gabarits ajoutés pour les signaux nutriment/alcool — même contrainte :
  // un seul placeholder {{foods}}, formulation conditionnelle et non
  // prescriptive, jamais de diagnostic de carence, jamais d'impératif,
  // jamais d'affirmation de cause à effet sur la santé.
  increase_iron_sources_v1: {
    id: 'increase_iron_sources_v1',
    status: 'active',
    bodyTemplate: 'Les sources alimentaires de fer apparaissent peu souvent dans les repas enregistrés sur la période analysée. '
      + 'Cette observation décrit le journal enregistré et ne permet pas de conclure à une carence. '
      + 'Parmi les aliments habituellement disponibles, {{foods}} pourraient être ajoutés à certains repas, '
      + 'à discuter avec un professionnel avant toute mise en œuvre.',
    allowedVariables: ['foods']
  },
  increase_calcium_sources_v1: {
    id: 'increase_calcium_sources_v1',
    status: 'active',
    bodyTemplate: 'Les sources alimentaires de calcium apparaissent peu souvent dans les repas enregistrés sur la période analysée. '
      + 'Cette observation décrit le journal enregistré et ne permet pas de conclure à une carence. '
      + 'Parmi les aliments habituellement disponibles, {{foods}} pourraient être ajoutés à certains repas, '
      + 'à discuter avec un professionnel avant toute mise en œuvre.',
    allowedVariables: ['foods']
  },
  increase_fiber_sources_v1: {
    id: 'increase_fiber_sources_v1',
    status: 'active',
    bodyTemplate: 'Les sources alimentaires de fibres apparaissent peu souvent dans les repas enregistrés sur la période analysée. '
      + 'Cette observation décrit le journal enregistré et ne permet pas de conclure à une carence. '
      + 'Parmi les aliments habituellement disponibles, {{foods}} pourraient être ajoutés à certains repas, '
      + 'à discuter avec un professionnel avant toute mise en œuvre.',
    allowedVariables: ['foods']
  },
  increase_omega3_sources_v1: {
    id: 'increase_omega3_sources_v1',
    status: 'active',
    bodyTemplate: 'Les sources alimentaires d\'oméga-3 apparaissent peu souvent dans les repas enregistrés sur la période analysée. '
      + 'Cette observation décrit le journal enregistré et ne permet pas de conclure à une carence. '
      + 'Parmi les aliments habituellement disponibles, {{foods}} pourraient être ajoutés à certains repas, '
      + 'à discuter avec un professionnel avant toute mise en œuvre.',
    allowedVariables: ['foods']
  },
  increase_magnesium_sources_v1: {
    id: 'increase_magnesium_sources_v1',
    status: 'active',
    bodyTemplate: 'Les sources alimentaires de magnésium apparaissent peu souvent dans les repas enregistrés sur la période analysée. '
      + 'Cette observation décrit le journal enregistré et ne permet pas de conclure à une carence. '
      + 'Parmi les aliments habituellement disponibles, {{foods}} pourraient être ajoutés à certains repas, '
      + 'à discuter avec un professionnel avant toute mise en œuvre.',
    allowedVariables: ['foods']
  },
  increase_zinc_sources_v1: {
    id: 'increase_zinc_sources_v1',
    status: 'active',
    bodyTemplate: 'Les sources alimentaires de zinc apparaissent peu souvent dans les repas enregistrés sur la période analysée. '
      + 'Cette observation décrit le journal enregistré et ne permet pas de conclure à une carence. '
      + 'Parmi les aliments habituellement disponibles, {{foods}} pourraient être ajoutés à certains repas, '
      + 'à discuter avec un professionnel avant toute mise en œuvre.',
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
