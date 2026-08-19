/* ──────────────────────────────────────────────────────────────────────
   trend-definitions.js — Registre de DÉFINITIONS de tendances — Cap Santé

   Étape 2 (préparatoire uniquement). Ce fichier décrit des tendances,
   il ne les calcule pas et ne les affiche pas.

   Ce fichier ne contient :
   - aucune fonction, aucun calcul, aucune agrégation ;
   - aucun accès réseau, aucun accès Supabase ;
   - aucune lecture de donnée réelle ou fictive ;
   - aucun diagnostic, aucun conseil, aucune recommandation.

   Ce fichier n'est chargé par aucune page. Il reste volontairement
   orphelin à cette étape — l'intégration (lecture, calcul, affichage)
   fait l'objet d'étapes séparées, non commencées ici.
   ────────────────────────────────────────────────────────────────────── */

var TREND_DEFINITION_REGISTRY = {
  repeated_ultra_processed_foods: {
    id: 'repeated_ultra_processed_foods',
    label: 'Présence répétée d\'aliments ultra-transformés',
    category: 'alimentation',
    enabled: true,
    status: 'active',
    allowedRole: 'admin',
    dataSource: 'journal',
    observationWindowDays: 7,
    minimumAnalyzableDays: 4,
    aggregationUnit: 'day',
    possibleStates: ['present', 'absent', 'insufficient', 'not_evaluated', 'error'],
    neutralMessage:
      'Une présence répétée d\'aliments classés comme ultra-transformés '
      + 'a été observée sur plusieurs journées de la période analysée.',
    insufficientDataMessage:
      'Les données disponibles ne permettent pas d\'évaluer cette tendance '
      + 'pour la période analysée, car la classification de certains '
      + 'aliments est inconnue.',
    limits: [
      'Ne mesure pas la quantité concernée.',
      'Ne mesure pas la fréquence au cours d\'une même journée.',
      'N\'établit aucun lien avec un symptôme ou une pathologie.'
    ],
    validationStatus: 'Non validé par un professionnel',
    forbiddenMessages: [
      'Vous devez arrêter ces aliments.',
      'Votre alimentation est mauvaise.',
      'Cela augmente votre risque de maladie.',
      'Remplacez immédiatement ces aliments.',
      'Vous avez une alimentation déséquilibrée.'
    ]
  },

  journal_coverage: {
    id: 'journal_coverage',
    label: 'Couverture du journal alimentaire',
    category: 'suivi',
    enabled: false,
    status: 'not_implemented',
    allowedRole: 'admin',
    dataSource: 'journal',
    observationWindowDays: 7,
    minimumAnalyzableDays: 4,
    aggregationUnit: 'day',
    possibleStates: ['present', 'absent', 'insufficient', 'not_evaluated', 'error'],
    neutralMessage: null,
    insufficientDataMessage: null,
    limits: [],
    validationStatus: 'Non validé par un professionnel',
    forbiddenMessages: []
  },

  meal_logging_regularity: {
    id: 'meal_logging_regularity',
    label: 'Régularité de la saisie des repas',
    category: 'suivi',
    enabled: false,
    status: 'not_implemented',
    allowedRole: 'admin',
    dataSource: 'journal',
    observationWindowDays: 7,
    minimumAnalyzableDays: 4,
    aggregationUnit: 'day',
    possibleStates: ['present', 'absent', 'insufficient', 'not_evaluated', 'error'],
    neutralMessage: null,
    insufficientDataMessage: null,
    limits: [],
    validationStatus: 'Non validé par un professionnel',
    forbiddenMessages: []
  },

  beverage_logging_presence: {
    id: 'beverage_logging_presence',
    label: 'Présence de boissons dans le journal',
    category: 'hydratation',
    enabled: false,
    status: 'not_implemented',
    allowedRole: 'admin',
    dataSource: 'journal',
    observationWindowDays: 7,
    minimumAnalyzableDays: 4,
    aggregationUnit: 'day',
    possibleStates: ['present', 'absent', 'insufficient', 'not_evaluated', 'error'],
    neutralMessage: null,
    insufficientDataMessage: null,
    limits: [],
    validationStatus: 'Non validé par un professionnel',
    forbiddenMessages: []
  }
};
