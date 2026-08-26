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
      { when: 'default', bodyTemplate: '💡 Point d\'attention : Le fer. Apport estimé à {{avg_intake}}{{unit}}/jour en moyenne, sous la référence générique de {{daily_target}}{{unit}}/jour sur la période analysée. Idées à intégrer selon vos préférences : {{foods}}. Constat indicatif basé sur votre journal, à faire valider avec votre diététicien.' },
      { when: 'default', bodyTemplate: '🥄 Un petit coup de pouce en fer ? Apport moyen de {{avg_intake}}{{unit}}/jour, sous la référence de {{daily_target}}{{unit}}/jour ces derniers jours. Idées simples pour vos prochains repas : {{foods}}. (Mention indicative — à échanger avec votre professionnel)' },
      { when: 'default', bodyTemplate: '🔬 Observation micronutriments : Le fer. Le fer contribue au transport de l\'oxygène dans le sang et à votre énergie au quotidien, mais l\'apport moyen relevé ({{avg_intake}}{{unit}}/jour) reste sous la référence générique de {{daily_target}}{{unit}}/jour sur la période. Pour en ajouter facilement : {{foods}}. Il s\'agit d\'une observation de votre journal, sans dosage médical.' }
    ],
    allowedVariables: ['foods', 'avg_intake', 'daily_target', 'unit']
  },
  increase_calcium_sources_v1: {
    id: 'increase_calcium_sources_v1',
    status: 'active',
    variants: [
      { when: 'hasSupplement', bodyTemplate: 'Un complément en calcium a été indiqué dans votre profil. Cette observation du journal (apport moyen estimé à {{avg_intake}}{{unit}}/jour, référence générique {{daily_target}}{{unit}}/jour) reste affichée à titre informatif et ne porte pas d\'appréciation sur le complément lui-même. À discuter avec un professionnel.' },
      { when: 'veryLow', bodyTemplate: 'Apport en calcium estimé à {{avg_intake}}{{unit}}/jour en moyenne sur la période analysée, très en dessous de la référence générique de {{daily_target}}{{unit}}/jour (observation du journal, pas un diagnostic). Aliments à ajouter : {{foods}}. À discuter avec un professionnel.' },
      { when: 'default', bodyTemplate: '💡 Point d\'attention : Le calcium. Apport estimé à {{avg_intake}}{{unit}}/jour en moyenne, sous la référence générique de {{daily_target}}{{unit}}/jour sur la période analysée. Idées à intégrer selon vos préférences : {{foods}}. Constat indicatif basé sur votre journal, à faire valider avec votre diététicien.' },
      { when: 'default', bodyTemplate: '🥄 Un petit coup de pouce en calcium ? Apport moyen de {{avg_intake}}{{unit}}/jour, sous la référence de {{daily_target}}{{unit}}/jour ces derniers jours. Idées simples pour vos prochains repas : {{foods}}. (Mention indicative — à échanger avec votre professionnel)' },
      { when: 'default', bodyTemplate: '🔬 Observation micronutriments : Le calcium. Le calcium contribue à la solidité des os et des dents, et à la contraction musculaire, mais l\'apport moyen relevé ({{avg_intake}}{{unit}}/jour) reste sous la référence générique de {{daily_target}}{{unit}}/jour sur la période. Pour en ajouter facilement : {{foods}}. Il s\'agit d\'une observation de votre journal, sans dosage médical.' }
    ],
    allowedVariables: ['foods', 'avg_intake', 'daily_target', 'unit']
  },
  increase_fiber_sources_v1: {
    id: 'increase_fiber_sources_v1',
    status: 'active',
    variants: [
      { when: 'hasSupplement', bodyTemplate: 'Un complément en fibres a été indiqué dans votre profil. Cette observation du journal (apport moyen estimé à {{avg_intake}}{{unit}}/jour, référence générique {{daily_target}}{{unit}}/jour) reste affichée à titre informatif et ne porte pas d\'appréciation sur le complément lui-même. À discuter avec un professionnel.' },
      { when: 'veryLow', bodyTemplate: 'Apport en fibres estimé à {{avg_intake}}{{unit}}/jour en moyenne sur la période analysée, très en dessous de la référence générique de {{daily_target}}{{unit}}/jour (observation du journal, pas un diagnostic). Aliments à ajouter : {{foods}}. À discuter avec un professionnel.' },
      { when: 'default', bodyTemplate: '💡 Point d\'attention : Les fibres. Apport estimé à {{avg_intake}}{{unit}}/jour en moyenne, sous la référence générique de {{daily_target}}{{unit}}/jour sur la période analysée. Idées à intégrer selon vos préférences : {{foods}}. Constat indicatif basé sur votre journal, à faire valider avec votre diététicien.' },
      { when: 'default', bodyTemplate: '🥄 Un petit coup de pouce en fibres ? Apport moyen de {{avg_intake}}{{unit}}/jour, sous la référence de {{daily_target}}{{unit}}/jour ces derniers jours. Idées simples pour vos prochains repas : {{foods}}. (Mention indicative — à échanger avec votre professionnel)' },
      { when: 'default', bodyTemplate: '🔬 Observation micronutriments : Les fibres. Les fibres contribue au bon fonctionnement du transit intestinal et à la sensation de satiété, mais l\'apport moyen relevé ({{avg_intake}}{{unit}}/jour) reste sous la référence générique de {{daily_target}}{{unit}}/jour sur la période. Pour en ajouter facilement : {{foods}}. Il s\'agit d\'une observation de votre journal, sans dosage médical.' }
    ],
    allowedVariables: ['foods', 'avg_intake', 'daily_target', 'unit']
  },
  increase_omega3_sources_v1: {
    id: 'increase_omega3_sources_v1',
    status: 'active',
    variants: [
      { when: 'hasSupplement', bodyTemplate: 'Un complément en oméga-3 a été indiqué dans votre profil. Cette observation du journal (apport moyen estimé à {{avg_intake}}{{unit}}/jour, référence générique {{daily_target}}{{unit}}/jour) reste affichée à titre informatif et ne porte pas d\'appréciation sur le complément lui-même. À discuter avec un professionnel.' },
      { when: 'veryLow', bodyTemplate: 'Apport en oméga-3 estimé à {{avg_intake}}{{unit}}/jour en moyenne sur la période analysée, très en dessous de la référence générique de {{daily_target}}{{unit}}/jour (observation du journal, pas un diagnostic). Aliments à ajouter : {{foods}}. À discuter avec un professionnel.' },
      { when: 'default', bodyTemplate: '💡 Point d\'attention : Les oméga-3. Apport estimé à {{avg_intake}}{{unit}}/jour en moyenne, sous la référence générique de {{daily_target}}{{unit}}/jour sur la période analysée. Idées à intégrer selon vos préférences : {{foods}}. Constat indicatif basé sur votre journal, à faire valider avec votre diététicien.' },
      { when: 'default', bodyTemplate: '🥄 Un petit coup de pouce en oméga-3 ? Apport moyen de {{avg_intake}}{{unit}}/jour, sous la référence de {{daily_target}}{{unit}}/jour ces derniers jours. Idées simples pour vos prochains repas : {{foods}}. (Mention indicative — à échanger avec votre professionnel)' },
      { when: 'default', bodyTemplate: '🔬 Observation micronutriments : Les oméga-3. Les oméga-3 contribue à la santé cardiovasculaire et au bon fonctionnement du cerveau, mais l\'apport moyen relevé ({{avg_intake}}{{unit}}/jour) reste sous la référence générique de {{daily_target}}{{unit}}/jour sur la période. Pour en ajouter facilement : {{foods}}. Il s\'agit d\'une observation de votre journal, sans dosage médical.' }
    ],
    allowedVariables: ['foods', 'avg_intake', 'daily_target', 'unit']
  },
  increase_magnesium_sources_v1: {
    id: 'increase_magnesium_sources_v1',
    status: 'active',
    variants: [
      { when: 'hasSupplement', bodyTemplate: 'Un complément en magnésium a été indiqué dans votre profil. Cette observation du journal (apport moyen estimé à {{avg_intake}}{{unit}}/jour, référence générique {{daily_target}}{{unit}}/jour) reste affichée à titre informatif et ne porte pas d\'appréciation sur le complément lui-même. À discuter avec un professionnel.' },
      { when: 'veryLow', bodyTemplate: 'Apport en magnésium estimé à {{avg_intake}}{{unit}}/jour en moyenne sur la période analysée, très en dessous de la référence générique de {{daily_target}}{{unit}}/jour (observation du journal, pas un diagnostic). Aliments à ajouter : {{foods}}. À discuter avec un professionnel.' },
      { when: 'default', bodyTemplate: '💡 Point d\'attention : Le magnésium. Apport estimé à {{avg_intake}}{{unit}}/jour en moyenne, sous la référence générique de {{daily_target}}{{unit}}/jour sur la période analysée. Idées à intégrer selon vos préférences : {{foods}}. Constat indicatif basé sur votre journal, à faire valider avec votre diététicien.' },
      { when: 'default', bodyTemplate: '🥄 Un petit coup de pouce en magnésium ? Apport moyen de {{avg_intake}}{{unit}}/jour, sous la référence de {{daily_target}}{{unit}}/jour ces derniers jours. Idées simples pour vos prochains repas : {{foods}}. (Mention indicative — à échanger avec votre professionnel)' },
      { when: 'default', bodyTemplate: '🔬 Observation micronutriments : Le magnésium. Le magnésium contribue au fonctionnement musculaire et nerveux, et à la gestion de la fatigue, mais l\'apport moyen relevé ({{avg_intake}}{{unit}}/jour) reste sous la référence générique de {{daily_target}}{{unit}}/jour sur la période. Pour en ajouter facilement : {{foods}}. Il s\'agit d\'une observation de votre journal, sans dosage médical.' }
    ],
    allowedVariables: ['foods', 'avg_intake', 'daily_target', 'unit']
  },
  increase_zinc_sources_v1: {
    id: 'increase_zinc_sources_v1',
    status: 'active',
    variants: [
      { when: 'hasSupplement', bodyTemplate: 'Un complément en zinc a été indiqué dans votre profil. Cette observation du journal (apport moyen estimé à {{avg_intake}}{{unit}}/jour, référence générique {{daily_target}}{{unit}}/jour) reste affichée à titre informatif et ne porte pas d\'appréciation sur le complément lui-même. À discuter avec un professionnel.' },
      { when: 'veryLow', bodyTemplate: 'Apport en zinc estimé à {{avg_intake}}{{unit}}/jour en moyenne sur la période analysée, très en dessous de la référence générique de {{daily_target}}{{unit}}/jour (observation du journal, pas un diagnostic). Aliments à ajouter : {{foods}}. À discuter avec un professionnel.' },
      { when: 'default', bodyTemplate: '💡 Point d\'attention : Le zinc. Apport estimé à {{avg_intake}}{{unit}}/jour en moyenne, sous la référence générique de {{daily_target}}{{unit}}/jour sur la période analysée. Idées à intégrer selon vos préférences : {{foods}}. Constat indicatif basé sur votre journal, à faire valider avec votre diététicien.' },
      { when: 'default', bodyTemplate: '🥄 Un petit coup de pouce en zinc ? Apport moyen de {{avg_intake}}{{unit}}/jour, sous la référence de {{daily_target}}{{unit}}/jour ces derniers jours. Idées simples pour vos prochains repas : {{foods}}. (Mention indicative — à échanger avec votre professionnel)' },
      { when: 'default', bodyTemplate: '🔬 Observation micronutriments : Le zinc. Le zinc contribue au système immunitaire et à la cicatrisation, mais l\'apport moyen relevé ({{avg_intake}}{{unit}}/jour) reste sous la référence générique de {{daily_target}}{{unit}}/jour sur la période. Pour en ajouter facilement : {{foods}}. Il s\'agit d\'une observation de votre journal, sans dosage médical.' }
    ],
    allowedVariables: ['foods', 'avg_intake', 'daily_target', 'unit']
  },
  increase_vitamin_c_sources_v1: {
    id: 'increase_vitamin_c_sources_v1',
    status: 'active',
    variants: [
      { when: 'hasSupplement', bodyTemplate: 'Un complément en vitamine C a été indiqué dans votre profil. Aliments sources repérés {{occurrence_days}} jour(s) sur {{evaluated_days}} analysé(s) (aucune quantité en mg n\'est mesurée, seule la présence de ces aliments est observée). Cette observation reste affichée à titre informatif et ne porte pas d\'appréciation sur le complément lui-même. À discuter avec un professionnel.' },
      { when: 'veryLow', bodyTemplate: 'Aucun aliment habituellement source de vitamine C repéré dans le journal ({{occurrence_days}} jour(s) sur {{evaluated_days}} analysé(s) — observation du journal, pas un diagnostic, aucune quantité en mg n\'est mesurée). Aliments à ajouter : {{foods}}. À discuter avec un professionnel.' },
      { when: 'default', bodyTemplate: '💡 Point d\'attention : La vitamine C. Aucune source habituelle identifiée sur les {{evaluated_days}} derniers jours analysés (présente {{occurrence_days}} jour(s)). Idées à intégrer selon vos préférences : {{foods}}. Constat indicatif basé sur votre journal, à faire valider avec votre diététicien.' },
      { when: 'default', bodyTemplate: '🥄 Un petit coup de pouce en vitamine C ? Repérée {{occurrence_days}} jour(s) sur {{evaluated_days}} dans vos repas récents. Idées simples pour vos prochains repas : {{foods}}. (Mention indicative — à échanger avec votre professionnel)' },
      { when: 'default', bodyTemplate: '🔬 Observation micronutriments : La vitamine C. La vitamine C contribue au système immunitaire, à l\'absorption du fer et à son rôle antioxydant, mais elle n\'apparaît que {{occurrence_days}} jour(s) sur {{evaluated_days}} dans vos repas enregistrés. Pour en ajouter facilement : {{foods}}. Il s\'agit d\'une observation de fréquence dans votre journal, sans dosage médical.' }
    ],
    allowedVariables: ['foods', 'occurrence_days', 'evaluated_days']
  },
  increase_vitamin_d_sources_v1: {
    id: 'increase_vitamin_d_sources_v1',
    status: 'active',
    variants: [
      { when: 'hasSupplement', bodyTemplate: 'Un complément en vitamine D a été indiqué dans votre profil. Aliments sources repérés {{occurrence_days}} jour(s) sur {{evaluated_days}} analysé(s) (aucune quantité en µg n\'est mesurée, seule la présence de ces aliments est observée). Cette observation reste affichée à titre informatif et ne porte pas d\'appréciation sur le complément lui-même. À discuter avec un professionnel.' },
      { when: 'veryLow', bodyTemplate: 'Aucun aliment habituellement source de vitamine D repéré dans le journal ({{occurrence_days}} jour(s) sur {{evaluated_days}} analysé(s) — observation du journal, pas un diagnostic, aucune quantité en µg n\'est mesurée). Aliments à ajouter : {{foods}}. À discuter avec un professionnel.' },
      { when: 'default', bodyTemplate: '💡 Point d\'attention : La vitamine D. Aucune source habituelle identifiée sur les {{evaluated_days}} derniers jours analysés (présente {{occurrence_days}} jour(s)). Idées à intégrer selon vos préférences : {{foods}}. Constat indicatif basé sur votre journal, à faire valider avec votre diététicien.' },
      { when: 'default', bodyTemplate: '🥄 Un petit coup de pouce en vitamine D ? Repérée {{occurrence_days}} jour(s) sur {{evaluated_days}} dans vos repas récents. Idées simples pour vos prochains repas : {{foods}}. (Mention indicative — à échanger avec votre professionnel)' },
      { when: 'default', bodyTemplate: '🔬 Observation micronutriments : La vitamine D. La vitamine D contribue à l\'absorption du calcium et à la santé osseuse, mais elle n\'apparaît que {{occurrence_days}} jour(s) sur {{evaluated_days}} dans vos repas enregistrés. Pour en ajouter facilement : {{foods}}. Il s\'agit d\'une observation de fréquence dans votre journal, sans dosage médical.' }
    ],
    allowedVariables: ['foods', 'occurrence_days', 'evaluated_days']
  },
  increase_potassium_sources_v1: {
    id: 'increase_potassium_sources_v1',
    status: 'active',
    variants: [
      { when: 'hasSupplement', bodyTemplate: 'Un complément en potassium a été indiqué dans votre profil. Cette observation du journal (apport moyen estimé à {{avg_intake}}{{unit}}/jour, référence générique {{daily_target}}{{unit}}/jour) reste affichée à titre informatif et ne porte pas d\'appréciation sur le complément lui-même. À discuter avec un professionnel.' },
      { when: 'veryLow', bodyTemplate: 'Apport en potassium estimé à {{avg_intake}}{{unit}}/jour en moyenne sur la période analysée, très en dessous de la référence générique de {{daily_target}}{{unit}}/jour (observation du journal, pas un diagnostic). Aliments à ajouter : {{foods}}. À discuter avec un professionnel.' },
      { when: 'default', bodyTemplate: '💡 Point d\'attention : Le potassium. Apport estimé à {{avg_intake}}{{unit}}/jour en moyenne, sous la référence générique de {{daily_target}}{{unit}}/jour sur la période analysée. Idées à intégrer selon vos préférences : {{foods}}. Constat indicatif basé sur votre journal, à faire valider avec votre diététicien.' },
      { when: 'default', bodyTemplate: '🥄 Un petit coup de pouce en potassium ? Apport moyen de {{avg_intake}}{{unit}}/jour, sous la référence de {{daily_target}}{{unit}}/jour ces derniers jours. Idées simples pour vos prochains repas : {{foods}}. (Mention indicative — à échanger avec votre professionnel)' },
      { when: 'default', bodyTemplate: '🔬 Observation micronutriments : Le potassium. Le potassium contribue à l\'équilibre hydrique et au bon fonctionnement musculaire et cardiaque, mais l\'apport moyen relevé ({{avg_intake}}{{unit}}/jour) reste sous la référence générique de {{daily_target}}{{unit}}/jour sur la période. Pour en ajouter facilement : {{foods}}. Il s\'agit d\'une observation de votre journal, sans dosage médical.' }
    ],
    allowedVariables: ['foods', 'avg_intake', 'daily_target', 'unit']
  },
  // Bascule sur le modèle "quantité" (comme fer/calcium) maintenant que
  // food_vitb12_100 existe (enrichissement Ciqual, voir
  // enrich-ciqual-micronutriments) -- avg_intake/daily_target/unit au lieu
  // de occurrence_days/evaluated_days.
  increase_vitamin_b12_sources_v1: {
    id: 'increase_vitamin_b12_sources_v1',
    status: 'active',
    variants: [
      { when: 'hasSupplement', bodyTemplate: 'Un complément en vitamine B12 a été indiqué dans votre profil. Cette observation du journal (apport moyen estimé à {{avg_intake}}{{unit}}/jour, référence générique {{daily_target}}{{unit}}/jour) reste affichée à titre informatif et ne porte pas d\'appréciation sur le complément lui-même. À discuter avec un professionnel.' },
      { when: 'veryLow', bodyTemplate: 'Apport en vitamine B12 estimé à {{avg_intake}}{{unit}}/jour en moyenne sur la période analysée, très en dessous de la référence générique de {{daily_target}}{{unit}}/jour (observation du journal, pas un diagnostic). Aliments à ajouter : {{foods}}. À discuter avec un professionnel.' },
      { when: 'default', bodyTemplate: '💡 Point d\'attention : La vitamine B12. Apport estimé à {{avg_intake}}{{unit}}/jour en moyenne, sous la référence générique de {{daily_target}}{{unit}}/jour sur la période analysée. Idées à intégrer selon vos préférences : {{foods}}. Constat indicatif basé sur votre journal, à faire valider avec votre diététicien.' },
      { when: 'default', bodyTemplate: '🥄 Un petit coup de pouce en vitamine B12 ? Apport moyen de {{avg_intake}}{{unit}}/jour, sous la référence de {{daily_target}}{{unit}}/jour ces derniers jours. Idées simples pour vos prochains repas : {{foods}}. (Mention indicative — à échanger avec votre professionnel)' },
      { when: 'default', bodyTemplate: '🔬 Observation micronutriments : La vitamine B12. La vitamine B12 contribue à l\'énergie et au bon fonctionnement du système nerveux, mais l\'apport moyen relevé ({{avg_intake}}{{unit}}/jour) reste sous la référence générique de {{daily_target}}{{unit}}/jour sur la période. Pour en ajouter facilement : {{foods}}. Il s\'agit d\'une observation de votre journal, sans dosage médical.' }
    ],
    allowedVariables: ['foods', 'avg_intake', 'daily_target', 'unit']
  },
  increase_protein_sources_v1: {
    id: 'increase_protein_sources_v1',
    status: 'active',
    variants: [
      { when: 'hasSupplement', bodyTemplate: 'Un complément protéiné a été indiqué dans votre profil. Cette observation du journal (apport moyen estimé à {{avg_intake}}{{unit}}/jour, référence générique {{daily_target}}{{unit}}/jour) reste affichée à titre informatif et ne porte pas d\'appréciation sur le complément lui-même. À discuter avec un professionnel.' },
      { when: 'veryLow', bodyTemplate: 'Apport en protéines estimé à {{avg_intake}}{{unit}}/jour en moyenne sur la période analysée, très en dessous de la référence générique de {{daily_target}}{{unit}}/jour (observation du journal, pas un diagnostic). Aliments à ajouter : {{foods}}. À discuter avec un professionnel.' },
      { when: 'default', bodyTemplate: '💡 Point d\'attention : Les protéines. Apport estimé à {{avg_intake}}{{unit}}/jour en moyenne, sous la référence générique de {{daily_target}}{{unit}}/jour sur la période analysée. Idées à intégrer selon vos préférences : {{foods}}. Constat indicatif basé sur votre journal, à faire valider avec votre diététicien.' },
      { when: 'default', bodyTemplate: '🥄 Un petit coup de pouce en protéines ? Apport moyen de {{avg_intake}}{{unit}}/jour, sous la référence de {{daily_target}}{{unit}}/jour ces derniers jours. Idées simples pour vos prochains repas : {{foods}}. (Mention indicative — à échanger avec votre professionnel)' },
      { when: 'default', bodyTemplate: '🔬 Observation micronutriments : Les protéines. Les protéines contribue à la construction et à la réparation musculaire, et à la sensation de satiété, mais l\'apport moyen relevé ({{avg_intake}}{{unit}}/jour) reste sous la référence générique de {{daily_target}}{{unit}}/jour sur la période. Pour en ajouter facilement : {{foods}}. Il s\'agit d\'une observation de votre journal, sans dosage médical.' }
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
