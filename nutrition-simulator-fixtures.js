/* ──────────────────────────────────────────────────────────────────────
   nutrition-simulator-fixtures.js — Profils FICTIFS pour le simulateur
   admin de conseils nutritionnels — Cap Santé

   ⚠️ ÉTAPE ARCHITECTURALE CONFINÉE — voir avertissement complet en tête
   de nutrition-rule-engine.js. Aucune donnée réelle, aucun identifiant
   réel. Format aligné sur les colonnes réelles de la table journal
   (comme nutrition-observation-fixtures.js), avec en plus un objet
   `profile` fictif consommé par nutrition-safety.js /
   nutrition-rule-engine.js (jamais lu depuis une table Supabase ici).
   ────────────────────────────────────────────────────────────────────── */

function nsfEntry(date, repas, aliment, isUltraProcessed) {
  return { date: date, repas: repas, aliment: aliment, quantite: 100, kcal: 150, is_ultra_processed: isUltraProcessed };
}

var NUTRITION_SIMULATOR_FIXTURES = {
  standard_eligible: {
    label: 'Profil fictif — standard, éligible',
    referenceDate: '2026-08-12',
    ruleId: 'reduce_ultra_processed_foods_v1',
    profile: {
      patientId: 'fictif-1',
      age: 34,
      isPregnantOrBreastfeeding: false,
      allergies: [],
      intolerances: [],
      clinicalContext: [],
      symptoms: [],
      diet: null,
      eligibleForAutomatedAdvice: true
    },
    journalEntries: [
      nsfEntry('2026-08-06', 'lunch', 'Plat préparé industriel', true),
      nsfEntry('2026-08-07', 'lunch', 'Plat préparé industriel', true),
      nsfEntry('2026-08-08', 'lunch', 'Plat préparé industriel', true),
      nsfEntry('2026-08-09', 'lunch', 'Plat préparé industriel', true),
      nsfEntry('2026-08-10', 'lunch', 'Plat préparé industriel', true),
      nsfEntry('2026-08-11', 'lunch', 'Plat préparé industriel', true),
      nsfEntry('2026-08-12', 'lunch', 'Plat préparé industriel', true)
    ]
  },

  occasional_social_event_not_a_trend: {
    label: 'Profil fictif — écart ponctuel (sortie sociale), pas une tendance',
    referenceDate: '2026-08-12',
    ruleId: 'reduce_ultra_processed_foods_v1',
    profile: {
      patientId: 'fictif-2',
      age: 29,
      isPregnantOrBreastfeeding: false,
      allergies: [],
      intolerances: [],
      clinicalContext: [],
      symptoms: [],
      diet: null,
      eligibleForAutomatedAdvice: true
    },
    journalEntries: [
      nsfEntry('2026-08-06', 'lunch', 'Poisson vapeur légumes', false),
      nsfEntry('2026-08-07', 'lunch', 'Salade composée', false),
      nsfEntry('2026-08-08', 'dinner', 'Frites (sortie entre amis)', true),
      nsfEntry('2026-08-09', 'lunch', 'Riz et légumineuses', false),
      nsfEntry('2026-08-10', 'lunch', 'Poulet légumes', false),
      nsfEntry('2026-08-11', 'dinner', 'Soupe maison', false),
      nsfEntry('2026-08-12', 'lunch', 'Quinoa légumes', false)
    ]
  },

  allergy_confirmed_nuts: {
    label: 'Profil fictif — allergie fruits à coque confirmée',
    referenceDate: '2026-08-12',
    ruleId: 'reduce_ultra_processed_foods_v1',
    profile: {
      patientId: 'fictif-3',
      age: 41,
      isPregnantOrBreastfeeding: false,
      allergies: [{ code: 'nuts', status: 'confirmed' }],
      intolerances: [],
      clinicalContext: [],
      symptoms: [],
      diet: null,
      eligibleForAutomatedAdvice: true
    },
    journalEntries: [
      nsfEntry('2026-08-06', 'lunch', 'Plat préparé industriel', true),
      nsfEntry('2026-08-07', 'lunch', 'Plat préparé industriel', true),
      nsfEntry('2026-08-08', 'lunch', 'Plat préparé industriel', true),
      nsfEntry('2026-08-09', 'lunch', 'Plat préparé industriel', true),
      nsfEntry('2026-08-10', 'lunch', 'Plat préparé industriel', true),
      nsfEntry('2026-08-11', 'lunch', 'Plat préparé industriel', true),
      nsfEntry('2026-08-12', 'lunch', 'Plat préparé industriel', true)
    ]
  },

  pregnancy_excluded: {
    label: 'Profil fictif — grossesse, exclu du moteur automatisé',
    referenceDate: '2026-08-12',
    ruleId: 'reduce_ultra_processed_foods_v1',
    profile: {
      patientId: 'fictif-4',
      age: 31,
      isPregnantOrBreastfeeding: true,
      allergies: [],
      intolerances: [],
      clinicalContext: [],
      symptoms: [],
      diet: null,
      eligibleForAutomatedAdvice: true
    },
    journalEntries: [
      nsfEntry('2026-08-06', 'lunch', 'Plat préparé industriel', true),
      nsfEntry('2026-08-07', 'lunch', 'Plat préparé industriel', true),
      nsfEntry('2026-08-08', 'lunch', 'Plat préparé industriel', true),
      nsfEntry('2026-08-09', 'lunch', 'Plat préparé industriel', true),
      nsfEntry('2026-08-10', 'lunch', 'Plat préparé industriel', true),
      nsfEntry('2026-08-11', 'lunch', 'Plat préparé industriel', true),
      nsfEntry('2026-08-12', 'lunch', 'Plat préparé industriel', true)
    ]
  },

  not_whitelisted: {
    label: 'Profil fictif — non whitelisté pour le moteur automatisé',
    referenceDate: '2026-08-12',
    ruleId: 'reduce_ultra_processed_foods_v1',
    profile: {
      patientId: 'fictif-5',
      age: 45,
      isPregnantOrBreastfeeding: false,
      allergies: [],
      intolerances: [],
      clinicalContext: [],
      symptoms: [],
      diet: null,
      eligibleForAutomatedAdvice: false
    },
    journalEntries: [
      nsfEntry('2026-08-06', 'lunch', 'Plat préparé industriel', true),
      nsfEntry('2026-08-07', 'lunch', 'Plat préparé industriel', true),
      nsfEntry('2026-08-08', 'lunch', 'Plat préparé industriel', true),
      nsfEntry('2026-08-09', 'lunch', 'Plat préparé industriel', true),
      nsfEntry('2026-08-10', 'lunch', 'Plat préparé industriel', true),
      nsfEntry('2026-08-11', 'lunch', 'Plat préparé industriel', true),
      nsfEntry('2026-08-12', 'lunch', 'Plat préparé industriel', true)
    ]
  }
};
